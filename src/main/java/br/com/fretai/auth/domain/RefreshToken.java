package br.com.fretai.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.Instant;
import java.util.UUID;

/**
 * Sessão de longa duração. O valor que o app guarda nunca é gravado: só o hash
 * dele. Cada renovação revoga este registro e cria outro (rotação).
 */
@Entity
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID usuarioId;

    @Column(nullable = false, unique = true, length = 64)
    private String hash;

    @Column(nullable = false)
    private Instant expiraEm;

    @Column(nullable = false)
    private boolean revogado;

    @Column(nullable = false)
    private Instant criadoEm;

    protected RefreshToken() {
    }

    public RefreshToken(UUID usuarioId, String hash, Instant expiraEm) {
        this.usuarioId = usuarioId;
        this.hash = hash;
        this.expiraEm = expiraEm;
        this.criadoEm = Instant.now();
    }

    public boolean valido(Instant agora) {
        return !revogado && agora.isBefore(expiraEm);
    }

    public void revogar() {
        this.revogado = true;
    }

    public UUID getUsuarioId() {return usuarioId;}
    public boolean isRevogado() {return revogado;}
}
