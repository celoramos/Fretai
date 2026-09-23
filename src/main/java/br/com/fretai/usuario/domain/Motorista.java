package br.com.fretai.usuario.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

@Entity
public class Motorista extends Usuario {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoVeiculo tipoVeiculo;

    @Column(nullable = false, unique = true, length = 7)
    private String placa;

    protected Motorista() {
    }

    public Motorista(String cpf, String nome, String email, String senhaHash, String telefone,
                     TipoVeiculo tipoVeiculo, String placa) {
        super(cpf, nome, email, senhaHash, telefone);
        this.tipoVeiculo = tipoVeiculo;
        this.placa = placa;
    }

    public TipoVeiculo getTipoVeiculo() {return tipoVeiculo;}
    public String getPlaca() {return placa;}
}
