package br.com.fretai.frete.application.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Proposta para um frete. Um corpo só para os dois lados:
 * o motorista informa {@code veiculoId}; o contratante informa {@code motoristaId}.
 *
 * @param adiantamentoPercentual quanto do valor é pago na saída da carga (0 a 100)
 */
public record PropostaRequest(
        UUID veiculoId,
        UUID motoristaId,

        @NotNull(message = "O valor é obrigatório.")
        @Positive(message = "O valor deve ser maior que zero.")
        @Digits(integer = 10, fraction = 2, message = "Valor com no máximo 2 casas decimais.")
        BigDecimal valor,

        @NotNull(message = "O adiantamento é obrigatório (use 0 para nenhum).")
        @PositiveOrZero(message = "O adiantamento não pode ser negativo.")
        @DecimalMax(value = "100", message = "O adiantamento não pode passar de 100%.")
        @Digits(integer = 3, fraction = 2)
        BigDecimal adiantamentoPercentual,

        LocalDate prazoEntrega,

        @Size(max = 500) String observacao) {
}
