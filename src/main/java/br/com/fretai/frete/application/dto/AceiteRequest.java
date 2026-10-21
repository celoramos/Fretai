package br.com.fretai.frete.application.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * Aceite direto, pelo valor anunciado.
 *
 * @param motoristaId tem que ser o motorista logado (mantido por compatibilidade com a primeira versão da API)
 * @param veiculoId   obrigatório nos fretes de empresa: com qual caminhão o frete será feito
 */
public record AceiteRequest(@NotNull(message = "O motorista é obrigatório.") UUID motoristaId, UUID veiculoId) {

    public AceiteRequest(UUID motoristaId) {
        this(motoristaId, null);
    }
}
