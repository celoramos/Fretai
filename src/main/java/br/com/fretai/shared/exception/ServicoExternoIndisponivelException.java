package br.com.fretai.shared.exception;

/** Vira HTTP 503: uma integração externa (CEP, CNPJ, feriados...) não respondeu a tempo ou respondeu com erro. */
public class ServicoExternoIndisponivelException extends RuntimeException {

    private final String titulo;

    public ServicoExternoIndisponivelException(String titulo, String message, Throwable cause) {
        super(message, cause);
        this.titulo = titulo;
    }

    public String getTitulo() {
        return titulo;
    }
}
