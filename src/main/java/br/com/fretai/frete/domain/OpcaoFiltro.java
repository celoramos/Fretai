package br.com.fretai.frete.domain;

/** Filtro de sim/não da busca: AMBOS = não filtra. */
public enum OpcaoFiltro {
    SIM, NAO, AMBOS;

    /** @return true/false para filtrar, ou null quando não filtra */
    public Boolean comoBooleano() {
        return switch (this) {
            case SIM -> Boolean.TRUE;
            case NAO -> Boolean.FALSE;
            case AMBOS -> null;
        };
    }
}
