package br.com.fretai.auth.infra;

import br.com.fretai.auth.domain.CorreioSenha;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * O projeto ainda não tem servidor de e-mail, e o site não está no ar: o link de senha nova sai no log.
 * Quem lê o log troca a senha de qualquer conta que pediu o link, por isso esta classe tem que dar lugar
 * a um envio de e-mail de verdade antes de publicar o site.
 */
@Component
class LogCorreioSenha implements CorreioSenha {

    private static final Logger log = LoggerFactory.getLogger(LogCorreioSenha.class);

    @Override
    public void enviarLink(String email, String nome, String link) {
        log.warn("Sem servidor de e-mail: link de senha nova de {} ({}): {}", nome, email, link);
    }
}
