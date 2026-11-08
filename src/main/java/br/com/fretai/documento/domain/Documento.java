package br.com.fretai.documento.domain;

import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.StatusFrete;
import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.shared.seguranca.UsuarioLogado;
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
import java.time.Instant;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Documento de um motorista, enviado para um frete específico. A regra de quem
 * pode ver mora aqui ({@link #podeSerVistoPor}), para não depender de cada
 * endpoint lembrar dela.
 */
@Entity
public class Documento {

    /** Depois do aceite a empresa já escolheu este motorista: só aí os documentos dele aparecem para ela. */
    private static final Set<StatusFrete> CONTRATANTE_VE = Set.of(StatusFrete.ACEITO, StatusFrete.EM_TRANSITO,
            StatusFrete.ENTREGUE, StatusFrete.PAGO);

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "motorista_id")
    private Motorista motorista;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "frete_id")
    private Frete frete;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoDocumento tipo;

    @Column(nullable = false, unique = true, length = 300)
    private String chave;

    @Column(nullable = false, length = 50)
    private String contentType;

    @Column(nullable = false)
    private long tamanhoBytes;

    @Column(nullable = false)
    private boolean verificado;

    private UUID verificadoPor;
    private Instant verificadoEm;

    private UUID recusadoPor;
    private Instant recusadoEm;

    @Column(length = 300)
    private String motivoRecusa;

    @Column(nullable = false)
    private Instant criadoEm;

    protected Documento() {
    }

    public Documento(Motorista motorista, Frete frete, TipoDocumento tipo, String chave, String contentType,
                     long tamanhoBytes) {
        this.motorista = Objects.requireNonNull(motorista);
        this.frete = Objects.requireNonNull(frete);
        this.tipo = Objects.requireNonNull(tipo);
        this.chave = Objects.requireNonNull(chave);
        this.contentType = Objects.requireNonNull(contentType);
        this.tamanhoBytes = tamanhoBytes;
        this.criadoEm = Instant.now();
    }

    /**
     * O dono sempre vê; o administrador sempre vê; a empresa que contratou só
     * depois que este motorista foi aceito naquele frete. Qualquer outro: não.
     * Recusado não vai para a empresa: pode ser ilegível, ou de outra pessoa.
     */
    public boolean podeSerVistoPor(UsuarioLogado quem) {
        if (quem.isAdmin() || motorista.getId().equals(quem.id())) {
            return true;
        }
        return recusadoEm == null
                && frete.ehContratante(quem)
                && frete.getMotorista() != null
                && frete.getMotorista().getId().equals(motorista.getId())
                && CONTRATANTE_VE.contains(frete.getStatus());
    }

    /** @throws RegraNegocioException se já foi recusado: o motorista precisa enviar outro arquivo */
    public void verificar(UUID administradorId) {
        if (recusadoEm != null) {
            throw new RegraNegocioException("Este documento foi recusado. O motorista precisa enviar outro.");
        }
        this.verificado = true;
        this.verificadoPor = administradorId;
        this.verificadoEm = Instant.now();
    }

    /**
     * Recusado não volta para a fila: o motorista envia outro arquivo, que entra como documento novo.
     *
     * @throws RegraNegocioException se já foi verificado ou recusado
     */
    public void recusar(UUID administradorId, String motivo) {
        if (verificado) {
            throw new RegraNegocioException("Este documento já foi verificado.");
        }
        if (recusadoEm != null) {
            throw new RegraNegocioException("Este documento já foi recusado.");
        }
        this.recusadoPor = administradorId;
        this.recusadoEm = Instant.now();
        this.motivoRecusa = Objects.requireNonNull(motivo);
    }

    public UUID getId() {return id;}
    public Motorista getMotorista() {return motorista;}
    public Frete getFrete() {return frete;}
    public TipoDocumento getTipo() {return tipo;}
    public String getChave() {return chave;}
    public String getContentType() {return contentType;}
    public long getTamanhoBytes() {return tamanhoBytes;}
    public boolean isVerificado() {return verificado;}
    public Instant getVerificadoEm() {return verificadoEm;}
    public Instant getRecusadoEm() {return recusadoEm;}
    public String getMotivoRecusa() {return motivoRecusa;}
    public Instant getCriadoEm() {return criadoEm;}
}
