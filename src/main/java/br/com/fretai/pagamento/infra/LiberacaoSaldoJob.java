package br.com.fretai.pagamento.infra;

import br.com.fretai.pagamento.application.PagamentoService;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * De tempos em tempos: libera os saldos cuja janela de contestação passou sem
 * reclamação, e tenta de novo o que falhou com o PSP fora do ar: adiantamentos na
 * saída da carga e estornos no cancelamento.
 * Cada pagamento numa transação própria: um com problema não trava os outros.
 */
@Component
class LiberacaoSaldoJob {

    private static final Logger log = LoggerFactory.getLogger(LiberacaoSaldoJob.class);

    private final PagamentoService pagamentoService;

    LiberacaoSaldoJob(PagamentoService pagamentoService) {
        this.pagamentoService = pagamentoService;
    }

    @Scheduled(fixedDelayString = "${fretai.pagamento.intervalo-liberacao}",
            initialDelayString = "${fretai.pagamento.intervalo-liberacao}")
    void executar() {
        for (UUID id : pagamentoService.estornosPendentes()) {
            tentar(() -> pagamentoService.retentarEstorno(id), "devolver o valor", id);
        }
        for (UUID id : pagamentoService.adiantamentosPendentes()) {
            tentar(() -> pagamentoService.retentarAdiantamento(id), "liberar o adiantamento", id);
        }
        for (UUID id : pagamentoService.saldosProntos()) {
            tentar(() -> pagamentoService.liberarSaldo(id), "liberar o saldo", id);
        }
    }

    private static void tentar(Runnable acao, String etapa, UUID pagamentoId) {
        try {
            acao.run();
        } catch (RuntimeException e) {
            log.error("Falha ao {} do pagamento {}; nova tentativa na próxima rodada.", etapa, pagamentoId, e);
        }
    }
}
