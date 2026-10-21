package br.com.fretai.frete.domain;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FreteRepository extends JpaRepository<Frete, UUID> {

    // Carrega as partes na mesma query: evita o problema N+1 ao listar.
    @EntityGraph(attributePaths = {"cliente", "empresa", "motorista", "veiculo"})
    Page<Frete> findByStatus(StatusFrete status, Pageable pageable);

    @EntityGraph(attributePaths = {"empresa", "motorista", "veiculo"})
    Page<Frete> findByEmpresaId(UUID empresaId, Pageable pageable);
}
