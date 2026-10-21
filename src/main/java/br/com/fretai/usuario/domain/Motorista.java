package br.com.fretai.usuario.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

@Entity
public class Motorista extends Usuario {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CategoriaVeiculo tipoVeiculo;

    @Column(nullable = false, unique = true, length = 7)
    private String placa;

    /** Trabalhar em feriado é escolha do motorista. Começa ligado: a maioria trabalha todo dia. */
    @Column(nullable = false)
    private boolean aceitaFeriado = true;

    protected Motorista() {
    }

    public Motorista(String cpf, String nome, String email, String senhaHash, String telefone,
                     CategoriaVeiculo tipoVeiculo, String placa) {
        super(cpf, nome, email, senhaHash, telefone);
        this.tipoVeiculo = tipoVeiculo;
        this.placa = placa;
    }

    public void definirAceitaFeriado(boolean aceitaFeriado) {
        this.aceitaFeriado = aceitaFeriado;
    }

    public CategoriaVeiculo getTipoVeiculo() {return tipoVeiculo;}
    public String getPlaca() {return placa;}
    public boolean isAceitaFeriado() {return aceitaFeriado;}
}
