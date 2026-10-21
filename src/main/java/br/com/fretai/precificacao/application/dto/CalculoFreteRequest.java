package br.com.fretai.precificacao.application.dto;

import br.com.fretai.precificacao.domain.TipoCargaAntt;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

/**
 * Calculadora do caminhoneiro: "esse frete paga a viagem?".
 * Tipo de carga e eixos são opcionais; com eles, a resposta inclui o piso ANTT.
 */
public record CalculoFreteRequest(
        @NotNull(message = "A distância é obrigatória.")
        @Positive(message = "A distância deve ser maior que zero.")
        @DecimalMax(value = "10000", message = "Distância acima de 10.000 km.")
        BigDecimal distanciaKm,

        @NotNull(message = "O consumo (km/l) é obrigatório.")
        @Positive(message = "O consumo deve ser maior que zero.")
        BigDecimal consumoKmPorLitro,

        @NotNull(message = "O preço do diesel é obrigatório.")
        @Positive(message = "O preço do diesel deve ser maior que zero.")
        BigDecimal precoDieselLitro,

        @PositiveOrZero BigDecimal pedagio,
        @PositiveOrZero BigDecimal outrosCustos,

        TipoCargaAntt tipoCargaAntt,

        @Min(value = 2, message = "De 2 a 9 eixos.") @Max(value = 9, message = "De 2 a 9 eixos.")
        Integer numeroEixos,

        @Positive BigDecimal valorOferecido) {
}
