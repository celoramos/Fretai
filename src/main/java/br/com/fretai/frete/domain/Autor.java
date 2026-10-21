package br.com.fretai.frete.domain;

import br.com.fretai.shared.seguranca.Papel;
import java.util.UUID;

/** Quem provocou uma mudança no frete, para a trilha de auditoria. */
public record Autor(UUID id, Papel papel) {

    /** Mudanças automáticas: job de liberação de saldo, webhook do PSP. */
    public static final Autor SISTEMA = new Autor(null, null);
}
