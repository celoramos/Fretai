package br.com.fretai.reputacao.application.dto;

import br.com.fretai.reputacao.domain.Avaliacao;
import java.time.Instant;
import java.util.UUID;

/** Não expõe o id de quem avaliou: o lado (CONTRATANTE ou MOTORISTA) basta para ler a avaliação. */
public record AvaliacaoResponse(UUID id, UUID freteId, Avaliacao.Lado lado, Avaliacao.TipoAvaliado avaliadoTipo,
                                UUID avaliadoId, int nota, String comentario, Instant criadaEm) {

    public static AvaliacaoResponse de(Avaliacao a) {
        return new AvaliacaoResponse(a.getId(), a.getFrete().getId(), a.getLado(), a.getAvaliadoTipo(),
                a.getAvaliadoId(), a.getNota(), a.getComentario(), a.getCriadaEm());
    }
}
