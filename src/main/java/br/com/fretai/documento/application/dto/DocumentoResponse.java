package br.com.fretai.documento.application.dto;

import br.com.fretai.documento.domain.Documento;
import br.com.fretai.documento.domain.TipoDocumento;
import java.time.Instant;
import java.util.UUID;

/**
 * Metadados só. O arquivo se obtém por {@code POST /api/documentos/{id}/link}, que registra o acesso.
 *
 * @param motivoRecusa o que o administrador escreveu ao recusar; nulo enquanto não foi recusado
 */
public record DocumentoResponse(UUID id, UUID motoristaId, UUID freteId, TipoDocumento tipo, String contentType,
                                long tamanhoBytes, boolean verificado, Instant verificadoEm, Instant recusadoEm,
                                String motivoRecusa, Instant criadoEm) {

    public static DocumentoResponse de(Documento d) {
        return new DocumentoResponse(d.getId(), d.getMotorista().getId(), d.getFrete().getId(), d.getTipo(),
                d.getContentType(), d.getTamanhoBytes(), d.isVerificado(), d.getVerificadoEm(), d.getRecusadoEm(),
                d.getMotivoRecusa(), d.getCriadoEm());
    }
}
