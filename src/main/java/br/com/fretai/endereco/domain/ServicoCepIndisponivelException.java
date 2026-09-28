package br.com.fretai.endereco.domain;

import br.com.fretai.shared.exception.ServicoExternoIndisponivelException;

/** O serviço externo de CEP não respondeu (fora do ar, lento demais, resposta inválida). */
public class ServicoCepIndisponivelException extends ServicoExternoIndisponivelException {

    public ServicoCepIndisponivelException(String message, Throwable cause) {
        super("Serviço de CEP indisponível", message, cause);
    }
}
