package br.com.fretai.reputacao.domain;

/** @param media nula quando ainda não há nenhuma avaliação */
public record MediaNotas(Double media, Long quantidade) {
}
