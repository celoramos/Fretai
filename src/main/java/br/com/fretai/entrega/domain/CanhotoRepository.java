package br.com.fretai.entrega.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CanhotoRepository extends JpaRepository<Canhoto, UUID> {

    Optional<Canhoto> findByFreteId(UUID freteId);

    Optional<Canhoto> findByCodigoContestacaoHash(String hash);

    List<Canhoto> findByContestadoTrueAndResolucaoIsNullOrderByContestadoEm();
}
