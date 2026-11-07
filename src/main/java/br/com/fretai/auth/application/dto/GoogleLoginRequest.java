package br.com.fretai.auth.application.dto;

import jakarta.validation.constraints.NotBlank;

/** A credencial (ID token) que o botão do Google entrega ao navegador. */
public record GoogleLoginRequest(@NotBlank(message = "A credencial do Google é obrigatória.") String credencial) {
}
