package br.com.fretai.shared.exception;

/** Vira HTTP 403: a pessoa está logada, mas o recurso não é dela. */
public class AcessoNegadoException extends RuntimeException {

    public AcessoNegadoException(String message) {
        super(message);
    }
}
