package br.com.fretai.endereco.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Endereço devolvido pela consulta de CEP. Só guarda os campos que o Fretai usa;
 * os demais campos do ViaCEP (ibge, gia, siafi...) são ignorados.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record Endereco(
        String cep,
        String logradouro,
        String complemento,
        String bairro,
        String localidade,
        String uf,
        Boolean erro) {

    public Endereco(String cep, String logradouro, String bairro, String localidade, String uf) {
        this(cep, logradouro, null, bairro, localidade, uf, null);
    }

    public boolean isErro() {
        return Boolean.TRUE.equals(erro);
    }
}
