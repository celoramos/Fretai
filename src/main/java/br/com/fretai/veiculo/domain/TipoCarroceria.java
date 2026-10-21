package br.com.fretai.veiculo.domain;

public enum TipoCarroceria {
    BAU("Baú"),
    BAU_FRIGORIFICO("Baú frigorífico"),
    SIDER("Sider"),
    CACAMBA("Caçamba"),
    GRADE_BAIXA("Grade baixa"),
    GRANELEIRO("Graneleiro"),
    PRANCHA("Prancha"),
    TANQUE("Tanque"),
    CEGONHA("Cegonha");

    private final String descricao;

    TipoCarroceria(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
