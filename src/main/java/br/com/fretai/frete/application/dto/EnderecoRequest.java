package br.com.fretai.frete.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EnderecoRequest(
        @NotBlank(message = "O CEP é obrigatório.")
        @Pattern(regexp = "^\\d{5}-?\\d{3}$", message = "CEP inválido. Use 00000-000 ou 00000000.")
        String cep,

        @Size(max = 20) String numero,
        @Size(max = 255) String complemento,
        @Size(max = 255) String pontoReferencia) {
}
