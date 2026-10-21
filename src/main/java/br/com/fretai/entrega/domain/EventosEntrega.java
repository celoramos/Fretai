package br.com.fretai.entrega.domain;

import java.time.Instant;
import java.util.UUID;

/** Fatos do canhoto que o pagamento e a notificação escutam. */
public final class EventosEntrega {

    private EventosEntrega() {
    }

    /**
     * @param codigoContestacao código em texto puro, só para avisar o recebedor; não é gravado
     */
    public record CanhotoRegistrado(UUID freteId, Instant contestacaoAte, String codigoContestacao) {
    }

    public record EntregaContestada(UUID freteId) {
    }

    /** @param saldoLiberado true = entrega confirmada pelo administrador; o saldo volta a poder sair */
    public record ContestacaoResolvida(UUID freteId, boolean saldoLiberado) {
    }
}
