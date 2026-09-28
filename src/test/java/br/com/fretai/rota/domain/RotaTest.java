package br.com.fretai.rota.domain;

import br.com.fretai.endereco.domain.Coordenadas;
import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Rota e distância em linha reta")
class RotaTest {

    static final Coordenadas PRACA_DA_SE = new Coordenadas(-23.5503898, -46.633081);
    static final Coordenadas CENTRO_RIO = new Coordenadas(-22.9035, -43.1756);

    @Test
    @DisplayName("Haversine SP → RJ dá cerca de 360 km em linha reta")
    void haversine() {
        assertEquals(360.5, PRACA_DA_SE.distanciaLinhaRetaKm(CENTRO_RIO), 0.5);
        assertEquals(0.0, PRACA_DA_SE.distanciaLinhaRetaKm(PRACA_DA_SE), 1e-9);
    }

    @Test
    @DisplayName("Estimativa aplica o fator de sinuosidade e fica marcada como estimada")
    void estimativa() {
        Rota rota = Rota.estimadaPorLinhaReta(PRACA_DA_SE, CENTRO_RIO);

        assertTrue(rota.estimada());
        assertEquals(new BigDecimal("468.7"), rota.distanciaKm());
    }

    @Test
    @DisplayName("Rota por estrada converte metros para km com uma casa")
    void porEstrada() {
        Rota rota = Rota.porEstrada(429_345.7);

        assertFalse(rota.estimada());
        assertEquals(new BigDecimal("429.3"), rota.distanciaKm());
    }

    @Test
    @DisplayName("Coordenada fora do globo é rejeitada")
    void coordenadaInvalida() {
        assertThrows(IllegalArgumentException.class, () -> new Coordenadas(-91, 0));
        assertThrows(IllegalArgumentException.class, () -> new Coordenadas(0, 181));
    }
}
