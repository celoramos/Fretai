package br.com.fretai.reputacao.domain;

import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.StatusFrete;
import br.com.fretai.shared.exception.AcessoNegadoException;
import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.shared.seguranca.UsuarioLogado;
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
import java.util.Set;
import java.util.UUID;

/**
 * Nota de 1 a 5 de um lado do frete para o outro. Só depois da entrega: avaliar
 * antes seria avaliar promessa, não serviço.
 */
@Entity
public class Avaliacao {

    private static final Set<StatusFrete> PODE_AVALIAR = Set.of(StatusFrete.ENTREGUE, StatusFrete.PAGO);

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "frete_id")
    private Frete frete;

    /** Quem está avaliando: um frete tem no máximo uma avaliação de cada lado. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Lado lado;

    @Column(nullable = false)
    private UUID avaliadorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoAvaliado avaliadoTipo;

    @Column(nullable = false)
    private UUID avaliadoId;

    @Column(nullable = false)
    private int nota;

    @Column(length = 500)
    private String comentario;

    @Column(nullable = false)
    private Instant criadaEm;

    protected Avaliacao() {
    }

    /**
     * Descobre sozinho quem avalia quem a partir do frete e de quem está logado.
     *
     * @throws AcessoNegadoException se a pessoa não participou do frete
     */
    public static Avaliacao registrar(Frete frete, UsuarioLogado quem, int nota, String comentario) {
        if (!PODE_AVALIAR.contains(frete.getStatus())) {
            throw new RegraNegocioException("Só é possível avaliar depois da entrega.");
        }
        if (nota < 1 || nota > 5) {
            throw new RegraNegocioException("A nota vai de 1 a 5.");
        }
        Avaliacao a = new Avaliacao();
        a.frete = frete;
        a.avaliadorId = quem.id();
        a.nota = nota;
        a.comentario = comentario;
        a.criadaEm = Instant.now();
        if (frete.ehMotoristaDoFrete(quem)) {
            a.lado = Lado.MOTORISTA;
            if (frete.getEmpresa() != null) {
                a.avaliadoTipo = TipoAvaliado.EMPRESA;
                a.avaliadoId = frete.getEmpresa().getId();
            } else {
                a.avaliadoTipo = TipoAvaliado.CLIENTE;
                a.avaliadoId = frete.getCliente().getId();
            }
        } else if (frete.ehContratante(quem)) {
            a.lado = Lado.CONTRATANTE;
            a.avaliadoTipo = TipoAvaliado.MOTORISTA;
            a.avaliadoId = frete.getMotorista().getId();
        } else {
            throw new AcessoNegadoException("Só quem participou do frete pode avaliá-lo.");
        }
        return a;
    }

    public UUID getId() {return id;}
    public Frete getFrete() {return frete;}
    public Lado getLado() {return lado;}
    public UUID getAvaliadorId() {return avaliadorId;}
    public TipoAvaliado getAvaliadoTipo() {return avaliadoTipo;}
    public UUID getAvaliadoId() {return avaliadoId;}
    public int getNota() {return nota;}
    public String getComentario() {return comentario;}
    public Instant getCriadaEm() {return criadaEm;}

    public enum Lado {CONTRATANTE, MOTORISTA}

    public enum TipoAvaliado {EMPRESA, CLIENTE, MOTORISTA}
}
