package br.com.fretai.frete.domain;

import java.util.UUID;

/**
 * O frete tem cobrança em curso no PSP? Quem sabe disso é o módulo de pagamento;
 * o frete só pergunta, sem depender dele.
 */
public interface GarantiaDoFrete {

    /**
     * Com cobrança em curso, o saldo do motorista só sai depois do canhoto digital. Entrega
     * concluída sem ele nunca agenda o saldo, e o canhoto não pode mais ser registrado.
     */
    boolean dependeDoCanhoto(UUID freteId);
}
