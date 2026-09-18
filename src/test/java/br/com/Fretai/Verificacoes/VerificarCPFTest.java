package br.com.Fretai.Verificacoes;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Testes de Validação e Formatação de CPF")
class VerificarCPFTest {

    @ParameterizedTest(name = "CPF válido: {0}")
    @ValueSource(strings = {
            "52998224725",
            "529.982.247-25",
            "11144477735",
            "111.444.777-35",
            "12345678909",
            "123.456.789-09",
            "06390199007",
            "063.901.990-07"
    })
    @DisplayName("Deve validar com sucesso CPFs reais matematicamente válidos (com ou sem máscara)")
    void deveValidarCpfsValidos(String cpf) {
        assertTrue(VerificarCPF.isCPF(cpf));
        assertTrue(VerificarCPF.isValido(cpf));
    }

    @ParameterizedTest(name = "CPF com dígitos repetidos: {0}")
    @ValueSource(strings = {
            "00000000000",
            "11111111111",
            "22222222222",
            "33333333333",
            "44444444444",
            "55555555555",
            "66666666666",
            "77777777777",
            "88888888888",
            "99999999999",
            "000.000.000-00",
            "111.111.111-11"
    })
    @DisplayName("Deve rejeitar CPFs com sequências de dígitos repetidos")
    void deveRejeitarCpfsComDigitosRepetidos(String cpf) {
        assertFalse(VerificarCPF.isCPF(cpf));
    }

    @ParameterizedTest(name = "CPF com dígito verificador inválido: {0}")
    @ValueSource(strings = {
            "52998224724", // 2º dígito alterado (era 5)
            "52998224715", // 1º dígito alterado (era 2)
            "11144477730", // 2º dígito alterado (era 5)
            "12345678900"  // 2º dígito alterado (era 9)
    })
    @DisplayName("Deve rejeitar CPFs cujos dígitos verificadores não conferem")
    void deveRejeitarCpfsComDigitosIncorretos(String cpf) {
        assertFalse(VerificarCPF.isCPF(cpf));
    }

    @ParameterizedTest(name = "Entrada inválida/malformada: \"{0}\"")
    @ValueSource(strings = {
            "",
            "   ",
            "123",
            "123456789",
            "123456789012",
            "abcdefghijk",
            "529.982.24A-25"
    })
    @DisplayName("Deve rejeitar strings vazias, de tamanho incompatível ou com caracteres alfabéticos")
    void deveRejeitarEntradasMalformadas(String cpfInvalido) {
        assertFalse(VerificarCPF.isCPF(cpfInvalido));
    }

    @Test
    @DisplayName("Deve retornar false para argumento null de forma segura sem lançar NullPointerException")
    void deveRetornarFalseParaCpfNull() {
        assertFalse(VerificarCPF.isCPF(null));
        assertFalse(VerificarCPF.isValido(null));
    }

    @Test
    @DisplayName("Deve formatar corretamente CPF com 11 dígitos numéricos")
    void deveFormatarCpfCorretamente() {
        String formatado = VerificarCPF.formatar("52998224725");
        assertEquals("529.982.247-25", formatado);

        // Deve manter formatação se já estiver formatado
        assertEquals("529.982.247-25", VerificarCPF.formatar("529.982.247-25"));

        // Método legado imprimeCPF
        assertEquals("529.982.247-25", VerificarCPF.imprimeCPF("52998224725"));
    }

    @Test
    @DisplayName("Deve tratar de forma segura formatação de strings inválidas ou nulas")
    void deveTratarFormatacaoDefensiva() {
        assertNull(VerificarCPF.formatar(null));
        assertEquals("123", VerificarCPF.formatar("123"));
    }
}
