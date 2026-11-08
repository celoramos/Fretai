package br.com.fretai.documento.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** O motivo vai para o motorista: é o que ele lê para saber o que mandar de novo. */
public record RecusaDocumentoRequest(
        @NotBlank(message = "Diga ao motorista por que o documento foi recusado.")
        @Size(max = 300, message = "O motivo deve ter até 300 caracteres.")
        String motivo) {
}
