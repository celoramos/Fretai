package br.com.fretai.usuario.domain;

import br.com.fretai.shared.seguranca.Papel;
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

    /** Para onde o PSP manda adiantamento e saldo. Sem ela, o frete não pode ser cobrado com garantia. */
    @Column(length = 77)
    private String chavePix;

    @Override
    public Papel getPapel() {
        return Papel.MOTORISTA;
    }

    /**
     * Aceita CPF, CNPJ, e-mail, telefone (+55...) ou chave aleatória (UUID).
     *
     * @throws IllegalArgumentException se não for nenhum desses formatos
     */
    public void definirChavePix(String chave) {
        String limpa = chave == null ? "" : chave.trim();
        boolean valida = limpa.matches("\\d{11}|\\d{14}")
                || limpa.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")
                || limpa.matches("\\+55\\d{10,11}")
                || limpa.matches("(?i)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");
        if (!valida || limpa.length() > 77) {
            throw new IllegalArgumentException("Chave Pix inválida. Use CPF, CNPJ, e-mail, +55 com DDD ou chave aleatória.");
        }
        this.chavePix = limpa;
    }

    public String getChavePix() {return chavePix;}

    public void definirAceitaFeriado(boolean aceitaFeriado) {
        this.aceitaFeriado = aceitaFeriado;
    }

    public CategoriaVeiculo getTipoVeiculo() {return tipoVeiculo;}
    public String getPlaca() {return placa;}
    public boolean isAceitaFeriado() {return aceitaFeriado;}
}
