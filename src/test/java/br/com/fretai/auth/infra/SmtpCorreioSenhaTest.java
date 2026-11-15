package br.com.fretai.auth.infra;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/** O servidor SMTP é um mock: confere a mensagem que sai e quando sai, não a entrega. */
@DisplayName("Link de senha nova por e-mail")
class SmtpCorreioSenhaTest {

    private static final String LINK = "https://app.fretai.test/nova-senha?token=abc123";

    private final JavaMailSender smtp = mock(JavaMailSender.class);
    /** Executor que roda na hora, na própria thread do teste. */
    private final SmtpCorreioSenha correio = new SmtpCorreioSenha(smtp, "nao-responda@fretai.test", Runnable::run);

    @AfterEach
    void limpar() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    @DisplayName("A mensagem vai para o e-mail da conta, com o link e o primeiro nome")
    void mensagem() {
        correio.enviarLink("ana@email.com", "Ana Pereira", LINK);

        ArgumentCaptor<SimpleMailMessage> enviada = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(smtp).send(enviada.capture());
        SimpleMailMessage mensagem = enviada.getValue();
        assertArrayEquals(new String[]{"ana@email.com"}, mensagem.getTo());
        assertEquals("nao-responda@fretai.test", mensagem.getFrom());
        assertEquals("Fretaí: crie uma senha nova", mensagem.getSubject());
        assertTrue(mensagem.getText().startsWith("Olá, Ana."), mensagem.getText());
        assertTrue(mensagem.getText().contains(LINK), mensagem.getText());
    }

    @Test
    @DisplayName("Servidor de e-mail fora do ar não vira erro: a resposta do pedido não pode mudar por isso")
    void falhaNoEnvioNaoSobe() {
        doThrow(new MailSendException("smtp fora do ar")).when(smtp).send(any(SimpleMailMessage.class));

        assertDoesNotThrow(() -> correio.enviarLink("ana@email.com", "Ana Pereira", LINK));
    }

    @Test
    @DisplayName("Dentro de uma transação, o e-mail só sai depois do commit: link de token que não gravou não chega a ninguém")
    void soEnviaDepoisDoCommit() {
        TransactionSynchronizationManager.initSynchronization();

        correio.enviarLink("ana@email.com", "Ana Pereira", LINK);
        verify(smtp, never()).send(any(SimpleMailMessage.class));

        TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
        verify(smtp).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("Sem remetente configurado a aplicação não sobe")
    void semRemetente() {
        IllegalStateException e = assertThrows(IllegalStateException.class,
                () -> new SmtpCorreioSenha(smtp, " ", Runnable::run));
        assertTrue(e.getMessage().contains("FRETAI_EMAIL_REMETENTE"), e.getMessage());
    }

    @Test
    @DisplayName("Sem servidor SMTP configurado a aplicação não sobe")
    void semServidor() {
        IllegalStateException e = assertThrows(IllegalStateException.class,
                () -> new SmtpCorreioSenha(null, "nao-responda@fretai.test", Runnable::run));
        assertTrue(e.getMessage().contains("SPRING_MAIL_HOST"), e.getMessage());
    }

    @Test
    @DisplayName("O e-mail aparece mascarado no log")
    void emailMascarado() {
        assertEquals("a***@email.com", SmtpCorreioSenha.mascarar("ana@email.com"));
        assertEquals("***", SmtpCorreioSenha.mascarar("sem-arroba"));
    }
}
