package br.com.fretai.calendario.application;

import br.com.fretai.calendario.application.dto.VerificacaoDataResponse;
import br.com.fretai.calendario.domain.Feriado;
import br.com.fretai.calendario.domain.FeriadoGateway;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * Responde se um dia é útil para coleta. Feriado e domingo não impedem o frete,
 * mas o cliente precisa saber que pode não haver motorista ou que a entrega
 * pode atrasar.
 */
@Service
public class CalendarioService {

    private final FeriadoGateway feriadoGateway;

    public CalendarioService(FeriadoGateway feriadoGateway) {
        this.feriadoGateway = feriadoGateway;
    }

    public List<Feriado> feriadosDoAno(int ano) {
        return feriadoGateway.nacionaisDoAno(ano);
    }

    public VerificacaoDataResponse verificar(LocalDate data) {
        Optional<Feriado> feriado = feriadoGateway.nacionaisDoAno(data.getYear()).stream()
                .filter(f -> f.data().equals(data))
                .findFirst();
        boolean domingo = data.getDayOfWeek() == DayOfWeek.SUNDAY;

        return new VerificacaoDataResponse(data, feriado.isPresent(), feriado.map(Feriado::nome).orElse(null),
                domingo, feriado.isEmpty() && !domingo);
    }
}
