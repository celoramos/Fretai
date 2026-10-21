package br.com.fretai.pagamento.application;

import br.com.fretai.pagamento.domain.Pagamento;
import br.com.fretai.pagamento.domain.PagamentoRepository;
import br.com.fretai.reputacao.domain.PontualidadePagamentos;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * "% de saldos pagos em dia" do perfil da empresa: das cobranças que já
 * venceram, quantas foram pagas até o vencimento. Como o saldo só sai se a
 * cobrança foi paga, pagar a cobrança em dia é pagar o saldo em dia.
 */
@Component
class PontualidadeDosPagamentos implements PontualidadePagamentos {

    private final PagamentoRepository pagamentoRepository;

    PontualidadeDosPagamentos(PagamentoRepository pagamentoRepository) {
        this.pagamentoRepository = pagamentoRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Pontualidade daEmpresa(UUID empresaId) {
        List<Pagamento> vencidos = pagamentoRepository.vencidosDaEmpresa(empresaId, Instant.now());
        long emDia = vencidos.stream().filter(Pagamento::pagoEmDia).count();
        return new Pontualidade(emDia, vencidos.size());
    }
}
