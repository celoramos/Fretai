package br.com.fretai.reputacao.application.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Quem é avaliado sai do frete e de quem está logado; aqui só vai a nota. */
public record AvaliacaoRequest(
        @NotNull(message = "A nota é obrigatória.")
        @Min(value = 1, message = "A nota vai de 1 a 5.")
        @Max(value = 5, message = "A nota vai de 1 a 5.")
        Integer nota,

        @Size(max = 500) String comentario) {
}
