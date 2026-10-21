package br.com.fretai.shared.exception;

/** Vira HTTP 401: login ou sessão inválidos. */
public class CredenciaisInvalidasException extends RuntimeException {

    public CredenciaisInvalidasException(String message) {
        super(message);
    }
}
