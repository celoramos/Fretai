package br.com.fretai.frete.domain;

import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.usuario.domain.Cliente;
import br.com.fretai.usuario.domain.Motorista;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Um frete e o seu ciclo de vida:
 *
 * <pre>
 *   PENDENTE ──aceitar──▶ ACEITO ──iniciarTransporte──▶ EM_TRANSITO ──concluir──▶ ENTREGUE
 *       └──────────────────┴──────────────cancelar──────────────┴──────────▶ CANCELADO
 * </pre>
 *
 * O status só muda pelos métodos de transição (não existe setStatus público),
 * então é impossível um frete pular etapas, venha a chamada de onde vier.
 */
@Entity
public class Frete {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Controle de concorrência otimista: dois aceites simultâneos → só o primeiro grava. */
    @Version
    private Long versao;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "motorista_id")
    private Motorista motorista;

    @Embedded
    private EnderecoFrete pontoColeta;

    @Embedded
    private EnderecoFrete pontoEntrega;

    @Column(nullable = false, length = 100)
    private String nomeDestinatario;

    @Column(nullable = false, length = 20)
    private String telefoneDestinatario;

    @Column(nullable = false, length = 500)
    private String descricaoCarga;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal pesoKg;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusFrete status;

    @Column(length = 500)
    private String motivoCancelamento;

    @Column(nullable = false)
    private Instant criadoEm;
    private Instant aceitoEm;
    private Instant concluidoEm;

    protected Frete() {
    }

    public Frete(Cliente cliente, EnderecoFrete pontoColeta, EnderecoFrete pontoEntrega,
                 String nomeDestinatario, String telefoneDestinatario,
                 String descricaoCarga, BigDecimal pesoKg, BigDecimal valor) {
        this.cliente = Objects.requireNonNull(cliente, "Cliente solicitante é obrigatório.");
        this.pontoColeta = Objects.requireNonNull(pontoColeta, "Ponto de coleta é obrigatório.");
        this.pontoEntrega = Objects.requireNonNull(pontoEntrega, "Ponto de entrega é obrigatório.");
        this.nomeDestinatario = nomeDestinatario;
        this.telefoneDestinatario = telefoneDestinatario;
        this.descricaoCarga = descricaoCarga;
        this.pesoKg = pesoKg;
        this.valor = valor;
        this.status = StatusFrete.PENDENTE;
        this.criadoEm = Instant.now();
    }

    // ---------- Transições de estado ----------

    public void aceitar(Motorista motorista) {
        Objects.requireNonNull(motorista, "Motorista não pode ser nulo.");
        exigirStatus(StatusFrete.PENDENTE, "Apenas fretes pendentes podem receber motorista.");
        if (!motorista.getTipoVeiculo().suporta(pesoKg)) {
            throw new RegraNegocioException("O veículo " + motorista.getTipoVeiculo().getDescricao()
                    + " não suporta uma carga de " + pesoKg + " kg.");
        }

        this.motorista = motorista;
        this.status = StatusFrete.ACEITO;
        this.aceitoEm = Instant.now();
    }

    public void iniciarTransporte() {
        exigirStatus(StatusFrete.ACEITO, "Para iniciar o transporte, o frete deve estar aceito por um motorista.");
        this.status = StatusFrete.EM_TRANSITO;
    }

    public void concluir() {
        exigirStatus(StatusFrete.EM_TRANSITO, "Para concluir a entrega, a carga deve estar em trânsito.");
        this.status = StatusFrete.ENTREGUE;
        this.concluidoEm = Instant.now();
    }

    public void cancelar(String motivo) {
        if (status == StatusFrete.ENTREGUE) {
            throw new IllegalStateException("Não é possível cancelar um frete já entregue.");
        }
        if (status == StatusFrete.CANCELADO) {
            throw new IllegalStateException("Este frete já se encontra cancelado.");
        }
        this.status = StatusFrete.CANCELADO;
        this.motivoCancelamento = motivo;
        this.concluidoEm = Instant.now();
    }

    private void exigirStatus(StatusFrete esperado, String mensagem) {
        if (status != esperado) {
            throw new IllegalStateException(mensagem);
        }
    }

    // ---------- Leitura ----------

    public UUID getId() {return id;}
    public Cliente getCliente() {return cliente;}
    public Motorista getMotorista() {return motorista;}
    public EnderecoFrete getPontoColeta() {return pontoColeta;}
    public EnderecoFrete getPontoEntrega() {return pontoEntrega;}
    public String getNomeDestinatario() {return nomeDestinatario;}
    public String getTelefoneDestinatario() {return telefoneDestinatario;}
    public String getDescricaoCarga() {return descricaoCarga;}
    public BigDecimal getPesoKg() {return pesoKg;}
    public BigDecimal getValor() {return valor;}
    public StatusFrete getStatus() {return status;}
    public String getMotivoCancelamento() {return motivoCancelamento;}
    public Instant getCriadoEm() {return criadoEm;}
    public Instant getAceitoEm() {return aceitoEm;}
    public Instant getConcluidoEm() {return concluidoEm;}
}
