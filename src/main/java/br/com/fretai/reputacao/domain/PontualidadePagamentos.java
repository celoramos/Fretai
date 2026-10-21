package br.com.fretai.reputacao.domain;

import java.util.UUID;

/**
 * De onde vem o "% de saldos pagos em dia" da empresa. Quem sabe disso é o
 * módulo de pagamento; a reputação só pergunta, sem depender dele.
 */
public interface PontualidadePagamentos {

    /**
     * @param emDia     cobranças pagas até o vencimento
     * @param vencidas  cobranças com vencimento já passado (pagas ou não), que é a base do percentual
     */
    record Pontualidade(long emDia, long vencidas) {

        /** Nulo sem nenhuma cobrança vencida: sem histórico, não há o que medir. */
        public Double percentual() {
            return vencidas == 0 ? null : Math.round(emDia * 1000.0 / vencidas) / 10.0;
        }
    }

    Pontualidade daEmpresa(UUID empresaId);
}
