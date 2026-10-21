package br.com.fretai.frete.domain;

import java.util.Locale;

/** As transições permitidas entre estes status estão em {@link MaquinaEstadosFrete}. */
public enum StatusFrete {
    PUBLICADO("Aguardando propostas"),
    PROPOSTA_ENVIADA("Com proposta em análise"),
    ACEITO("Motorista a caminho da coleta"),
    EM_TRANSITO("Carga coletada e em transporte"),
    ENTREGUE("Entrega concluída"),
    PAGO("Saldo pago ao motorista"),
    CANCELADO("Frete cancelado");

    private final String descricao;

    StatusFrete(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }

    /**
     * Aceita também "PENDENTE", nome do primeiro status antes do fluxo de
     * propostas, para não quebrar quem ainda filtra por ele.
     */
    public static StatusFrete de(String valor) {
        String nome = valor.trim().toUpperCase(Locale.ROOT);
        return "PENDENTE".equals(nome) ? PUBLICADO : valueOf(nome);
    }
}
