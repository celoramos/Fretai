package br.com.fretai.usuario.domain;

import br.com.fretai.shared.seguranca.Papel;
import jakarta.persistence.Entity;

/**
 * Operador da plataforma: verifica documentos e resolve contestações. Não há
 * cadastro pela API; o primeiro é criado na subida a partir de variáveis de ambiente.
 */
@Entity
public class Administrador extends Usuario {

    protected Administrador() {
    }

    public Administrador(String cpf, String nome, String email, String senhaHash, String telefone) {
        super(cpf, nome, email, senhaHash, telefone);
    }

    @Override
    public Papel getPapel() {
        return Papel.ADMIN;
    }
}
