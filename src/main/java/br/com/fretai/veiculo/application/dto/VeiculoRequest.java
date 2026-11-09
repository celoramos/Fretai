package br.com.fretai.veiculo.application.dto;

import br.com.fretai.usuario.application.dto.Formatos;
import br.com.fretai.usuario.domain.CategoriaVeiculo;
import br.com.fretai.veiculo.domain.TipoCarroceria;
import br.com.fretai.veiculo.domain.TipoVeiculo;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Cadastro e edição de veículo. Na edição a placa é ignorada: placa identifica o veículo.
 * Tipo, modelo e placa servem ao frete de pessoa física; RNTRC, tipo de caminhão, carroceria e eixos
 * são opcionais e só o frete de empresa os exige.
 */
public record VeiculoRequest(
        @NotBlank(message = "A placa é obrigatória.")
        @Pattern(regexp = Formatos.PLACA, message = "Placa inválida. Use o formato ABC1234 ou ABC1D23.")
        String placa,

        @NotNull(message = "Escolha o tipo do veículo.")
        CategoriaVeiculo categoria,

        @Size(max = 60, message = "O modelo deve ter até 60 caracteres.")
        String modelo,

        @Pattern(regexp = "^\\d{8,9}$", message = "RNTRC inválido. Deve ter 8 ou 9 dígitos.")
        String rntrc,

        TipoVeiculo tipo,

        TipoCarroceria carroceria,

        @Min(value = 2, message = "O veículo deve ter de 2 a 9 eixos.")
        @Max(value = 9, message = "O veículo deve ter de 2 a 9 eixos.")
        Integer numeroEixos,

        boolean rastreador) {
}
