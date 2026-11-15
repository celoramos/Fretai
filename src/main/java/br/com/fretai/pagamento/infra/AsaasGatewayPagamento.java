package br.com.fretai.pagamento.infra;

import br.com.fretai.pagamento.domain.GatewayPagamento;
import br.com.fretai.pagamento.domain.WebhookInvalidoException;
import br.com.fretai.shared.exception.ServicoExternoIndisponivelException;
import br.com.fretai.shared.infra.RestClients;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

/**
 * Asaas (https://docs.asaas.com), SOMENTE SANDBOX. Ativado pelo profile
 * {@code asaas}; a aplicação não sobe se a URL não for a do sandbox.
 *
 * Retenção: nesta versão o valor cai na conta Asaas da plataforma e sai por
 * transferência Pix ao motorista. Para custódia de verdade em produção (o
 * Fretaí não tocando no dinheiro nem contabilmente), usar subcontas com split
 * ou a conta escrow do PSP; isso exige contrato e não foi implementado.
 *
 * Integração escrita a partir da documentação pública, sem teste contra o
 * sandbox (exige conta e chave). Conferir os campos antes de usar.
 */
@Component
@Profile("asaas")
class AsaasGatewayPagamento implements GatewayPagamento {

    private static final Logger log = LoggerFactory.getLogger(AsaasGatewayPagamento.class);
    static final String CABECALHO_TOKEN = "asaas-access-token";
    /** Status da cobrança no Asaas: ainda não paga (a vencida continua pagável). */
    private static final Set<String> ABERTA = Set.of("PENDING", "OVERDUE");
    private static final Set<String> JA_DEVOLVIDA = Set.of("REFUNDED", "REFUND_REQUESTED", "REFUND_IN_PROGRESS");

    private final RestClient api;
    private final JsonMapper json;
    private final byte[] tokenWebhook;
    /** CPF/CNPJ → id do cliente no Asaas, para não recriar o mesmo pagador a cada cobrança. */
    private final Map<String, String> clientes = new ConcurrentHashMap<>();

    AsaasGatewayPagamento(@Value("${fretai.pagamento.asaas.url}") String url,
                          @Value("${fretai.pagamento.asaas.chave}") String chave,
                          @Value("${fretai.pagamento.asaas.webhook-token}") String tokenWebhook,
                          @Value("${fretai.pagamento.asaas.timeout:10s}") Duration timeout,
                          JsonMapper json) {
        if (!url.contains("sandbox")) {
            throw new IllegalStateException("O Fretaí só integra com o SANDBOX do Asaas. URL recebida: " + url);
        }
        if (chave.isBlank() || tokenWebhook.isBlank()) {
            throw new IllegalStateException("Defina ASAAS_CHAVE e ASAAS_WEBHOOK_TOKEN para usar o profile asaas.");
        }
        this.api = RestClients.comTimeout(url, timeout).defaultHeader("access_token", chave).build();
        this.json = json;
        this.tokenWebhook = tokenWebhook.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public String nome() {
        return "asaas";
    }

    @Override
    public CobrancaPix criarCobrancaPix(NovaCobranca c) {
        String cliente = clientes.computeIfAbsent(c.documento(), doc -> {
            Map<String, Object> pagador = new HashMap<>(Map.of("name", c.nomePagador(), "cpfCnpj", doc));
            if (c.emailPagador() != null) {
                pagador.put("email", c.emailPagador());
            }
            return chamar(() -> api.post().uri("/customers").body(pagador).retrieve().body(Id.class)).id();
        });

        Id cobranca = chamar(() -> api.post().uri("/payments").body(Map.of(
                        "customer", cliente,
                        "billingType", "PIX",
                        "value", c.valor(),
                        "dueDate", c.vencimento().toString(),
                        "description", c.descricao(),
                        "externalReference", c.referencia()))
                .retrieve().body(Id.class));
        QrCode qr = chamar(() -> api.get().uri("/payments/{id}/pixQrCode", cobranca.id())
                .retrieve().body(QrCode.class));
        return new CobrancaPix(cobranca.id(), qr.payload(), qr.encodedImage());
    }

    @Override
    public String transferirPix(Transferencia t) {
        return chamar(() -> api.post().uri("/transfers").body(Map.of(
                        "value", t.valor(),
                        "pixAddressKey", t.chavePix(),
                        "pixAddressKeyType", tipoChave(t.chavePix()),
                        "description", t.descricao(),
                        "externalReference", t.referencia()))
                .retrieve().body(Id.class)).id();
    }

    /**
     * O Asaas só estorna o que recebeu: cobrança ainda aberta é excluída, e o QR Code deixa de valer.
     * Quem diz em que pé a cobrança está é ele, não o nosso banco, que pode estar um webhook atrás.
     * Excluída ou já devolvida, não há o que fazer: é a nova tentativa de um estorno que tinha passado.
     */
    @Override
    public void estornar(String cobrancaId) {
        Situacao cobranca = chamar(() -> api.get().uri("/payments/{id}", cobrancaId).retrieve().body(Situacao.class));
        String status = cobranca == null || cobranca.status() == null ? "" : cobranca.status();
        if ((cobranca != null && Boolean.TRUE.equals(cobranca.deleted())) || JA_DEVOLVIDA.contains(status)) {
            return;
        }
        if (ABERTA.contains(status)) {
            chamar(() -> api.delete().uri("/payments/{id}", cobrancaId).retrieve().toBodilessEntity());
        } else {
            chamar(() -> api.post().uri("/payments/{id}/refund", cobrancaId).retrieve().toBodilessEntity());
        }
    }

    /** O Asaas manda o token configurado no painel no cabeçalho asaas-access-token. */
    @Override
    public Optional<NotificacaoPagamento> lerWebhook(String corpo, Map<String, String> cabecalhos) {
        String token = cabecalhos.getOrDefault(CABECALHO_TOKEN, "");
        if (!MessageDigest.isEqual(tokenWebhook, token.getBytes(StandardCharsets.UTF_8))) {
            throw new WebhookInvalidoException("Token do webhook do Asaas inválido.");
        }
        EventoAsaas evento;
        try {
            evento = json.readValue(corpo, EventoAsaas.class);
        } catch (JacksonException e) {
            throw new IllegalArgumentException("Corpo do webhook não é um JSON válido.");
        }
        TipoNotificacao tipo = switch (evento.event() == null ? "" : evento.event()) {
            case "PAYMENT_RECEIVED", "PAYMENT_CONFIRMED" -> TipoNotificacao.PAGAMENTO_CONFIRMADO;
            case "PAYMENT_REFUNDED" -> TipoNotificacao.PAGAMENTO_ESTORNADO;
            default -> null;
        };
        if (tipo == null || evento.payment() == null) {
            log.debug("Evento do Asaas ignorado: {}", evento.event());
            return Optional.empty();
        }
        return Optional.of(new NotificacaoPagamento(evento.id(), tipo, evento.payment().id()));
    }

    private static String tipoChave(String chave) {
        if (chave.contains("@")) return "EMAIL";
        if (chave.startsWith("+")) return "PHONE";
        if (chave.matches("\\d{11}")) return "CPF";
        if (chave.matches("\\d{14}")) return "CNPJ";
        return "EVP";
    }

    private static <T> T chamar(java.util.function.Supplier<T> chamada) {
        try {
            return chamada.get();
        } catch (RestClientException e) {
            throw new ServicoExternoIndisponivelException("PSP indisponível",
                    "Não foi possível falar com o provedor de pagamento. Tente de novo.", e);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Id(String id) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record QrCode(String encodedImage, String payload) {
    }

    /** O que interessa de GET /payments/{id}. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    record Situacao(String status, Boolean deleted) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record EventoAsaas(String id, String event, Cobranca payment) {
        @JsonIgnoreProperties(ignoreUnknown = true)
        record Cobranca(String id, BigDecimal value) {
        }
    }
}
