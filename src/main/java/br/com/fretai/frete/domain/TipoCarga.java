package br.com.fretai.frete.domain;

/**
 * O que a pessoa física vai levar, nas opções da tela de pedido. Não confundir com
 * {@link br.com.fretai.precificacao.domain.TipoCargaAntt}, a classificação da tabela de piso da ANTT
 * que só o frete de empresa usa.
 */
public enum TipoCarga {
    MUDANCA("Mudança"),
    MOVEIS("Móveis e eletros"),
    CAIXAS("Caixas e volumes"),
    OBRA("Material de obra"),
    OUTRO("Outro");

    private final String descricao;

    TipoCarga(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
