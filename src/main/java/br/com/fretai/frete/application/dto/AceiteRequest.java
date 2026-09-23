package br.com.fretai.frete.application.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

// Na Fase 2 o motorista vem do token de login.
public record AceiteRequest(@NotNull(message = "O motorista é obrigatório.") UUID motoristaId) {
}
