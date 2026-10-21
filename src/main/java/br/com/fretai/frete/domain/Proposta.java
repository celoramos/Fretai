package br.com.fretai.frete.domain;

import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.shared.seguranca.Papel;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.veiculo.domain.Veiculo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

/**
 * Uma oferta de preço e condições para um frete, entre o contratante e um
 * motorista. Pode partir de qualquer um dos dois; quem responde é sempre o outro.
 */
@Entity
public class Proposta {

    private static final BigDecimal CEM = BigDecimal.valueOf(100);

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "frete_id")
    private Frete frete;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "motorista_id")
    private Motorista motorista;

    /** Nulo em proposta da empresa: o motorista escolhe o caminhão ao aceitar. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "veiculo_id")
    private Veiculo veiculo;

    /** MOTORISTA, ou EMPRESA/CLIENTE quando quem propôs foi o contratante. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Papel autorPapel;

    @Column(nullable = false)
    private UUID autorId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valor;

    /** Parte do valor paga na saída da carga (0 a 100). O resto é o saldo, pago na entrega. */
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal adiantamentoPercentual;

    private LocalDate prazoEntrega;

    @Column(length = 500)
    private String observacao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusProposta status;

    @Column(nullable = false)
    private Instant criadaEm;

    private Instant respondidaEm;

    protected Proposta() {
    }

    public Proposta(Frete frete, Motorista motorista, Veiculo veiculo, Autor autor, BigDecimal valor,
                    BigDecimal adiantamentoPercentual, LocalDate prazoEntrega, String observacao) {
        this.frete = Objects.requireNonNull(frete, "Frete é obrigatório.");
        this.motorista = Objects.requireNonNull(motorista, "Motorista é obrigatório.");
        this.autorId = Objects.requireNonNull(autor.id(), "Autor é obrigatório.");
        this.autorPapel = Objects.requireNonNull(autor.papel(), "Papel do autor é obrigatório.");
        if (valor == null || valor.signum() <= 0) {
            throw new RegraNegocioException("O valor da proposta deve ser maior que zero.");
        }
        if (adiantamentoPercentual == null || adiantamentoPercentual.signum() < 0
                || adiantamentoPercentual.compareTo(CEM) > 0) {
            throw new RegraNegocioException("O adiantamento deve estar entre 0% e 100%.");
        }
        if (prazoEntrega != null && prazoEntrega.isBefore(frete.getDataColeta())) {
            throw new RegraNegocioException("O prazo de entrega não pode ser antes da data de coleta.");
        }
        if (veiculo != null && !veiculo.pertenceA(motorista.getId())) {
            throw new RegraNegocioException("O veículo não é deste motorista.");
        }
        this.veiculo = veiculo;
        this.valor = valor;
        this.adiantamentoPercentual = adiantamentoPercentual;
        this.prazoEntrega = prazoEntrega;
        this.observacao = observacao;
        this.status = StatusProposta.ENVIADA;
        this.criadaEm = Instant.now();
    }

    public boolean feitaPeloMotorista() {
        return autorPapel == Papel.MOTORISTA;
    }

    public boolean isAberta() {
        return status == StatusProposta.ENVIADA;
    }

    /** Aceite pela outra parte. O motorista que aceita a proposta da empresa diz com qual caminhão vai. */
    void aceitar(Veiculo veiculoEscolhido) {
        exigirAberta();
        if (veiculo == null) {
            if (veiculoEscolhido == null && frete.getEmpresa() != null) {
                throw new RegraNegocioException("Informe com qual veículo o frete será feito.");
            }
            if (veiculoEscolhido != null && !veiculoEscolhido.pertenceA(motorista.getId())) {
                throw new RegraNegocioException("O veículo não é deste motorista.");
            }
            this.veiculo = veiculoEscolhido;
        }
        responder(StatusProposta.ACEITA);
    }

    public void recusar() {
        exigirAberta();
        responder(StatusProposta.RECUSADA);
    }

    public void retirar() {
        exigirAberta();
        responder(StatusProposta.RETIRADA);
    }

    /** Outra proposta do mesmo frete foi aceita. */
    public void encerrarPorOutraAceita() {
        if (isAberta()) {
            responder(StatusProposta.RECUSADA);
        }
    }

    private void exigirAberta() {
        if (!isAberta()) {
            throw new IllegalStateException("Esta proposta já foi respondida (" + status + ").");
        }
    }

    private void responder(StatusProposta novo) {
        this.status = novo;
        this.respondidaEm = Instant.now();
    }

    public UUID getId() {return id;}
    public Frete getFrete() {return frete;}
    public Motorista getMotorista() {return motorista;}
    public Veiculo getVeiculo() {return veiculo;}
    public Papel getAutorPapel() {return autorPapel;}
    public UUID getAutorId() {return autorId;}
    public BigDecimal getValor() {return valor;}
    public BigDecimal getAdiantamentoPercentual() {return adiantamentoPercentual;}
    public LocalDate getPrazoEntrega() {return prazoEntrega;}
    public String getObservacao() {return observacao;}
    public StatusProposta getStatus() {return status;}
    public Instant getCriadaEm() {return criadaEm;}
    public Instant getRespondidaEm() {return respondidaEm;}
}
