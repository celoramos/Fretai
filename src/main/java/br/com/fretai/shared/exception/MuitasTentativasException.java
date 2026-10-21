package br.com.fretai.shared.exception;

import java.time.Duration;

/** Vira HTTP 429 com Retry-After: tentativas demais num intervalo curto. */
public class MuitasTentativasException extends RuntimeException {

    private final Duration esperar;

    public MuitasTentativasException(String message, Duration esperar) {
        super(message);
        this.esperar = esperar;
    }

    public Duration getEsperar() {
        return esperar;
    }
}
