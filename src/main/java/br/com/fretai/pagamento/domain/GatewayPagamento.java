package br.com.fretai.pagamento.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

/**
 * Porta para o PSP (provedor de pagamento). O Fretaí nunca toca no dinheiro:
 * pede a cobrança, é avisado pelo webhook e manda o PSP transferir.
 * <ul>
 *   <li>{@code FakeGatewayPagamento}: em memória, padrão em desenvolvimento e testes;</li>
 *   <li>{@code AsaasGatewayPagamento}: sandbox do Asaas, só com o profile {@code asaas}.</li>
 * </ul>
 */
public interface GatewayPagamento {

    /** Nome curto para gravar junto do pagamento (ex.: "fake", "asaas"). */
    String nome();

    CobrancaPix criarCobrancaPix(NovaCobranca cobranca);

    /** @return id da transferência no PSP */
    String transferirPix(Transferencia transferencia);

    /** Cancela a cobrança ainda não paga, ou devolve o valor ao pagador se já foi paga. */
    void estornar(String cobrancaId);

    /**
     * Confere a autenticidade do webhook e traduz para o formato do Fretaí.
     *
     * @return vazio para eventos que não interessam (ex.: cobrança criada)
     * @throws WebhookInvalidoException se a assinatura/token não confere
     */
    Optional<NotificacaoPagamento> lerWebhook(String corpo, Map<String, String> cabecalhos);

    /**
     * @param referencia id do pagamento no Fretaí; volta nos webhooks
     * @param documento  CPF ou CNPJ do pagador, só dígitos (CNPJ alfanumérico quando for o caso)
     */
    record NovaCobranca(String referencia, BigDecimal valor, LocalDate vencimento, String descricao,
                        String nomePagador, String documento, String emailPagador) {
    }

    /** @param qrCodeBase64 imagem PNG do QR Code em base64 */
    record CobrancaPix(String id, String copiaECola, String qrCodeBase64) {
    }

    record Transferencia(String referencia, BigDecimal valor, String chavePix, String descricao) {
    }

    enum TipoNotificacao {PAGAMENTO_CONFIRMADO, PAGAMENTO_ESTORNADO}

    /** @param idEvento chave de idempotência: o mesmo evento reenviado tem o mesmo id */
    record NotificacaoPagamento(String idEvento, TipoNotificacao tipo, String cobrancaId) {
    }
}
