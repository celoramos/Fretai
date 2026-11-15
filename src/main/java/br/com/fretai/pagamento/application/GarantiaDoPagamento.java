package br.com.fretai.pagamento.application;

import br.com.fretai.frete.domain.GarantiaDoFrete;
import br.com.fretai.pagamento.domain.PagamentoRepository;
import br.com.fretai.pagamento.domain.StatusPagamento;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Cobrança em curso é qualquer uma que não foi estornada: é dela que o saldo ainda vai sair. */
@Component
class GarantiaDoPagamento implements GarantiaDoFrete {

    private final PagamentoRepository pagamentoRepository;

    GarantiaDoPagamento(PagamentoRepository pagamentoRepository) {
        this.pagamentoRepository = pagamentoRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean dependeDoCanhoto(UUID freteId) {
        return pagamentoRepository.existsByFreteIdAndStatusNot(freteId, StatusPagamento.ESTORNADO);
    }
}
