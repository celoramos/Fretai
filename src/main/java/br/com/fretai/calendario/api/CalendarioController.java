package br.com.fretai.calendario.api;

import br.com.fretai.calendario.application.CalendarioService;
import br.com.fretai.calendario.application.dto.VerificacaoDataResponse;
import br.com.fretai.calendario.domain.Feriado;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CalendarioController {

    private final CalendarioService calendarioService;

    public CalendarioController(CalendarioService calendarioService) {
        this.calendarioService = calendarioService;
    }

    @GetMapping("/api/feriados/{ano}")
    public List<Feriado> feriadosDoAno(@PathVariable int ano) {
        return calendarioService.feriadosDoAno(ano);
    }

    /** Ex.: /api/calendario/verificacao?data=2026-11-02 */
    @GetMapping("/api/calendario/verificacao")
    public VerificacaoDataResponse verificar(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return calendarioService.verificar(data);
    }
}
