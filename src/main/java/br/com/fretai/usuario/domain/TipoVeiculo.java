package br.com.fretai.usuario.domain;

import java.math.BigDecimal;

public enum TipoVeiculo {
    MOTO("Moto"),
    CARRO("Carro de passeio"),
    UTILITARIO("Utilitário (Fiorino, Kangoo)"),
    VAN("Van / furgão"),
    CAMINHAO("Caminhão");

    private final String descricao;

    TipoVeiculo(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }

    /**
     * Diz se este tipo de veículo consegue levar uma carga com esse peso.
     * É chamado quando o motorista tenta aceitar um frete: se retornar false,
     * o aceite é recusado.
     *
     * TODO(você): definir a capacidade de cada veículo. Pontos para decidir:
     *  - Qual o limite em kg de cada tipo? (ex.: moto ~20kg, Fiorino ~650kg...)
     *  - O limite fica fixo aqui no enum (simples) ou por motorista, já que
     *    duas vans podem ter capacidades bem diferentes (mais fiel à realidade)?
     *  - Só peso basta, ou volume (m³) também importa? Um colchão é leve mas
     *    não cabe numa moto.
     */
    public boolean suporta(BigDecimal pesoKg) {
        return true;
    }
}
