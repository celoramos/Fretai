package br.com.fretai.frete.domain;

/**
 * Tipos de carga usados nas tabelas de piso mínimo de frete da ANTT
 * (Lei 13.703/2018). Cada tipo tem coeficientes próprios por número de eixos.
 */
public enum TipoCargaAntt {
    GRANEL_SOLIDO("Granel sólido"),
    GRANEL_LIQUIDO("Granel líquido"),
    FRIGORIFICADA("Frigorificada ou aquecida"),
    CONTEINERIZADA("Conteinerizada"),
    CARGA_GERAL("Carga geral"),
    NEOGRANEL("Neogranel"),
    PERIGOSA_GRANEL_SOLIDO("Perigosa (granel sólido)"),
    PERIGOSA_GRANEL_LIQUIDO("Perigosa (granel líquido)"),
    PERIGOSA_FRIGORIFICADA("Perigosa (frigorificada ou aquecida)"),
    PERIGOSA_CONTEINERIZADA("Perigosa (conteinerizada)"),
    PERIGOSA_CARGA_GERAL("Perigosa (carga geral)"),
    GRANEL_PRESSURIZADA("Carga granel pressurizada");

    private final String descricao;

    TipoCargaAntt(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
