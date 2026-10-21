package br.com.fretai.usuario.domain;

import br.com.fretai.shared.seguranca.Papel;
import jakarta.persistence.Entity;

/**
 * Quem solicita fretes. Os endereços de coleta/entrega ficam no próprio frete,
 * já que o mesmo cliente envia de e para lugares diferentes.
 */
@Entity
public class Cliente extends Usuario {

    protected Cliente() {
    }

    public Cliente(String cpf, String nome, String email, String senhaHash, String telefone) {
        super(cpf, nome, email, senhaHash, telefone);
    }

    @Override
    public Papel getPapel() {
        return Papel.CLIENTE;
    }
}
