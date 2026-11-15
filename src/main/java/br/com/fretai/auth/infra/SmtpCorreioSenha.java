package br.com.fretai.auth.infra;

import br.com.fretai.auth.domain.CorreioSenha;
import jakarta.annotation.PreDestroy;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Manda o link de senha nova por e-mail, por um servidor SMTP ({@code spring.mail.*}). Ligado com
 * {@code fretai.email.habilitado=true}.
 *
 * O envio acontece fora da requisição, numa fila própria, por dois motivos: o pedido de link responde
 * igual e no mesmo tempo exista a conta ou não (o tempo do SMTP entregaria quem tem cadastro), e um
 * servidor de e-mail lento não segura a conexão com o banco. Se o envio falhar, fica no log e a
 * pessoa pede o link de novo. O link em si nunca vai para o log.
 *
 * Escrito sobre o JavaMailSender do Spring e testado com ele simulado; não rodou contra um servidor
 * SMTP de verdade.
 */
@Component
@ConditionalOnProperty(name = "fretai.email.habilitado", havingValue = "true")
class SmtpCorreioSenha implements CorreioSenha {

    private static final Logger log = LoggerFactory.getLogger(SmtpCorreioSenha.class);
    private static final String ASSUNTO = "Fretaí: crie uma senha nova";
    /** Pedidos esperando o servidor de e-mail. Acima disso o pedido é descartado, e não a memória. */
    private static final int FILA_MAXIMA = 200;

    private final JavaMailSender smtp;
    private final String remetente;
    private final Executor fila;

    @Autowired
    SmtpCorreioSenha(ObjectProvider<JavaMailSender> smtp, @Value("${fretai.email.remetente:}") String remetente) {
        this(smtp.getIfAvailable(), remetente, new ThreadPoolExecutor(1, 1, 0, TimeUnit.SECONDS,
                new ArrayBlockingQueue<>(FILA_MAXIMA), r -> {
                    Thread thread = new Thread(r, "correio-senha");
                    thread.setDaemon(true);
                    return thread;
                }));
    }

    SmtpCorreioSenha(JavaMailSender smtp, String remetente, Executor fila) {
        if (smtp == null) {
            throw new IllegalStateException("Defina SPRING_MAIL_HOST (e porta, usuário e senha do servidor SMTP) "
                    + "para ligar o e-mail.");
        }
        if (remetente == null || remetente.isBlank()) {
            throw new IllegalStateException("Defina FRETAI_EMAIL_REMETENTE para ligar o e-mail.");
        }
        this.smtp = smtp;
        this.remetente = remetente.trim();
        this.fila = fila;
    }

    @Override
    public void enviarLink(String email, String nome, String link) {
        SimpleMailMessage mensagem = new SimpleMailMessage();
        mensagem.setFrom(remetente);
        mensagem.setTo(email);
        mensagem.setSubject(ASSUNTO);
        mensagem.setText(texto(nome, link));

        // Quem chama está no meio da transação que grava o token: se ela não fechar, o link não vale.
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    enfileirar(mensagem, email);
                }
            });
        } else {
            enfileirar(mensagem, email);
        }
    }

    private void enfileirar(SimpleMailMessage mensagem, String email) {
        try {
            fila.execute(() -> enviar(mensagem, email));
        } catch (RejectedExecutionException e) {
            log.error("Fila de e-mail cheia: link de senha nova de {} não enviado.", mascarar(email));
        }
    }

    private void enviar(SimpleMailMessage mensagem, String email) {
        try {
            smtp.send(mensagem);
            log.info("Link de senha nova enviado para {}.", mascarar(email));
        } catch (MailException e) {
            log.error("Não foi possível enviar o link de senha nova para {}.", mascarar(email), e);
        }
    }

    /** Texto puro: o nome vem do cadastro, e em HTML teria de ser escapado. */
    private static String texto(String nome, String link) {
        String primeiroNome = nome == null || nome.isBlank() ? "" : nome.trim().split("\\s+")[0];
        return """
                Olá%s.

                Recebemos um pedido para criar uma senha nova na sua conta do Fretaí. Abra o link abaixo para escolher a senha:

                %s

                O link vale por pouco tempo e só funciona uma vez.

                Se não foi você que pediu, pode ignorar esta mensagem: a sua senha continua a mesma.
                """.formatted(primeiroNome.isEmpty() ? "" : ", " + primeiroNome, link);
    }

    /** Para o log: a primeira letra e o domínio bastam para achar o problema, sem expor o endereço (LGPD). */
    static String mascarar(String email) {
        int arroba = email == null ? -1 : email.indexOf('@');
        return arroba < 1 ? "***" : email.charAt(0) + "***" + email.substring(arroba);
    }

    @PreDestroy
    void encerrar() {
        if (fila instanceof ExecutorService servico) {
            servico.shutdown();
            try {
                // O que já está na fila ainda sai, dentro do tempo que a aplicação espera para desligar.
                servico.awaitTermination(10, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }
}
