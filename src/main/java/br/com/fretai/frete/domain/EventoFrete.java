package br.com.fretai.frete.domain;

import br.com.fretai.shared.seguranca.Papel;
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
import java.util.UUID;

/**
 * Uma linha da trilha de auditoria do frete: de que status para qual, quem
 * mudou e quando. Só é criada pelo próprio {@link Frete} e nunca é alterada.
 */
@Entity
public class EventoFrete {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "frete_id")
    private Frete frete;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private StatusFrete statusAnterior;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusFrete statusNovo;

    /** Nulo quando foi o sistema (ex.: liberação automática do saldo). */
    private UUID autorId;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Papel autorPapel;

    @Column(length = 500)
    private String observacao;

    @Column(nullable = false)
    private Instant ocorridoEm;

    protected EventoFrete() {
    }

    EventoFrete(Frete frete, StatusFrete statusAnterior, StatusFrete statusNovo, Autor autor, String observacao) {
        this.frete = frete;
        this.statusAnterior = statusAnterior;
        this.statusNovo = statusNovo;
        this.autorId = autor.id();
        this.autorPapel = autor.papel();
        this.observacao = observacao;
        this.ocorridoEm = Instant.now();
    }

    public UUID getId() {return id;}
    public StatusFrete getStatusAnterior() {return statusAnterior;}
    public StatusFrete getStatusNovo() {return statusNovo;}
    public UUID getAutorId() {return autorId;}
    public Papel getAutorPapel() {return autorPapel;}
    public String getObservacao() {return observacao;}
    public Instant getOcorridoEm() {return ocorridoEm;}
}
