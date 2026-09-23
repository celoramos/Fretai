package br.com.fretai.shared.exception;

/** Vira HTTP 409: o dado já existe (CPF, e-mail, placa duplicados). */
public class ConflitoException extends RuntimeException {

    public ConflitoException(String message) {
        super(message);
    }
}
