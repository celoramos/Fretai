package br.com.fretai.frete.domain;

import java.util.UUID;

/**
 * Fatos do ciclo de vida do frete que outros módulos querem saber (pagamento,
 * notificação), publicados pelos services como eventos do Spring. Assim o
 * módulo de frete não depende de quem escuta.
 */
public final class EventosFrete {

    private EventosFrete() {
    }

    public record FretePublicado(UUID freteId) {
    }

    public record PropostaRecebida(UUID propostaId) {
    }

    public record FreteAceito(UUID freteId) {
    }

    /** A carga saiu: hora de liberar o adiantamento. */
    public record TransporteIniciado(UUID freteId) {
    }

    public record FreteEntregue(UUID freteId) {
    }

    public record FreteCancelado(UUID freteId) {
    }
}
