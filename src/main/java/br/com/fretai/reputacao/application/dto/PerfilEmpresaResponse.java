package br.com.fretai.reputacao.application.dto;

import br.com.fretai.empresa.domain.TipoEmpresa;
import java.time.Instant;
import java.util.UUID;

/**
 * O que o caminhoneiro olha antes de aceitar um frete desta empresa.
 *
 * @param percentualSaldosPagosEmDia nulo enquanto a empresa não tiver nenhuma cobrança vencida
 */
public record PerfilEmpresaResponse(UUID id, String razaoSocial, String nomeFantasia, TipoEmpresa tipo,
                                    Instant naPlataformaDesde, Double mediaNotas, long quantidadeAvaliacoes,
                                    long fretesPublicados, long fretesConcluidos,
                                    Double percentualSaldosPagosEmDia, long cobrancasConsideradas) {
}
