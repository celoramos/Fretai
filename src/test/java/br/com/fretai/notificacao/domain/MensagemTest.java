package br.com.fretai.notificacao.domain;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

@DisplayName("Mensagem de notificação: o telefone sai sempre como DDD + número, só com dígitos")
class MensagemTest {

    private static String telefoneDe(String comoFoiGuardado) {
        return new Notificador.Mensagem(comoFoiGuardado, TipoNotificacao.ENTREGA_REGISTRADA, "texto", List.of()).telefone();
    }

    @ParameterizedTest(name = "\"{0}\" vira {1}")
    @CsvSource(delimiter = '|', value = {
            // O telefone de quem recebe a carga é guardado como a pessoa digitou no pedido.
            "(21) 97777-6666   | 21977776666",
            "21 97777-6666     | 21977776666",
            // O do cadastro vem só com dígitos, mas com o 55 na frente quando foi digitado "+55 71 ...".
            "5571988771234     | 71988771234",
            "+55 71 98877-1234 | 71988771234",
            "551133334444      | 1133334444",
            // Já no formato certo: não muda.
            "71988771234       | 71988771234",
            "1133334444        | 1133334444",
            // DDD 55 (interior do Rio Grande do Sul) não é o código do país.
            "(55) 99988-7766   | 55999887766",
            "5532104400        | 5532104400",
            "+55 55 99988-7766 | 55999887766",
    })
    void telefoneNormalizado(String comoFoiGuardado, String esperado) {
        assertEquals(esperado, telefoneDe(comoFoiGuardado));
    }

    @Test
    @DisplayName("Sem telefone continua sem telefone: quem envia decide o que fazer")
    void semTelefone() {
        assertNull(telefoneDe(null));
        assertEquals("", telefoneDe("  "));
    }
}
