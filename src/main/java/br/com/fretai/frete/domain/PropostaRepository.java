package br.com.fretai.frete.domain;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PropostaRepository extends JpaRepository<Proposta, UUID> {

    @EntityGraph(attributePaths = {"motorista", "veiculo"})
    List<Proposta> findByFreteIdOrderByCriadaEm(UUID freteId);

    @EntityGraph(attributePaths = {"frete", "veiculo"})
    Page<Proposta> findByMotoristaId(UUID motoristaId, Pageable pageable);

    List<Proposta> findByFreteIdAndStatus(UUID freteId, StatusProposta status);

    boolean existsByFreteIdAndMotoristaIdAndStatus(UUID freteId, UUID motoristaId, StatusProposta status);
}
