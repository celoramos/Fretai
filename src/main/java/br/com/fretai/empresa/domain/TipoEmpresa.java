package br.com.fretai.empresa.domain;

public enum TipoEmpresa {
    /** Dona da carga: indústria, distribuidora, comércio. */
    EMBARCADOR("Embarcador"),
    /** Intermediário que publica fretes de terceiros. O frete sai marcado como "publicado por agenciador". */
    AGENCIADOR("Agenciador de cargas");

    private final String descricao;

    TipoEmpresa(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
