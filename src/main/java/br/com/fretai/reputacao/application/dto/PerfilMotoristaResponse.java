package br.com.fretai.reputacao.application.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** O que a empresa olha antes de aceitar a proposta deste motorista. Sem CPF, telefone ou placa. */
public record PerfilMotoristaResponse(UUID id, String nome, Instant naPlataformaDesde, Double mediaNotas,
                                      long quantidadeAvaliacoes, long fretesConcluidos,
                                      List<String> documentosVerificados) {
}
