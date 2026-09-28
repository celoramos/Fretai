package br.com.fretai.empresa.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Validação de CNPJ (numérico e alfanumérico)")
class EmpresaGatewayTest {

    @Test
    @DisplayName("CNPJ numérico com máscara é normalizado")
    void numerico() {
        assertEquals("19131243000197", EmpresaGateway.normalizarCnpj("19.131.243/0001-97"));
    }

    @Test
    @DisplayName("CNPJ alfanumérico (exemplo oficial da Receita), com letras minúsculas")
    void alfanumerico() {
        assertEquals("12ABC34501DE35", EmpresaGateway.normalizarCnpj("12.abc.345/01de-35"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"19131243000198", "12ABC34501DE36", "1913124300019", "00000000000000", "12ABC34501DEAB", ""})
    @DisplayName("Dígito errado, tamanho errado, repetido ou DV com letra → inválido")
    void invalidos(String cnpj) {
        assertThrows(IllegalArgumentException.class, () -> EmpresaGateway.normalizarCnpj(cnpj));
    }
}
