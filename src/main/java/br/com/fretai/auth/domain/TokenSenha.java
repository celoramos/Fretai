package br.com.fretai.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.Instant;
import java.util.UUID;

/**
 * Link de senha nova. Como no refresh token, só o hash SHA-256 fica no banco: quem ler o banco não troca
 * a senha de ninguém. Vale uma vez e vence.
 */
@Entity
public class TokenSenha {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID usuarioId;

    @Column(nullable = false, unique = true, length = 64)
    private String hash;

    @Column(nullable = false)
    private Instant expiraEm;

    /** Usado, ou deixado de lado por um pedido mais novo. */
    private Instant usadoEm;

    @Column(nullable = false)
    private Instant criadoEm;

    protected TokenSenha() {
    }

    public TokenSenha(UUID usuarioId, String hash, Instant expiraEm) {
        this.usuarioId = usuarioId;
        this.hash = hash;
        this.expiraEm = expiraEm;
        this.criadoEm = Instant.now();
    }

    public boolean valido(Instant agora) {
        return usadoEm == null && agora.isBefore(expiraEm);
    }

    public void usar(Instant agora) {
        this.usadoEm = agora;
    }

    public UUID getUsuarioId() {return usuarioId;}
}
