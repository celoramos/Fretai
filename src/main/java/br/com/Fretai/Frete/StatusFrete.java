package br.com.Fretai.Frete;

public enum StatusFrete {
    PENDENTE("Aguardando motorista"),
    ACEITO("Motorista a caminho da coleta"),
    EM_TRANSITO("Carga coletada e em transporte"),
    ENTREGUE("Entrega concluída"),
    CANCELADO("Frete cancelado");

    private final String descricao;

    StatusFrete(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
