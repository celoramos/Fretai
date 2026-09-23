package br.com.fretai.frete.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelamentoRequest(
        @NotBlank(message = "Informe o motivo do cancelamento.")
        @Size(max = 500) String motivo) {
}
