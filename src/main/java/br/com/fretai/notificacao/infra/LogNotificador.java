package br.com.fretai.notificacao.infra;

import br.com.fretai.notificacao.domain.Notificador;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Padrão: a "notificação" vai para o log. Telefone mascarado (LGPD), texto completo. */
@Component
@ConditionalOnProperty(name = "fretai.whatsapp.habilitado", havingValue = "false", matchIfMissing = true)
class LogNotificador implements Notificador {

    private static final Logger log = LoggerFactory.getLogger(LogNotificador.class);

    @Override
    public void enviar(Mensagem mensagem) {
        log.info("[notificação {}] para {}: {}", mensagem.tipo(), mascarar(mensagem.telefone()), mensagem.texto());
    }

    static String mascarar(String telefone) {
        if (telefone == null || telefone.length() < 4) {
            return "****";
        }
        return "*".repeat(telefone.length() - 4) + telefone.substring(telefone.length() - 4);
    }
}
