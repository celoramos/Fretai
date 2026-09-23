package br.com.fretai.endereco.domain;

public class CepNaoEncontradoException extends RuntimeException {

    public CepNaoEncontradoException(String message) {
        super(message);
    }
}
