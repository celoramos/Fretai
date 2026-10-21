package br.com.fretai.veiculo.domain;

/**
 * Tipos de caminhão do mercado de carga rodoviária, do maior para o menor.
 * Não confundir com {@code usuario.domain.CategoriaVeiculo}, que classifica o veículo
 * do motorista no fluxo de frete de pessoa física (moto, carro, van...).
 *
 * O número de eixos de cada tipo é a configuração mais comum do mercado, usado
 * só para estimar o piso ANTT antes de se saber qual caminhão vai fazer o frete.
 * Depois do aceite vale o número de eixos cadastrado no veículo.
 */
public enum TipoVeiculo {
    RODOTREM("Rodotrem", 9),
    BITREM("Bitrem", 7),
    CARRETA_LS("Carreta LS", 6),
    CARRETA("Carreta", 5),
    VANDERLEIA("Vanderleia", 6),
    TRUCK("Truck", 3),
    BITRUCK("Bitruck", 4),
    TOCO("Toco", 2),
    VUC("VUC", 2),
    TRES_QUARTOS("3/4", 2);

    private final String descricao;
    private final int eixosTipicos;

    TipoVeiculo(String descricao, int eixosTipicos) {
        this.descricao = descricao;
        this.eixosTipicos = eixosTipicos;
    }

    public String getDescricao() {
        return descricao;
    }

    public int getEixosTipicos() {
        return eixosTipicos;
    }
}
