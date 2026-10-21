package br.com.fretai.frete.application.dto;

import java.util.UUID;

/** @param veiculoId só quando o motorista aceita uma proposta da empresa que não dizia o caminhão */
public record RespostaPropostaRequest(UUID veiculoId) {
}
