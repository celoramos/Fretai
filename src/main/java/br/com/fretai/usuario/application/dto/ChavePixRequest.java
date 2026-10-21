package br.com.fretai.usuario.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChavePixRequest(
        @NotBlank(message = "Informe a chave Pix.")
        @Size(max = 77) String chavePix) {
}
