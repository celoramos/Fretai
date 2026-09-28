package br.com.fretai.calendario.application;

import br.com.fretai.calendario.application.dto.VerificacaoDataResponse;
import br.com.fretai.calendario.domain.Feriado;
import br.com.fretai.calendario.domain.FeriadoGateway;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("Calendário: dia útil para coleta")
class CalendarioServiceTest {

    private final FeriadoGateway gateway = mock(FeriadoGateway.class);
    private final CalendarioService service = new CalendarioService(gateway);

    @BeforeEach
    void feriados2026() {
        when(gateway.nacionaisDoAno(2026)).thenReturn(List.of(
                new Feriado(LocalDate.of(2026, 11, 2), "Finados"),
                new Feriado(LocalDate.of(2026, 11, 15), "Proclamação da República")));
    }

    @Test
    @DisplayName("Feriado numa segunda → não é dia útil")
    void feriado() {
        VerificacaoDataResponse r = service.verificar(LocalDate.of(2026, 11, 2));

        assertTrue(r.feriado());
        assertEquals("Finados", r.nomeFeriado());
        assertFalse(r.diaUtil());
    }

    @Test
    @DisplayName("Feriado que cai no domingo marca as duas coisas")
    void feriadoNoDomingo() {
        VerificacaoDataResponse r = service.verificar(LocalDate.of(2026, 11, 15));

        assertTrue(r.feriado());
        assertTrue(r.domingo());
        assertFalse(r.diaUtil());
    }

    @Test
    @DisplayName("Sábado comum é dia útil para frete")
    void sabado() {
        VerificacaoDataResponse r = service.verificar(LocalDate.of(2026, 11, 7));

        assertFalse(r.feriado());
        assertNull(r.nomeFeriado());
        assertTrue(r.diaUtil());
    }
}
