package br.com.Fretai.Exception;

public class CepNaoEncontradoException extends RuntimeException {

    public CepNaoEncontradoException(String message) {
        super(message);
    }

    public CepNaoEncontradoException(String message, Throwable cause) {
        super(message, cause);
    }
}
