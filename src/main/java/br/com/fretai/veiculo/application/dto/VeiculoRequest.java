package br.com.fretai.veiculo.application.dto;

import br.com.fretai.usuario.application.dto.Formatos;
import br.com.fretai.veiculo.domain.TipoCarroceria;
import br.com.fretai.veiculo.domain.TipoVeiculo;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/** Cadastro e edição de veículo. Na edição a placa é ignorada: placa identifica o veículo. */
public record VeiculoRequest(
        @NotBlank(message = "A placa é obrigatória.")
        @Pattern(regexp = Formatos.PLACA, message = "Placa inválida. Use o formato ABC1234 ou ABC1D23.")
        String placa,

        @NotBlank(message = "O RNTRC é obrigatório.")
        @Pattern(regexp = "^\\d{8,9}$", message = "RNTRC inválido. Deve ter 8 ou 9 dígitos.")
        String rntrc,

        @NotNull(message = "O tipo do veículo é obrigatório.")
        TipoVeiculo tipo,

        @NotNull(message = "A carroceria é obrigatória.")
        TipoCarroceria carroceria,

        @NotNull(message = "O número de eixos é obrigatório.")
        @Min(value = 2, message = "O veículo deve ter de 2 a 9 eixos.")
        @Max(value = 9, message = "O veículo deve ter de 2 a 9 eixos.")
        Integer numeroEixos,

        boolean rastreador) {
}
