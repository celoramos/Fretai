package br.com.fretai.pagamento.domain;

public enum StatusPagamento {
    /** Cobrança Pix emitida, aguardando o contratante pagar. */
    PENDENTE,
    /** Pago e retido no PSP: o motorista já sabe que o dinheiro existe. */
    RETIDO,
    /** A carga saiu e o adiantamento foi transferido ao motorista. */
    ADIANTAMENTO_LIBERADO,
    /** Entrega confirmada e saldo transferido. Fim. */
    LIBERADO,
    /** Frete cancelado antes da saída: cobrança cancelada ou valor devolvido ao contratante. */
    ESTORNADO
}
