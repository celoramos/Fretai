package br.com.fretai.usuario.domain;

import java.math.BigDecimal;

/**
 * Tamanho do veículo de quem faz frete de pessoa física, do menor para o maior: a ordem da declaração
 * é a regra de {@link #leva}. Carro de passeio e moto não fazem frete no Fretaí (decisão do dono do
 * produto), por isso não estão aqui.
 */
public enum CategoriaVeiculo {
    UTILITARIO("Utilitário", "qualquer veículo"),
    VAN("Van ou furgão", "van, furgão ou caminhão"),
    CAMINHAO("Caminhão", "caminhão");

    private final String descricao;
    private final String exigencia;

    CategoriaVeiculo(String descricao, String exigencia) {
        this.descricao = descricao;
        this.exigencia = exigencia;
    }

    public String getDescricao() {
        return descricao;
    }

    /** O que um frete que pede este tamanho exige, na frase "Este frete precisa de ...". */
    public String exigencia() {
        return exigencia;
    }

    /** Um veículo leva o frete que pede o tamanho dele ou um menor. Frete sem tamanho pedido: qualquer um leva. */
    public boolean leva(CategoriaVeiculo exigida) {
        return exigida == null || compareTo(exigida) >= 0;
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
