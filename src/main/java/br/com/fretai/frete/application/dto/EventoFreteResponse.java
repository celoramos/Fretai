package br.com.fretai.frete.application.dto;

import br.com.fretai.frete.domain.EventoFrete;
import br.com.fretai.frete.domain.StatusFrete;
import br.com.fretai.shared.seguranca.Papel;
import java.time.Instant;
import java.util.UUID;

/** Uma linha do histórico: de onde, para onde, quem e quando. Autor nulo = o próprio sistema. */
public record EventoFreteResponse(StatusFrete de, StatusFrete para, UUID autorId, Papel autorPapel,
                                  String observacao, Instant ocorridoEm) {

    public static EventoFreteResponse de(EventoFrete e) {
        return new EventoFreteResponse(e.getStatusAnterior(), e.getStatusNovo(), e.getAutorId(), e.getAutorPapel(),
                e.getObservacao(), e.getOcorridoEm());
    }
}
