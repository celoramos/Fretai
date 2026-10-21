package br.com.fretai.auth.domain;

import br.com.fretai.shared.seguranca.UsuarioLogado;
import java.time.Duration;

/** Porta para assinar access tokens. A implementação (JWT HMAC) fica na infra. */
public interface EmissorToken {

    String emitir(UsuarioLogado usuario);

    Duration validade();
}
