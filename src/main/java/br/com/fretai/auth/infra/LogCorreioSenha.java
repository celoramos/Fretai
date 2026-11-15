package br.com.fretai.auth.infra;

import br.com.fretai.auth.domain.CorreioSenha;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Padrão, para desenvolvimento: sem servidor de e-mail, o link de senha nova sai no log.
 * Quem lê o log troca a senha de qualquer conta que pediu o link, por isso o site no ar tem que rodar
 * com {@code fretai.email.habilitado=true}, que troca esta classe pelo {@link SmtpCorreioSenha}.
 */
@Component
@ConditionalOnProperty(name = "fretai.email.habilitado", havingValue = "false", matchIfMissing = true)
class LogCorreioSenha implements CorreioSenha {

    private static final Logger log = LoggerFactory.getLogger(LogCorreioSenha.class);

    @Override
    public void enviarLink(String email, String nome, String link) {
        log.warn("Sem servidor de e-mail: link de senha nova de {} ({}): {}", nome, email, link);
    }
}
