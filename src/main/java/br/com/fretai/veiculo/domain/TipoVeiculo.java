package br.com.fretai.veiculo.domain;

/**
 * Tipos de caminhão do mercado de carga rodoviária, do maior para o menor.
 * Não confundir com {@code usuario.domain.CategoriaVeiculo}, que classifica o veículo
 * do motorista no fluxo de frete de pessoa física (moto, carro, van...).
 */
public enum TipoVeiculo {
    RODOTREM("Rodotrem"),
    BITREM("Bitrem"),
    CARRETA_LS("Carreta LS"),
    CARRETA("Carreta"),
    VANDERLEIA("Vanderleia"),
    TRUCK("Truck"),
    BITRUCK("Bitruck"),
    TOCO("Toco"),
    VUC("VUC"),
    TRES_QUARTOS("3/4");

    private final String descricao;

    TipoVeiculo(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
