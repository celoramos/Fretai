package br.com.fretai.shared.exception;

/** Vira HTTP 422: o pedido é válido no formato, mas a regra de negócio não permite. */
public class RegraNegocioException extends RuntimeException {

    private final String titulo;

    public RegraNegocioException(String message) {
        this("Regra de negócio", message);
    }

    /** Para subclasses que querem um título próprio no ProblemDetail (ex.: "CEP não encontrado"). */
    protected RegraNegocioException(String titulo, String message) {
        super(message);
        this.titulo = titulo;
    }

    public String getTitulo() {
        return titulo;
    }
}
