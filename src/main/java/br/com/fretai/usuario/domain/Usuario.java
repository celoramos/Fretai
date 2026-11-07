package br.com.fretai.usuario.domain;

import br.com.fretai.shared.seguranca.Papel;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import java.time.Instant;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Dados comuns a toda pessoa na plataforma. Cliente e Motorista herdam daqui,
 * então CPF e e-mail são únicos no sistema inteiro (a mesma pessoa não vira
 * cliente e motorista com dois cadastros diferentes).
 */
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 11)
    private String cpf;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    /** Nulo em conta criada só com o Google. */
    @Column(length = 100)
    private String senhaHash;

    /** Identificador fixo da conta Google ligada a este usuário; nulo sem Google. */
    @Column(unique = true)
    private String googleSub;

    @Column(nullable = false, length = 20)
    private String telefone;

    @Column(nullable = false)
    private Instant criadoEm;

    /** Desativado não faz login nem aparece em listagens; o histórico continua. */
    @Column(nullable = false)
    private boolean ativo = true;

    protected Usuario() {
    }

    protected Usuario(String cpf, String nome, String email, String senhaHash, String telefone) {
        this.cpf = cpf;
        this.nome = nome;
        this.email = email;
        this.senhaHash = senhaHash;
        this.telefone = telefone;
        this.criadoEm = Instant.now();
    }

    public void atualizarContato(String nome, String telefone) {
        this.nome = nome;
        this.telefone = telefone;
    }

    public void desativar() {
        this.ativo = false;
    }

    public UUID getId() {return id;}
    public boolean isAtivo() {return ativo;}
    public String getCpf() {return cpf;}
    public String getNome() {return nome;}
    public String getEmail() {return email;}
    public String getTelefone() {return telefone;}
    public Instant getCriadoEm() {return criadoEm;}

    // Sem getter de senha: o hash só é lido por quem valida login (Fase 2).

    /** O hash nunca sai da entidade: quem valida o login passa a senha digitada para cá. */
    public boolean confereSenha(String senhaDigitada, PasswordEncoder encoder) {
        return senhaDigitada != null && senhaHash != null && encoder.matches(senhaDigitada, senhaHash);
    }

    public boolean temSenha() {
        return senhaHash != null;
    }

    /** Liga a conta Google. Uma conta Fretaí aceita uma conta Google só, e não troca por outra. */
    public void vincularGoogle(String sub) {
        if (googleSub != null && !googleSub.equals(sub)) {
            throw new IllegalStateException("Esta conta já está ligada a outra conta Google.");
        }
        this.googleSub = sub;
    }

    public abstract Papel getPapel();

    /** O que vai no access token. Quem representa uma empresa sobrescreve para incluir a empresa. */
    public UsuarioLogado comoUsuarioLogado() {
        return new UsuarioLogado(id, getPapel(), null);
    }
}
