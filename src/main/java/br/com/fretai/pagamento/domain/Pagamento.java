package br.com.fretai.pagamento.domain;

import br.com.fretai.empresa.domain.Empresa;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.usuario.domain.Cliente;
import br.com.fretai.usuario.domain.Motorista;
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
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * O dinheiro de um frete, do ponto de vista do Fretaí: quanto, em que pé está e
 * os ids no PSP. O dinheiro mesmo fica no PSP.
 *
 * <pre>
 *   PENDENTE ──webhook──▶ RETIDO ──saída──▶ ADIANTAMENTO_LIBERADO ──entrega confirmada──▶ LIBERADO
 *       └──────────────────┴──cancelamento──▶ ESTORNADO
 * </pre>
 */
@Entity
public class Pagamento {

    private static final BigDecimal CEM = BigDecimal.valueOf(100);

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Webhook e job de liberação podem chegar juntos: só um grava. */
    @Version
    private Long versao;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "frete_id")
    private Frete frete;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contratante_empresa_id")
    private Empresa contratanteEmpresa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contratante_cliente_id")
    private Cliente contratanteCliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "motorista_id")
    private Motorista motorista;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valorTotal;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valorAdiantamento;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valorSaldo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusPagamento status;

    @Column(nullable = false, length = 20)
    private String gateway;

    @Column(nullable = false, unique = true, length = 100)
    private String cobrancaId;

    // Nome explícito: a estratégia padrão juntaria "copiaECola" em "copiaecola".
    @Column(name = "pix_copia_e_cola", length = 500)
    private String pixCopiaECola;

    @Column(length = 30000)
    private String pixQrCode;

    @Column(nullable = false)
    private Instant vencimento;

    private Instant pagoEm;

    @Column(length = 100)
    private String adiantamentoTransferencia;
    private Instant adiantamentoLiberadoEm;

    /** Preenchido pelo canhoto: antes disso o saldo não sai. Depois, só se ninguém contestar até lá. */
    private Instant saldoLiberavelApos;

    @Column(nullable = false)
    private boolean saldoBloqueado;

    @Column(length = 100)
    private String saldoTransferencia;
    private Instant saldoLiberadoEm;
    private Instant estornadoEm;

    @Column(nullable = false)
    private Instant criadoEm;

    protected Pagamento() {
    }

    /**
     * @param adiantamentoPercentual 0 a 100, combinado na proposta aceita
     */
    public Pagamento(Frete frete, BigDecimal valorTotal, BigDecimal adiantamentoPercentual, Instant vencimento,
                     String gateway, GatewayPagamento.CobrancaPix cobranca) {
        this.frete = Objects.requireNonNull(frete);
        this.contratanteEmpresa = frete.getEmpresa();
        this.contratanteCliente = frete.getCliente();
        this.motorista = Objects.requireNonNull(frete.getMotorista(), "O frete ainda não tem motorista.");
        this.valorTotal = valorTotal;
        this.valorAdiantamento = valorTotal.multiply(adiantamentoPercentual).divide(CEM, 2, RoundingMode.HALF_UP);
        this.valorSaldo = valorTotal.subtract(valorAdiantamento);
        this.vencimento = vencimento;
        this.gateway = gateway;
        this.cobrancaId = cobranca.id();
        this.pixCopiaECola = cobranca.copiaECola();
        this.pixQrCode = cobranca.qrCodeBase64();
        this.status = StatusPagamento.PENDENTE;
        this.criadoEm = Instant.now();
    }

    /** Webhook do PSP: o Pix caiu. */
    public void confirmarRecebimento(Instant quando) {
        exigir(StatusPagamento.PENDENTE, "Pagamento não está aguardando confirmação.");
        this.status = StatusPagamento.RETIDO;
        this.pagoEm = quando;
    }

    /** @param transferenciaId nulo quando o adiantamento combinado é zero (nada a transferir) */
    public void registrarAdiantamento(String transferenciaId) {
        exigir(StatusPagamento.RETIDO, "Adiantamento só sai de pagamento retido.");
        this.status = StatusPagamento.ADIANTAMENTO_LIBERADO;
        this.adiantamentoTransferencia = transferenciaId;
        this.adiantamentoLiberadoEm = Instant.now();
    }

    /** Canhoto recebido: o saldo pode sair depois da janela de contestação. */
    public void agendarLiberacaoSaldo(Instant aPartirDe) {
        if (status != StatusPagamento.ADIANTAMENTO_LIBERADO) {
            throw new IllegalStateException("O saldo só é agendado depois que a carga saiu com o pagamento retido.");
        }
        this.saldoLiberavelApos = aPartirDe;
    }

    /** O recebedor contestou a entrega: o saldo fica parado até um administrador analisar. */
    public void bloquearSaldo() {
        if (status == StatusPagamento.LIBERADO) {
            throw new RegraNegocioException("O saldo já foi liberado; a contestação chegou tarde.");
        }
        this.saldoBloqueado = true;
    }

    public void desbloquearSaldo() {
        this.saldoBloqueado = false;
    }

    public boolean saldoPodeSair(Instant agora) {
        return status == StatusPagamento.ADIANTAMENTO_LIBERADO && !saldoBloqueado
                && saldoLiberavelApos != null && !agora.isBefore(saldoLiberavelApos);
    }

    public void registrarSaldo(String transferenciaId) {
        if (!saldoPodeSair(Instant.now())) {
            throw new IllegalStateException("O saldo ainda não pode ser liberado.");
        }
        this.status = StatusPagamento.LIBERADO;
        this.saldoTransferencia = transferenciaId;
        this.saldoLiberadoEm = Instant.now();
    }

    /** Só antes da saída da carga: depois disso o adiantamento já foi para o motorista. */
    public void estornar() {
        if (status != StatusPagamento.PENDENTE && status != StatusPagamento.RETIDO) {
            throw new IllegalStateException("Não há como estornar: o dinheiro já começou a ser liberado.");
        }
        this.status = StatusPagamento.ESTORNADO;
        this.estornadoEm = Instant.now();
    }

    /** Para o "% de saldos pagos em dia" do perfil da empresa. */
    public boolean pagoEmDia() {
        return pagoEm != null && !pagoEm.isAfter(vencimento);
    }

    private void exigir(StatusPagamento esperado, String mensagem) {
        if (status != esperado) {
            throw new IllegalStateException(mensagem + " (status atual: " + status + ")");
        }
    }

    public UUID getId() {return id;}
    public Frete getFrete() {return frete;}
    public Motorista getMotorista() {return motorista;}
    public BigDecimal getValorTotal() {return valorTotal;}
    public BigDecimal getValorAdiantamento() {return valorAdiantamento;}
    public BigDecimal getValorSaldo() {return valorSaldo;}
    public StatusPagamento getStatus() {return status;}
    public String getGateway() {return gateway;}
    public String getCobrancaId() {return cobrancaId;}
    public String getPixCopiaECola() {return pixCopiaECola;}
    public String getPixQrCode() {return pixQrCode;}
    public Instant getVencimento() {return vencimento;}
    public Instant getPagoEm() {return pagoEm;}
    public Instant getAdiantamentoLiberadoEm() {return adiantamentoLiberadoEm;}
    public Instant getSaldoLiberavelApos() {return saldoLiberavelApos;}
    public boolean isSaldoBloqueado() {return saldoBloqueado;}
    public Instant getSaldoLiberadoEm() {return saldoLiberadoEm;}
    public Instant getEstornadoEm() {return estornadoEm;}
    public Instant getCriadoEm() {return criadoEm;}
}
