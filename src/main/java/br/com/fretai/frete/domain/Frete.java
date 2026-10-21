package br.com.fretai.frete.domain;

import br.com.fretai.rota.domain.Rota;
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
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
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

    /** O que o cliente ofereceu. */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valor;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal adicionalFeriado;

    /** valor + adicionalFeriado: é o que o cliente paga. */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valorTotal;

    @Column(nullable = false)
    private LocalDate dataColeta;

    /** Feriado nacional não impede o frete: só gera adicional e exige motorista que aceite feriado. */
    @Column(nullable = false)
    private boolean feriado;

    @Column(length = 100)
    private String nomeFeriado;

    /** Só informativo: domingo não gera adicional. */
    @Column(nullable = false)
    private boolean domingo;

    /** Nula quando não foi possível localizar a coleta ou a entrega no mapa. */
    @Column(precision = 8, scale = 1)
    private BigDecimal distanciaKm;
    private Boolean distanciaEstimada;

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
                 String descricaoCarga, BigDecimal pesoKg, BigDecimal valor, LocalDate dataColeta) {
        this.cliente = Objects.requireNonNull(cliente, "Cliente solicitante é obrigatório.");
        this.pontoColeta = Objects.requireNonNull(pontoColeta, "Ponto de coleta é obrigatório.");
        this.pontoEntrega = Objects.requireNonNull(pontoEntrega, "Ponto de entrega é obrigatório.");
        this.dataColeta = Objects.requireNonNull(dataColeta, "Data da coleta é obrigatória.");
        this.nomeDestinatario = nomeDestinatario;
        this.telefoneDestinatario = telefoneDestinatario;
        this.descricaoCarga = descricaoCarga;
        this.pesoKg = pesoKg;
        this.valor = valor;
        this.adicionalFeriado = BigDecimal.ZERO;
        this.valorTotal = valor;
        this.domingo = dataColeta.getDayOfWeek() == DayOfWeek.SUNDAY;
        this.status = StatusFrete.PENDENTE;
        this.criadoEm = Instant.now();
    }

    /**
     * Quem sabe o calendário é o serviço; aqui só se aplica a consequência.
     * Como mexe no preço, também só vale antes de um motorista aceitar.
     *
     * @param nomeFeriado nome do feriado nacional da data de coleta
     * @param percentual  adicional sobre o valor oferecido (20 = 20%)
     */
    public void registrarFeriado(String nomeFeriado, BigDecimal percentual) {
        Objects.requireNonNull(nomeFeriado, "Nome do feriado não pode ser nulo.");
        exigirStatus(StatusFrete.PENDENTE, "O feriado só pode ser registrado enquanto o frete está pendente.");
        this.feriado = true;
        this.nomeFeriado = nomeFeriado;
        this.adicionalFeriado = AdicionalFeriado.calcular(valor, percentual);
        this.valorTotal = valor.add(adicionalFeriado);
    }

    /** A distância entra na formação do preço, então só pode mudar antes de um motorista aceitar. */
    public void registrarRota(Rota rota) {
        Objects.requireNonNull(rota, "Rota não pode ser nula.");
        exigirStatus(StatusFrete.PENDENTE, "A rota só pode ser alterada enquanto o frete está pendente.");
        this.distanciaKm = rota.distanciaKm();
        this.distanciaEstimada = rota.estimada();
    }

    // ---------- Transições de estado ----------

    public void aceitar(Motorista motorista) {
        Objects.requireNonNull(motorista, "Motorista não pode ser nulo.");
        exigirStatus(StatusFrete.PENDENTE, "Apenas fretes pendentes podem receber motorista.");
        if (!motorista.getTipoVeiculo().suporta(pesoKg)) {
            throw new RegraNegocioException("O veículo " + motorista.getTipoVeiculo().getDescricao()
                    + " não suporta uma carga de " + pesoKg + " kg.");
        }
        if (feriado && !motorista.isAceitaFeriado()) {
            throw new RegraNegocioException("Este frete é no feriado (" + nomeFeriado
                    + ") e o motorista não aceita trabalhar em feriados.");
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
    public BigDecimal getAdicionalFeriado() {return adicionalFeriado;}
    public BigDecimal getValorTotal() {return valorTotal;}
    public LocalDate getDataColeta() {return dataColeta;}
    public boolean isFeriado() {return feriado;}
    public String getNomeFeriado() {return nomeFeriado;}
    public boolean isDomingo() {return domingo;}
    public BigDecimal getDistanciaKm() {return distanciaKm;}
    public Boolean getDistanciaEstimada() {return distanciaEstimada;}
    public StatusFrete getStatus() {return status;}
    public String getMotivoCancelamento() {return motivoCancelamento;}
    public Instant getCriadoEm() {return criadoEm;}
    public Instant getAceitoEm() {return aceitoEm;}
    public Instant getConcluidoEm() {return concluidoEm;}
}
