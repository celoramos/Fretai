package br.com.fretai.usuario.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** CPF e e-mail não mudam por aqui: são a identidade do usuário. */
public record AtualizarContatoRequest(
        @NotBlank(message = "O nome é obrigatório.")
        @Size(min = 2, max = 100, message = "O nome deve ter entre 2 e 100 caracteres.")
        String nome,

        @NotBlank(message = "O telefone é obrigatório.")
        @Pattern(regexp = Formatos.TELEFONE, message = "Telefone inválido. Use DDD + número.")
        String telefone) {
}
