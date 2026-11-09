package br.com.fretai.auth.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** @param token o que veio no link, sem mexer */
public record SenhaNovaRequest(
        @NotBlank(message = "O link está incompleto. Peça outro na tela de entrar.")
        String token,

        @NotBlank(message = "A senha deve ter entre 8 e 72 caracteres.")
        @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres.")
        String senha) {
}
