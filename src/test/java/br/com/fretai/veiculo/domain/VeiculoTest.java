package br.com.fretai.veiculo.domain;

import br.com.fretai.support.Fixtures;
import br.com.fretai.usuario.domain.CategoriaVeiculo;
import br.com.fretai.usuario.domain.Motorista;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Veículo")
class VeiculoTest {

    private final Motorista motorista = Fixtures.motorista(CategoriaVeiculo.CAMINHAO);

    @Test
    @DisplayName("Normaliza placa e RNTRC")
    void normaliza() {
        Veiculo veiculo = new Veiculo(motorista, "abc-1d23", "1234.5678", TipoVeiculo.TRUCK,
                TipoCarroceria.BAU, 3, false);

        assertEquals("ABC1D23", veiculo.getPlaca());
        assertEquals("12345678", veiculo.getRntrc());
        assertTrue(veiculo.isAtivo());
    }

    @ParameterizedTest
    @ValueSource(strings = {"AB12345", "ABCD123", "1234567", ""})
    @DisplayName("Recusa placa fora do padrão")
    void placaInvalida(String placa) {
        assertThrows(IllegalArgumentException.class, () -> new Veiculo(motorista, placa, "12345678",
                TipoVeiculo.TRUCK, TipoCarroceria.BAU, 3, false));
    }

    @ParameterizedTest
    @ValueSource(strings = {"1234567", "1234567890", "ABCDEFGH"})
    @DisplayName("Recusa RNTRC sem 8 ou 9 dígitos")
    void rntrcInvalido(String rntrc) {
        assertThrows(IllegalArgumentException.class, () -> new Veiculo(motorista, "ABC1234", rntrc,
                TipoVeiculo.TRUCK, TipoCarroceria.BAU, 3, false));
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 10})
    @DisplayName("Recusa número de eixos fora de 2 a 9")
    void eixosInvalidos(int eixos) {
        assertThrows(IllegalArgumentException.class, () -> new Veiculo(motorista, "ABC1234", "12345678",
                TipoVeiculo.TRUCK, TipoCarroceria.BAU, eixos, false));
    }
}
