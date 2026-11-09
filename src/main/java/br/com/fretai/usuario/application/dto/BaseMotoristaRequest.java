package br.com.fretai.usuario.application.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * Onde o motorista costuma pegar carga e até que distância quer ser avisado de frete novo. A base vem da
 * localização do celular (latitude e longitude) ou do CEP, que o servidor põe no mapa.
 */
public record BaseMotoristaRequest(
        @DecimalMin("-90") @DecimalMax("90") Double latitude,
        @DecimalMin("-180") @DecimalMax("180") Double longitude,
        @Pattern(regexp = "^\\d{5}-?\\d{3}$", message = "Digite os 8 números do CEP.") String cep,
        @NotNull @Min(value = 1, message = "O raio vai de 1 a 1000 km.")
        @Max(value = 1000, message = "O raio vai de 1 a 1000 km.") Integer raioKm) {

    @AssertTrue(message = "Informe o CEP ou use a sua localização.")
    public boolean isOrigemInformada() {
        return (latitude != null && longitude != null) || cep != null;
    }
}
