package br.com.fretai.auth.infra;

import br.com.fretai.auth.application.LimpezaTokens;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** De tempos em tempos, tira do banco os refresh tokens e os links de senha que já venceram. */
@Component
class LimpezaTokensJob {

    private static final Logger log = LoggerFactory.getLogger(LimpezaTokensJob.class);

    private final LimpezaTokens limpeza;

    LimpezaTokensJob(LimpezaTokens limpeza) {
        this.limpeza = limpeza;
    }

    @Scheduled(fixedDelayString = "${fretai.jwt.intervalo-limpeza}",
            initialDelayString = "${fretai.jwt.intervalo-limpeza}")
    void executar() {
        int apagados = limpeza.apagarVencidos();
        if (apagados > 0) {
            log.info("{} tokens vencidos apagados.", apagados);
        }
    }
}
