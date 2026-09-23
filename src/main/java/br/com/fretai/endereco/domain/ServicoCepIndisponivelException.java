package br.com.fretai.endereco.domain;

/** O serviço externo de CEP não respondeu (fora do ar, lento demais, resposta inválida). */
public class ServicoCepIndisponivelException extends RuntimeException {

    public ServicoCepIndisponivelException(String message, Throwable cause) {
        super(message, cause);
    }
}
