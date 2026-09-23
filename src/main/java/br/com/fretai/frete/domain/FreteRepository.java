package br.com.fretai.frete.domain;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FreteRepository extends JpaRepository<Frete, UUID> {

    // Carrega cliente e motorista na mesma query: evita o problema N+1 ao listar.
    @EntityGraph(attributePaths = {"cliente", "motorista"})
    Page<Frete> findByStatus(StatusFrete status, Pageable pageable);
}
