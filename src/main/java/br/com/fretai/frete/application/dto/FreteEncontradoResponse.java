package br.com.fretai.frete.application.dto;

/** @param distanciaOrigemKm em linha reta, de onde o motorista está até a coleta */
public record FreteEncontradoResponse(double distanciaOrigemKm, FreteResponse frete) {
}
