package br.com.fretai.endereco.infra;

import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.support.ServidorHttpFalso;
import java.time.Duration;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Nominatim: geocodificação")
class NominatimClientTest {

    private static final Endereco SE = new Endereco("01001-000", "Praça da Sé", "Sé", "São Paulo", "SP");

    private final ServidorHttpFalso servidor = new ServidorHttpFalso();
    private final NominatimClient client = new NominatimClient(servidor.url(), Duration.ofSeconds(2),
            "Fretai-teste/1.0", Duration.ZERO);

    @AfterEach
    void parar() {
        servidor.close();
    }

    @Test
    @DisplayName("Acha o endereço completo e identifica a aplicação no User-Agent")
    void enderecoCompleto() {
        servidor.responder(200, """
                [{"lat":"-23.5498381","lon":"-46.6341081","display_name":"100, Praça da Sé, São Paulo"}]
                """);

        Optional<Coordenadas> ponto = client.localizar(SE, "100");

        assertEquals(new Coordenadas(-23.5498381, -46.6341081), ponto.orElseThrow());
        assertEquals("Fretai-teste/1.0", servidor.ultimoUserAgent());
        String query = servidor.requisicoes().getFirst().getQuery();
        assertTrue(query.contains("street=100 Praça da Sé"), query);
        assertTrue(query.contains("countrycodes=br"), query);
    }

    @Test
    @DisplayName("Rua desconhecida no OSM → tenta de novo só com cidade e UF")
    void caiParaCidade() {
        // O servidor falso responde sempre igual: vazio nas duas tentativas.
        servidor.responder(200, "[]");

        assertTrue(client.localizar(SE, "100").isEmpty());
        assertEquals(2, servidor.requisicoes().size());
        assertFalse(servidor.requisicoes().getLast().getQuery().contains("street="));
    }

    @Test
    @DisplayName("Serviço fora do ar → vazio, sem exceção")
    void servicoFora() {
        servidor.responder(503, "");

        assertTrue(client.localizar(SE, "100").isEmpty());
    }
}
