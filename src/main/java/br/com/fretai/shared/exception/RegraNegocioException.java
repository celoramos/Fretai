package br.com.fretai.shared.exception;

/** Vira HTTP 422: o pedido é válido no formato, mas a regra de negócio não permite. */
public class RegraNegocioException extends RuntimeException {

    public RegraNegocioException(String message) {
        super(message);
    }
}
