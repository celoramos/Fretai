package br.com.fretai.frete.domain;

public enum StatusProposta {
    /** Aguardando a outra parte. */
    ENVIADA,
    ACEITA,
    /** A outra parte disse não, ou outra proposta do mesmo frete foi aceita. */
    RECUSADA,
    /** Quem enviou desistiu. */
    RETIRADA
}
