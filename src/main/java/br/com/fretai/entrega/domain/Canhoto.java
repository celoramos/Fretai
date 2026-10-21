package br.com.fretai.entrega.domain;

import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.shared.exception.RegraNegocioException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Comprovante de entrega digital: foto, assinatura do recebedor e o ponto GPS
 * onde o motorista estava. Aberto a contestação até {@code contestacaoAte};
 * contestado, o saldo fica bloqueado até um administrador decidir.
 */
@Entity
public class Canhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "frete_id")
    private Frete frete;

    @Column(nullable = false)
    private UUID motoristaId;

    @Column(nullable = false, length = 300)
    private String fotoChave;

    @Column(nullable = false, length = 300)
    private String assinaturaChave;

    @Column(nullable = false, length = 100)
    private String nomeRecebedor;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(precision = 8, scale = 3)
    private BigDecimal distanciaDestinoKm;

    @Column(nullable = false)
    private Instant registradoEm;

    @Column(nullable = false)
    private Instant contestacaoAte;

    @Column(nullable = false, unique = true, length = 64)
    private String codigoContestacaoHash;

    @Column(nullable = false)
    private boolean contestado;

    @Column(length = 500)
    private String motivoContestacao;

    private Instant contestadoEm;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private Resolucao resolucao;

    @Column(length = 500)
    private String observacaoResolucao;

    private Instant resolvidoEm;

    protected Canhoto() {
    }

    /**
     * @param ondeEstava   GPS do celular no momento da entrega
     * @param raioMaximoKm a que distância do destino a entrega ainda vale
     * @throws RegraNegocioException se o GPS estiver longe demais do destino
     */
    public Canhoto(Frete frete, UUID motoristaId, String fotoChave, String assinaturaChave, String nomeRecebedor,
                   Coordenadas ondeEstava, double raioMaximoKm, Instant contestacaoAte, String codigoContestacaoHash) {
        this.frete = Objects.requireNonNull(frete);
        this.motoristaId = Objects.requireNonNull(motoristaId);
        this.fotoChave = Objects.requireNonNull(fotoChave);
        this.assinaturaChave = Objects.requireNonNull(assinaturaChave);
        this.nomeRecebedor = Objects.requireNonNull(nomeRecebedor);
        this.latitude = ondeEstava.latitude();
        this.longitude = ondeEstava.longitude();
        this.distanciaDestinoKm = frete.getPontoEntrega().getCoordenadas()
                .map(destino -> BigDecimal.valueOf(ondeEstava.distanciaLinhaRetaKm(destino))
                        .setScale(3, RoundingMode.HALF_UP))
                .orElse(null);
        if (distanciaDestinoKm != null && distanciaDestinoKm.doubleValue() > raioMaximoKm) {
            throw new RegraNegocioException("Você está a " + distanciaDestinoKm + " km do destino. O canhoto só vale a até "
                    + raioMaximoKm + " km do endereço de entrega.");
        }
        this.registradoEm = Instant.now();
        this.contestacaoAte = contestacaoAte;
        this.codigoContestacaoHash = codigoContestacaoHash;
    }

    /** @throws RegraNegocioException fora do prazo ou já contestado */
    public void contestar(String motivo) {
        if (Instant.now().isAfter(contestacaoAte)) {
            throw new RegraNegocioException("O prazo para contestar esta entrega terminou.");
        }
        if (contestado) {
            throw new RegraNegocioException("Esta entrega já foi contestada.");
        }
        this.contestado = true;
        this.motivoContestacao = motivo;
        this.contestadoEm = Instant.now();
    }

    public void resolver(Resolucao resolucao, String observacao) {
        if (!contestado || this.resolucao != null) {
            throw new IllegalStateException("Só uma contestação em aberto pode ser resolvida.");
        }
        this.resolucao = resolucao;
        this.observacaoResolucao = observacao;
        this.resolvidoEm = Instant.now();
    }

    public boolean localConferido() {
        return distanciaDestinoKm != null;
    }

    public UUID getId() {return id;}
    public Frete getFrete() {return frete;}
    public UUID getMotoristaId() {return motoristaId;}
    public String getFotoChave() {return fotoChave;}
    public String getAssinaturaChave() {return assinaturaChave;}
    public String getNomeRecebedor() {return nomeRecebedor;}
    public double getLatitude() {return latitude;}
    public double getLongitude() {return longitude;}
    public BigDecimal getDistanciaDestinoKm() {return distanciaDestinoKm;}
    public Instant getRegistradoEm() {return registradoEm;}
    public Instant getContestacaoAte() {return contestacaoAte;}
    public boolean isContestado() {return contestado;}
    public String getMotivoContestacao() {return motivoContestacao;}
    public Instant getContestadoEm() {return contestadoEm;}
    public Resolucao getResolucao() {return resolucao;}
    public String getObservacaoResolucao() {return observacaoResolucao;}
    public Instant getResolvidoEm() {return resolvidoEm;}

    public enum Resolucao {
        /** Entrega confirmada: o saldo é liberado. */
        ENTREGA_CONFIRMADA,
        /** Contestação procedente: o saldo segue bloqueado para acerto fora do sistema (estorno parcial, etc.). */
        CONTESTACAO_PROCEDENTE
    }
}
