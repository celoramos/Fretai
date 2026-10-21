package br.com.fretai.frete.domain;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import static br.com.fretai.frete.domain.StatusFrete.*;

/**
 * Todas as transições de status permitidas, num lugar só:
 *
 * <pre>
 *   PUBLICADO ⇄ PROPOSTA_ENVIADA ──▶ ACEITO ──▶ EM_TRANSITO ──▶ ENTREGUE ──▶ PAGO
 *       │               │               │
 *       └───────────────┴───────────────┴──▶ CANCELADO
 * </pre>
 *
 * PROPOSTA_ENVIADA volta para PUBLICADO quando todas as propostas foram recusadas
 * ou retiradas. Depois que a carga saiu (EM_TRANSITO), não se cancela mais: o
 * problema vira contestação, não cancelamento.
 */
public final class MaquinaEstadosFrete {

    private static final Map<StatusFrete, Set<StatusFrete>> PERMITIDAS = new EnumMap<>(StatusFrete.class);

    static {
        PERMITIDAS.put(PUBLICADO, EnumSet.of(PROPOSTA_ENVIADA, CANCELADO));
        PERMITIDAS.put(PROPOSTA_ENVIADA, EnumSet.of(PUBLICADO, ACEITO, CANCELADO));
        PERMITIDAS.put(ACEITO, EnumSet.of(EM_TRANSITO, CANCELADO));
        PERMITIDAS.put(EM_TRANSITO, EnumSet.of(ENTREGUE));
        PERMITIDAS.put(ENTREGUE, EnumSet.of(PAGO));
        PERMITIDAS.put(PAGO, EnumSet.noneOf(StatusFrete.class));
        PERMITIDAS.put(CANCELADO, EnumSet.noneOf(StatusFrete.class));
    }

    private MaquinaEstadosFrete() {
    }

    public static boolean permite(StatusFrete de, StatusFrete para) {
        return PERMITIDAS.get(de).contains(para);
    }

    public static Set<StatusFrete> proximos(StatusFrete de) {
        return Set.copyOf(PERMITIDAS.get(de));
    }

    /** @throws IllegalStateException (vira 409) se a transição não existe */
    static void exigir(StatusFrete de, StatusFrete para, String mensagem) {
        if (!permite(de, para)) {
            throw new IllegalStateException(mensagem + " (status atual: " + de + ")");
        }
    }
}
