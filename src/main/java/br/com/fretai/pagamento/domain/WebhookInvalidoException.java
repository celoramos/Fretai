package br.com.fretai.pagamento.domain;

import br.com.fretai.shared.exception.CredenciaisInvalidasException;

/** Webhook sem a assinatura/token esperado: vira 401 e nada é processado. */
public class WebhookInvalidoException extends CredenciaisInvalidasException {

    public WebhookInvalidoException(String message) {
        super(message);
    }
}
