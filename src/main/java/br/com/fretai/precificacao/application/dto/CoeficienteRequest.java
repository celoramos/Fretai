package br.com.fretai.precificacao.application.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/** @param fonte norma da ANTT de onde vieram os números (ex.: "Resolução ANTT nº ..., anexo II") */
public record CoeficienteRequest(
        @NotNull @PositiveOrZero @Digits(integer = 6, fraction = 4) BigDecimal ccd,
        @NotNull @PositiveOrZero @Digits(integer = 8, fraction = 2) BigDecimal cc,
        @NotBlank(message = "Informe a fonte dos coeficientes.") @Size(max = 200) String fonte) {
}
