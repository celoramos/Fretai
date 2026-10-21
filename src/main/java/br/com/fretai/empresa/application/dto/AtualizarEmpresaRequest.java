package br.com.fretai.empresa.application.dto;

import br.com.fretai.usuario.application.dto.Formatos;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** CNPJ, razão social e tipo não mudam: são o que identifica a empresa. */
public record AtualizarEmpresaRequest(
        @Size(max = 255) String nomeFantasia,

        @NotBlank(message = "O telefone é obrigatório.")
        @Pattern(regexp = Formatos.TELEFONE, message = "Telefone inválido. Use DDD + número.")
        String telefone) {
}
