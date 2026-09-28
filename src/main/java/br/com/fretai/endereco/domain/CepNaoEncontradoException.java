package br.com.fretai.endereco.domain;

import br.com.fretai.shared.exception.RegraNegocioException;

public class CepNaoEncontradoException extends RegraNegocioException {

    public CepNaoEncontradoException(String message) {
        super("CEP não encontrado", message);
    }
}
