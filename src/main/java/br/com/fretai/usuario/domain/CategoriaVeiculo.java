package br.com.fretai.usuario.domain;

import java.math.BigDecimal;

/**
 * Tamanho do veículo de quem faz frete de pessoa física, do menor para o maior: a ordem da declaração
 * é a regra de {@link #leva}. Carro de passeio e moto não fazem frete no Fretaí (decisão do dono do
 * produto), por isso não estão aqui.
 */
public enum CategoriaVeiculo {
    /** Fiorino, Kangoo: até 700 kg, o topo da faixa "De 200 a 700 kg" do pedido. */
    UTILITARIO("Utilitário", "um utilitário", "qualquer veículo", new BigDecimal("700")),
    /** Master, Ducato, Sprinter: até 1,5 t, o topo da faixa "De 700 kg a 1,5 t". */
    VAN("Van ou furgão", "uma van ou furgão", "van, furgão ou caminhão", new BigDecimal("1500")),
    /** Do 3/4 em diante: o peso não barra, porque a capacidade varia demais de um caminhão para outro. */
    CAMINHAO("Caminhão", "um caminhão", "caminhão", null);

    private final String descricao;
    private final String comArtigo;
    private final String exigencia;
    private final BigDecimal capacidadeKg;

    CategoriaVeiculo(String descricao, String comArtigo, String exigencia, BigDecimal capacidadeKg) {
        this.descricao = descricao;
        this.comArtigo = comArtigo;
        this.exigencia = exigencia;
        this.capacidadeKg = capacidadeKg;
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

    /** "Um utilitário", "uma van ou furgão": para a frase "... leva até N kg". */
    public String comArtigo() {
        return comArtigo;
    }

    /** Peso máximo em kg, ou nulo quando o tamanho não tem teto (caminhão). */
    public BigDecimal capacidadeKg() {
        return capacidadeKg;
    }

    /**
     * Diz se este tamanho de veículo leva uma carga com esse peso. O teto é fixo por tamanho, não por
     * veículo: o cadastro não pede a capacidade de cada um. Peso não informado não barra.
     */
    public boolean suporta(BigDecimal pesoKg) {
        return pesoKg == null || capacidadeKg == null || pesoKg.compareTo(capacidadeKg) <= 0;
    }
}
