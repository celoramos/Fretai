package br.com.fretai.frete.domain;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FotoCargaRepository extends JpaRepository<FotoCarga, UUID> {

    long countByFreteId(UUID freteId);

    List<FotoCarga> findByFreteIdOrderByCriadoEm(UUID freteId);
}
