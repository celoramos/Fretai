package br.com.fretai.empresa.domain;

import br.com.fretai.shared.seguranca.Papel;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import br.com.fretai.usuario.domain.Usuario;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.util.Objects;

/**
 * Pessoa que opera a conta da empresa. Login é sempre de uma pessoa (CPF e e-mail
 * únicos no sistema inteiro, como cliente e motorista); a empresa é quem ela representa.
 */
@Entity
public class UsuarioEmpresa extends Usuario {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id")
    private Empresa empresa;

    protected UsuarioEmpresa() {
    }

    public UsuarioEmpresa(String cpf, String nome, String email, String senhaHash, String telefone, Empresa empresa) {
        super(cpf, nome, email, senhaHash, telefone);
        this.empresa = Objects.requireNonNull(empresa, "Empresa é obrigatória.");
    }

    @Override
    public Papel getPapel() {
        return Papel.EMPRESA;
    }

    @Override
    public UsuarioLogado comoUsuarioLogado() {
        return new UsuarioLogado(getId(), getPapel(), empresa.getId());
    }

    public Empresa getEmpresa() {return empresa;}
}
