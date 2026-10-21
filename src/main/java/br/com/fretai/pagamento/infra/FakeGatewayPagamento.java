package br.com.fretai.pagamento.infra;

import br.com.fretai.pagamento.domain.GatewayPagamento;
import br.com.fretai.pagamento.domain.WebhookInvalidoException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

/**
 * PSP de mentira, em memória. Padrão em desenvolvimento e testes: nenhum
 * dinheiro, nenhuma chave, nenhuma rede.
 *
 * Para simular o Pix caindo, mande ao webhook (cabeçalho X-Webhook-Token):
 * <pre>{"idEvento": "evt-1", "tipo": "PAGAMENTO_CONFIRMADO", "cobrancaId": "fake_cob_..."}</pre>
 */
@Component
// Ativo em todo profile que não seja "asaas": nunca há dois PSPs ao mesmo tempo.
@Profile("!asaas")
public class FakeGatewayPagamento implements GatewayPagamento {

    static final String CABECALHO_TOKEN = "x-webhook-token";

    private final JsonMapper json;
    private final byte[] tokenWebhook;
    private final Set<String> cobrancas = ConcurrentHashMap.newKeySet();
    private final Set<String> estornadas = ConcurrentHashMap.newKeySet();
    private final List<Transferencia> transferencias = new CopyOnWriteArrayList<>();

    FakeGatewayPagamento(JsonMapper json, @Value("${fretai.pagamento.fake.webhook-token}") String tokenWebhook) {
        this.json = json;
        this.tokenWebhook = tokenWebhook.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public String nome() {
        return "fake";
    }

    @Override
    public CobrancaPix criarCobrancaPix(NovaCobranca cobranca) {
        String id = "fake_cob_" + UUID.randomUUID();
        cobrancas.add(id);
        String copiaECola = "00020126FAKE" + cobranca.referencia() + "5204000053039865406" + cobranca.valor();
        return new CobrancaPix(id, copiaECola,
                Base64.getEncoder().encodeToString(copiaECola.getBytes(StandardCharsets.UTF_8)));
    }

    @Override
    public String transferirPix(Transferencia transferencia) {
        transferencias.add(transferencia);
        return "fake_trf_" + UUID.randomUUID();
    }

    @Override
    public void estornar(String cobrancaId) {
        estornadas.add(cobrancaId);
    }

    @Override
    public Optional<NotificacaoPagamento> lerWebhook(String corpo, Map<String, String> cabecalhos) {
        String token = cabecalhos.getOrDefault(CABECALHO_TOKEN, "");
        if (!MessageDigest.isEqual(tokenWebhook, token.getBytes(StandardCharsets.UTF_8))) {
            throw new WebhookInvalidoException("Token do webhook inválido.");
        }
        EventoFake evento;
        try {
            evento = json.readValue(corpo, EventoFake.class);
        } catch (JacksonException e) {
            throw new IllegalArgumentException("Corpo do webhook não é um JSON válido.");
        }
        if (evento.idEvento() == null || evento.cobrancaId() == null || evento.tipo() == null) {
            throw new IllegalArgumentException("Webhook incompleto: idEvento, tipo e cobrancaId são obrigatórios.");
        }
        return Optional.of(new NotificacaoPagamento(evento.idEvento(), evento.tipo(), evento.cobrancaId()));
    }

    /** Para os testes conferirem o que "saiu" do PSP. */
    public List<Transferencia> transferencias() {
        return List.copyOf(transferencias);
    }

    public boolean foiEstornada(String cobrancaId) {
        return estornadas.contains(cobrancaId);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record EventoFake(String idEvento, TipoNotificacao tipo, String cobrancaId) {
    }
}
