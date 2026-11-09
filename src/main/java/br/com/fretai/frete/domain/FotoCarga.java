package br.com.fretai.frete.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Foto que o cliente pessoa física manda com o pedido, para o motorista ver o que vai antes de aceitar.
 * O arquivo fica no armazenamento; aqui só a chave, que nunca vem do usuário.
 */
@Entity
public class FotoCarga {

    /** Mais que isso não ajuda a decidir e pesa no celular de quem abre o frete. */
    public static final int MAXIMO_POR_FRETE = 5;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "frete_id")
    private Frete frete;

    @Column(nullable = false, length = 200)
    private String chave;

    @Column(nullable = false)
    private Instant criadoEm;

    protected FotoCarga() {
    }

    public FotoCarga(Frete frete, String chave) {
        this.frete = Objects.requireNonNull(frete, "Frete é obrigatório.");
        this.chave = Objects.requireNonNull(chave, "Chave do arquivo é obrigatória.");
        this.criadoEm = Instant.now();
    }

    public UUID getId() {return id;}
    public Frete getFrete() {return frete;}
    public String getChave() {return chave;}
    public Instant getCriadoEm() {return criadoEm;}
}
