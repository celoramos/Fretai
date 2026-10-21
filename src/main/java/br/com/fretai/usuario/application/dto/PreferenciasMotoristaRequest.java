package br.com.fretai.usuario.application.dto;

import jakarta.validation.constraints.NotNull;

public record PreferenciasMotoristaRequest(
        @NotNull(message = "Informe se o motorista aceita fretes em feriados.")
        Boolean aceitaFeriado) {
}
