package br.com.fretai.frete.domain;

/** R$/km médio dos fretes parecidos e quantos entraram na conta. */
public record MediaPrecoRota(Double mediaPorKm, Long amostras) {
}
