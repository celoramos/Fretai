package br.com.fretai.shared.seguranca;

import java.util.Objects;
import java.util.UUID;

/**
 * Quem está chamando a API, como veio no access token. Os controllers recebem
 * isto pelo {@code @AuthenticationPrincipal} e repassam aos services, que
 * decidem se aquela pessoa pode mexer naquele recurso.
 *
 * @param empresaId empresa que o usuário representa (só para o papel EMPRESA)
 */
public record UsuarioLogado(UUID id, Papel papel, UUID empresaId) {

    public UsuarioLogado {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(papel, "papel");
    }

    public boolean isAdmin() {
        return papel == Papel.ADMIN;
    }

    /** É este usuário (ou um administrador)? Usado nas rotas com o id do usuário na URL. */
    public boolean ehOuAdmin(UUID usuarioId) {
        return isAdmin() || id.equals(usuarioId);
    }

    /** Fala por esta empresa (ou é administrador)? */
    public boolean representaOuAdmin(UUID empresaIdAlvo) {
        return isAdmin() || (papel == Papel.EMPRESA && empresaIdAlvo != null && empresaIdAlvo.equals(empresaId));
    }
}
