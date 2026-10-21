package br.com.fretai.usuario.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import java.time.Instant;
import java.util.UUID;

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

    @Column(nullable = false, length = 100)
    private String senhaHash;

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
}
