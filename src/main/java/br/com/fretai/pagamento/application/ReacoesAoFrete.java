package br.com.fretai.pagamento.application;

import br.com.fretai.entrega.domain.EventosEntrega;
import br.com.fretai.frete.domain.EventosFrete;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * O que acontece com o dinheiro quando o frete anda. Cada reação roda depois
 * do commit de quem a provocou, numa transação nova: a saída, o cancelamento
 * ou o canhoto valem mesmo se a parte do PSP falhar. A transação é programática
 * para que nem um rollback interno escape do try/catch e vire erro para quem
 * já teve sucesso. Adiantamento que falhou é tentado de novo pelo job.
 */
@Component
class ReacoesAoFrete {

    private static final Logger log = LoggerFactory.getLogger(ReacoesAoFrete.class);

    private final PagamentoService pagamentoService;
    private final TransactionTemplate novaTransacao;

    ReacoesAoFrete(PagamentoService pagamentoService, PlatformTransactionManager transacoes) {
        this.pagamentoService = pagamentoService;
        this.novaTransacao = new TransactionTemplate(transacoes);
        this.novaTransacao.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    @TransactionalEventListener
    public void transporteIniciado(EventosFrete.TransporteIniciado evento) {
        executar("liberar o adiantamento", evento.freteId().toString(),
                () -> pagamentoService.liberarAdiantamentoDoFrete(evento.freteId()));
    }

    @TransactionalEventListener
    public void freteCancelado(EventosFrete.FreteCancelado evento) {
        executar("estornar o pagamento", evento.freteId().toString(),
                () -> pagamentoService.estornarDoFrete(evento.freteId()));
    }

    @TransactionalEventListener
    public void canhotoRegistrado(EventosEntrega.CanhotoRegistrado evento) {
        executar("agendar o saldo", evento.freteId().toString(),
                () -> pagamentoService.agendarSaldo(evento.freteId(), evento.contestacaoAte()));
    }

    @TransactionalEventListener
    public void entregaContestada(EventosEntrega.EntregaContestada evento) {
        executar("bloquear o saldo", evento.freteId().toString(), () -> pagamentoService.bloquearSaldo(evento.freteId()));
    }

    @TransactionalEventListener
    public void contestacaoResolvida(EventosEntrega.ContestacaoResolvida evento) {
        if (evento.saldoLiberado()) {
            executar("desbloquear o saldo", evento.freteId().toString(),
                    () -> pagamentoService.desbloquearSaldo(evento.freteId()));
        }
    }

    private void executar(String acao, String freteId, Runnable passo) {
        try {
            novaTransacao.executeWithoutResult(status -> passo.run());
        } catch (RuntimeException e) {
            log.error("Não foi possível {} do frete {}.", acao, freteId, e);
        }
    }
}
