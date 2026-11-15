package br.com.fretai.pagamento.infra;

import br.com.fretai.shared.exception.ServicoExternoIndisponivelException;
import br.com.fretai.support.ServidorHttpFalso;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import tools.jackson.databind.json.JsonMapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/** Contra um servidor local: confere as chamadas que saem, não o Asaas de verdade. */
@DisplayName("Asaas: estorno de cobrança")
class AsaasGatewayPagamentoTest {

    private final ServidorHttpFalso servidor = new ServidorHttpFalso();

    @AfterEach
    void parar() {
        servidor.close();
    }

    /** O gateway só sobe com URL de sandbox. */
    private AsaasGatewayPagamento asaas() {
        return new AsaasGatewayPagamento(servidor.url() + "/sandbox", "chave-de-teste", "token-do-webhook",
                Duration.ofSeconds(2), JsonMapper.builder().build());
    }

    @ParameterizedTest(name = "{0}")
    @ValueSource(strings = {"PENDING", "OVERDUE"})
    @DisplayName("Cobrança ainda não paga é excluída: o Asaas não estorna o que não recebeu")
    void cobrancaAbertaEExcluida(String status) {
        servidor.responder(200, cobranca(status, false));

        asaas().estornar("pay_1");

        assertEquals(List.of("GET /sandbox/payments/pay_1", "DELETE /sandbox/payments/pay_1"), servidor.chamadas());
    }

    @ParameterizedTest(name = "{0}")
    @ValueSource(strings = {"RECEIVED", "CONFIRMED"})
    @DisplayName("Cobrança paga é devolvida ao pagador")
    void cobrancaPagaEDevolvida(String status) {
        servidor.responder(200, cobranca(status, false));

        asaas().estornar("pay_1");

        assertEquals(List.of("GET /sandbox/payments/pay_1", "POST /sandbox/payments/pay_1/refund"),
                servidor.chamadas());
    }

    @ParameterizedTest(name = "{0}")
    @ValueSource(strings = {"REFUNDED", "REFUND_REQUESTED", "REFUND_IN_PROGRESS"})
    @DisplayName("Nova tentativa de um estorno que já tinha passado não pede a devolução de novo")
    void jaDevolvidaNaoPedeDeNovo(String status) {
        servidor.responder(200, cobranca(status, false));

        asaas().estornar("pay_1");

        assertEquals(List.of("GET /sandbox/payments/pay_1"), servidor.chamadas());
    }

    @Test
    @DisplayName("Cobrança que já foi excluída não é excluída de novo")
    void jaExcluida() {
        servidor.responder(200, cobranca("PENDING", true));

        asaas().estornar("pay_1");

        assertEquals(List.of("GET /sandbox/payments/pay_1"), servidor.chamadas());
    }

    @Test
    @DisplayName("Asaas fora do ar: o erro sobe, para o job tentar de novo")
    void foraDoAr() {
        servidor.responder(500, "{}");

        assertThrows(ServicoExternoIndisponivelException.class, () -> asaas().estornar("pay_1"));
    }

    private static String cobranca(String status, boolean excluida) {
        return """
                {"object": "payment", "id": "pay_1", "status": "%s", "deleted": %s, "value": 100.0}"""
                .formatted(status, excluida);
    }
}
