package br.com.fretai.documento.application.dto;

import java.net.URI;
import java.time.Instant;

/** Link temporário para abrir o documento. Depois de {@code expiraEm}, é preciso pedir outro. */
public record LinkDocumentoResponse(URI url, Instant expiraEm) {
}
