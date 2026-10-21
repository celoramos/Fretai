package br.com.fretai.usuario.application.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Onde o motorista costuma pegar carga e até que distância quer ser avisado de frete novo. */
public record BaseMotoristaRequest(
        @NotNull @DecimalMin("-90") @DecimalMax("90") Double latitude,
        @NotNull @DecimalMin("-180") @DecimalMax("180") Double longitude,
        @NotNull @Min(value = 1, message = "O raio vai de 1 a 1000 km.")
        @Max(value = 1000, message = "O raio vai de 1 a 1000 km.") Integer raioKm) {
}
