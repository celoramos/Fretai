package br.com.fretai.frete.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface FreteRepository extends JpaRepository<Frete, UUID> {

    // Carrega as partes na mesma query: evita o problema N+1 ao listar.
    @EntityGraph(attributePaths = {"cliente", "empresa", "motorista", "veiculo"})
    Page<Frete> findByStatus(StatusFrete status, Pageable pageable);

    @EntityGraph(attributePaths = {"empresa", "motorista", "veiculo"})
    Page<Frete> findByEmpresaId(UUID empresaId, Pageable pageable);

    long countByEmpresaId(UUID empresaId);

    long countByEmpresaIdAndStatusIn(UUID empresaId, Collection<StatusFrete> status);

    long countByMotoristaIdAndStatusIn(UUID motoristaId, Collection<StatusFrete> status);

    /**
     * Base do alerta de "fretão": quanto se paga por km em fretes parecidos
     * (mesmas UFs, distância próxima, recentes, não cancelados).
     */
    @Query("""
            SELECT new br.com.fretai.frete.domain.MediaPrecoRota(AVG(f.valorTotal / f.distanciaKm), COUNT(f))
            FROM Frete f
            WHERE f.pontoColeta.uf = :ufOrigem AND f.pontoEntrega.uf = :ufDestino
              AND f.valorTotal IS NOT NULL AND f.distanciaKm BETWEEN :kmMinimo AND :kmMaximo AND f.distanciaKm > 0
              AND f.criadoEm >= :desde AND f.status <> br.com.fretai.frete.domain.StatusFrete.CANCELADO
              AND f.id <> :ignorar""")
    MediaPrecoRota mediaDaRota(String ufOrigem, String ufDestino, BigDecimal kmMinimo, BigDecimal kmMaximo,
                               Instant desde, UUID ignorar);
}
