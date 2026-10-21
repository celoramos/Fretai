package br.com.fretai.documento.domain;

import br.com.fretai.shared.seguranca.Papel;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.Instant;
import java.util.UUID;

/** Registro de cada link gerado para um documento: quem, de onde e quando. */
@Entity
public class AcessoDocumento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID documentoId;

    @Column(nullable = false)
    private UUID usuarioId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Papel papel;

    @Column(length = 64)
    private String origem;

    @Column(nullable = false)
    private Instant acessadoEm;

    protected AcessoDocumento() {
    }

    public AcessoDocumento(UUID documentoId, UsuarioLogado quem, String origem) {
        this.documentoId = documentoId;
        this.usuarioId = quem.id();
        this.papel = quem.papel();
        this.origem = origem;
        this.acessadoEm = Instant.now();
    }

    public UUID getUsuarioId() {return usuarioId;}
    public Papel getPapel() {return papel;}
    public String getOrigem() {return origem;}
    public Instant getAcessadoEm() {return acessadoEm;}
}
