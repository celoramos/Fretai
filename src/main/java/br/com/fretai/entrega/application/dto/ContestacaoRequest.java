package br.com.fretai.entrega.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** @param codigo só para quem contesta sem login (o recebedor); o contratante logado não precisa */
public record ContestacaoRequest(
        @Size(max = 20) String codigo,

        @NotBlank(message = "Conte o que houve com a entrega.")
        @Size(max = 500) String motivo) {
}
