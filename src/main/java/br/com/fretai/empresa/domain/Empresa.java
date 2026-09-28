package br.com.fretai.empresa.domain;

import java.time.LocalDate;

/**
 * Dados públicos de uma empresa na Receita Federal. Guarda só o que o cadastro de
 * cliente PJ precisa: o quadro de sócios, que a BrasilAPI também devolve, fica
 * de fora de propósito (dado pessoal que o Fretai não usa).
 */
public record Empresa(
        String cnpj,
        String razaoSocial,
        String nomeFantasia,
        String situacaoCadastral,
        LocalDate inicioAtividade,
        String atividadePrincipal,
        String municipio,
        String uf,
        String cep) {

    private static final String SITUACAO_ATIVA = "ATIVA";

    /** Só empresa ativa na Receita pode contratar frete como PJ. */
    public boolean isAtiva() {
        return SITUACAO_ATIVA.equalsIgnoreCase(situacaoCadastral);
    }
}
