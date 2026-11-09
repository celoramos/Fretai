package br.com.fretai.auth.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PedidoLinkSenhaRequest(
        @NotBlank(message = "Digite o e-mail da sua conta para receber o link.")
        @Email(message = "Formato de e-mail inválido.")
        String email) {
}
