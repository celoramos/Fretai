package br.com.fretai.frete.application.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * @param latitude  opcional: quando o app já sabe onde é (GPS, pino no mapa), o
 *                  Nominatim não é consultado. Latitude e longitude vêm juntas ou nenhuma.
 */
public record EnderecoRequest(
        @NotBlank(message = "O CEP é obrigatório.")
        @Pattern(regexp = "^\\d{5}-?\\d{3}$", message = "CEP inválido. Use 00000-000 ou 00000000.")
        String cep,

        @Size(max = 20) String numero,
        @Size(max = 255) String complemento,
        @Size(max = 255) String pontoReferencia,

        @DecimalMin(value = "-90", message = "Latitude deve estar entre -90 e 90.")
        @DecimalMax(value = "90", message = "Latitude deve estar entre -90 e 90.")
        Double latitude,

        @DecimalMin(value = "-180", message = "Longitude deve estar entre -180 e 180.")
        @DecimalMax(value = "180", message = "Longitude deve estar entre -180 e 180.")
        Double longitude) {

    public EnderecoRequest(String cep, String numero, String complemento, String pontoReferencia) {
        this(cep, numero, complemento, pontoReferencia, null, null);
    }

    public boolean temCoordenadas() {
        return latitude != null && longitude != null;
    }
}
