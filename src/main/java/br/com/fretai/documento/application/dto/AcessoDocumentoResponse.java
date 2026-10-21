package br.com.fretai.documento.application.dto;

import br.com.fretai.documento.domain.AcessoDocumento;
import br.com.fretai.shared.seguranca.Papel;
import java.time.Instant;
import java.util.UUID;

public record AcessoDocumentoResponse(UUID usuarioId, Papel papel, String origem, Instant acessadoEm) {

    public static AcessoDocumentoResponse de(AcessoDocumento a) {
        return new AcessoDocumentoResponse(a.getUsuarioId(), a.getPapel(), a.getOrigem(), a.getAcessadoEm());
    }
}
