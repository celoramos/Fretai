package br.com.fretai.auth.infra;

import br.com.fretai.auth.domain.CorreioSenha;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertInstanceOf;

/**
 * A aplicação inteira sobe com o e-mail ligado e troca o log pelo SMTP. Nada é enviado: o servidor
 * só é procurado na hora de mandar uma mensagem. O caminho desligado é o de todos os outros testes.
 */
@SpringBootTest(properties = {
        "fretai.email.habilitado=true",
        "fretai.email.remetente=nao-responda@fretai.test",
        "spring.mail.host=127.0.0.1",
        "spring.mail.port=2525"})
@ActiveProfiles("test")
@DisplayName("E-mail ligado: o link de senha nova sai pelo SMTP")
class CorreioSenhaLigadoTest {

    @Autowired private CorreioSenha correio;

    @Test
    @DisplayName("Com fretai.email.habilitado=true, quem entrega o link é o SMTP, não o log")
    void usaSmtp() {
        assertInstanceOf(SmtpCorreioSenha.class, correio);
    }
}
