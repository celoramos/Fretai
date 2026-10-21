package br.com.fretai.pagamento.domain;

import java.math.BigDecimal;
import java.util.UUID;

/** Fatos do pagamento que interessam a outros módulos (notificação). */
public final class EventosPagamento {

    private EventosPagamento() {
    }

    public record PagamentoRetido(UUID freteId, BigDecimal valor) {
    }

    public record AdiantamentoLiberado(UUID freteId, BigDecimal valor) {
    }

    public record SaldoLiberado(UUID freteId, BigDecimal valor) {
    }
}
