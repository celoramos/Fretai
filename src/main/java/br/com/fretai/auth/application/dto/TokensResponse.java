package br.com.fretai.auth.application.dto;

import br.com.fretai.shared.seguranca.Papel;
import java.util.UUID;

/** @param expiresIn validade do access token, em segundos (como no OAuth 2). */
public record TokensResponse(String accessToken, String refreshToken, String tokenType, long expiresIn,
                             UUID usuarioId, Papel papel, UUID empresaId) {
}
