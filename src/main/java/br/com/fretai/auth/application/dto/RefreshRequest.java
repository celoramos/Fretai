package br.com.fretai.auth.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RefreshRequest(
        @NotBlank(message = "O refresh token é obrigatório.")
        @Size(max = 200) String refreshToken) {
}
