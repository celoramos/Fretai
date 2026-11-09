package br.com.fretai.auth.application.dto;

import br.com.fretai.shared.seguranca.Papel;
import java.util.UUID;

/** Quem está logado: o que o token diz (id, papel, empresa) e o que o menu da conta mostra (nome, e-mail). */
public record EuResponse(UUID id, Papel papel, UUID empresaId, String nome, String email) {
}
