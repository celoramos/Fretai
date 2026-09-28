package br.com.fretai.rota.infra;

import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.rota.domain.Rota;
import br.com.fretai.support.ServidorHttpFalso;
import java.math.BigDecimal;
import java.time.Duration;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("GraphHopper: distância de estrada com estimativa de reserva")
class GraphHopperClientTest {

    private static final Coordenadas SP = new Coordenadas(-23.5503898, -46.633081);
    private static final Coordenadas RJ = new Coordenadas(-22.9035, -43.1756);

    private final ServidorHttpFalso servidor = new ServidorHttpFalso();

    @AfterEach
    void parar() {
        servidor.close();
    }

    private GraphHopperClient client(String chave) {
        return new GraphHopperClient(servidor.url(), Duration.ofSeconds(2), chave, "car");
    }

    @Test
    @DisplayName("Com chave, usa a distância devolvida e manda lat,lon com ponto decimal")
    void rotaPorEstrada() {
        servidor.responder(200, """
                {"paths": [{"distance": 429345.7, "time": 19800000}]}
                """);

        Rota rota = client("chave-teste").calcular(SP, RJ);

        assertEquals(new BigDecimal("429.3"), rota.distanciaKm());
        assertFalse(rota.estimada());
        String query = servidor.requisicoes().getFirst().getQuery();
        assertTrue(query.contains("point=-23.550390,-46.633081"), query);
        assertTrue(query.contains("profile=car"), query);
    }

    @Test
    @DisplayName("Sem chave, nem chama a API: estima pela linha reta")
    void semChave() {
        Rota rota = client("").calcular(SP, RJ);

        assertTrue(rota.estimada());
        assertTrue(servidor.requisicoes().isEmpty());
    }

    @Test
    @DisplayName("GraphHopper com erro → estimativa, sem derrubar a solicitação do frete")
    void servicoFora() {
        servidor.responder(500, "{\"message\": \"erro\"}");

        Rota rota = client("chave-teste").calcular(SP, RJ);

        assertTrue(rota.estimada());
    }
}
