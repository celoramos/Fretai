package br.com.fretai.calendario.infra;

import br.com.fretai.calendario.domain.Feriado;
import br.com.fretai.support.ServidorHttpFalso;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("BrasilAPI: feriados nacionais")
class BrasilApiFeriadoClientTest {

    private final ServidorHttpFalso servidor = new ServidorHttpFalso();
    private final BrasilApiFeriadoClient client = new BrasilApiFeriadoClient(servidor.url(), Duration.ofSeconds(2));

    @AfterEach
    void parar() {
        servidor.close();
    }

    @Test
    @DisplayName("Devolve os feriados do ano em ordem de data")
    void ordenaPorData() {
        servidor.responder(200, """
                [{"date":"2026-04-21","name":"Tiradentes","type":"national","weekday":"terça-feira"},
                 {"date":"2026-01-01","name":"Confraternização mundial","type":"national","weekday":"quinta-feira"}]
                """);

        List<Feriado> feriados = client.nacionaisDoAno(2026);

        assertEquals(List.of(new Feriado(LocalDate.of(2026, 1, 1), "Confraternização mundial"),
                new Feriado(LocalDate.of(2026, 4, 21), "Tiradentes")), feriados);
        assertEquals("/api/feriados/v1/2026", servidor.requisicoes().getFirst().getPath());
    }

    @Test
    @DisplayName("Ano fora da faixa suportada → erro de entrada, sem chamar a API")
    void anoForaDaFaixa() {
        assertThrows(IllegalArgumentException.class, () -> client.nacionaisDoAno(1899));
        assertTrue(servidor.requisicoes().isEmpty());
    }
}
