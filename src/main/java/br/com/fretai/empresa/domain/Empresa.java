package br.com.fretai.empresa.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Empresa que publica fretes no marketplace. O CNPJ passa pela mesma validação
 * de dígito verificador da consulta à Receita ({@link EmpresaGateway#normalizarCnpj}),
 * então nenhuma empresa com CNPJ inválido chega ao banco.
 */
@Entity
public class Empresa {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 14)
    private String cnpj;

    @Column(nullable = false)
    private String razaoSocial;

    private String nomeFantasia;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoEmpresa tipo;

    @Column(nullable = false, length = 20)
    private String telefone;

    /** Empresa desativada não publica fretes, mas o histórico continua. */
    @Column(nullable = false)
    private boolean ativa = true;

    @Column(nullable = false)
    private Instant criadoEm;

    protected Empresa() {
    }

    /** @throws IllegalArgumentException se o CNPJ for inválido */
    public Empresa(String cnpj, String razaoSocial, String nomeFantasia, TipoEmpresa tipo, String telefone) {
        this.cnpj = EmpresaGateway.normalizarCnpj(cnpj);
        this.razaoSocial = Objects.requireNonNull(razaoSocial, "Razão social é obrigatória.");
        this.nomeFantasia = nomeFantasia;
        this.tipo = Objects.requireNonNull(tipo, "Tipo da empresa é obrigatório.");
        this.telefone = Objects.requireNonNull(telefone, "Telefone é obrigatório.");
        this.criadoEm = Instant.now();
    }

    public void atualizar(String nomeFantasia, String telefone) {
        this.nomeFantasia = nomeFantasia;
        this.telefone = Objects.requireNonNull(telefone, "Telefone é obrigatório.");
    }

    public void desativar() {
        this.ativa = false;
    }

    public boolean isAgenciador() {
        return tipo == TipoEmpresa.AGENCIADOR;
    }

    public UUID getId() {return id;}
    public String getCnpj() {return cnpj;}
    public String getRazaoSocial() {return razaoSocial;}
    public String getNomeFantasia() {return nomeFantasia;}
    public TipoEmpresa getTipo() {return tipo;}
    public String getTelefone() {return telefone;}
    public boolean isAtiva() {return ativa;}
    public Instant getCriadoEm() {return criadoEm;}
}
