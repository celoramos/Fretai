package br.com.fretai.auth.application;

import br.com.fretai.shared.exception.MuitasTentativasException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Limite de tentativas de login")
class LimitadorTentativasTest {

    /** Relógio que o teste avança na mão. */
    private static final class RelogioFalso extends Clock {
        private Instant agora = Instant.parse("2026-10-21T12:00:00Z");

        void avancar(Duration d) {
            agora = agora.plus(d);
        }

        @Override public Instant instant() {return agora;}
        @Override public java.time.ZoneId getZone() {return ZoneOffset.UTC;}
        @Override public Clock withZone(java.time.ZoneId zone) {return this;}
    }

    private final RelogioFalso relogio = new RelogioFalso();
    private final LimitadorTentativas limitador = new LimitadorTentativas(3, Duration.ofMinutes(15), relogio);

    @Test
    @DisplayName("Bloqueia na terceira falha e diz quanto esperar")
    void bloqueia() {
        for (int i = 0; i < 3; i++) {
            limitador.verificar("ip|a@b.com");
            limitador.registrarFalha("ip|a@b.com");
            relogio.avancar(Duration.ofMinutes(1));
        }

        MuitasTentativasException e = assertThrows(MuitasTentativasException.class,
                () -> limitador.verificar("ip|a@b.com"));
        // A primeira falha foi há 3 min; sai da janela de 15 min daqui a 12.
        assertEquals(Duration.ofMinutes(12), e.getEsperar());
        assertDoesNotThrow(() -> limitador.verificar("outro-ip|a@b.com"), "outra chave não é afetada");
    }

    @Test
    @DisplayName("Libera quando as falhas antigas saem da janela")
    void liberaComOTempo() {
        for (int i = 0; i < 3; i++) {
            limitador.registrarFalha("k");
        }
        relogio.avancar(Duration.ofMinutes(15));

        assertDoesNotThrow(() -> limitador.verificar("k"));
    }

    @Test
    @DisplayName("Login certo zera a contagem")
    void sucessoZera() {
        limitador.registrarFalha("k");
        limitador.registrarFalha("k");
        limitador.registrarSucesso("k");
        limitador.registrarFalha("k");
        limitador.registrarFalha("k");

        assertDoesNotThrow(() -> limitador.verificar("k"));
    }
}
