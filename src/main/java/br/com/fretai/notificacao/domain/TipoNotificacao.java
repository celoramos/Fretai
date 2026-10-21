package br.com.fretai.notificacao.domain;

/** Cada tipo vira um template aprovado no WhatsApp Business (nome configurável). */
public enum TipoNotificacao {
    FRETE_PERTO,
    PROPOSTA_RECEBIDA,
    FRETE_ACEITO,
    FRETES_DE_RETORNO,
    PAGAMENTO_RETIDO,
    SALDO_LIBERADO,
    ENTREGA_REGISTRADA
}
