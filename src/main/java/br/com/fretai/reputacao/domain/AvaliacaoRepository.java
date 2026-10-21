package br.com.fretai.reputacao.domain;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, UUID> {

    boolean existsByFreteIdAndLado(UUID freteId, Avaliacao.Lado lado);

    List<Avaliacao> findByFreteId(UUID freteId);

    Page<Avaliacao> findByAvaliadoTipoAndAvaliadoId(Avaliacao.TipoAvaliado tipo, UUID avaliadoId, Pageable pageable);

    @Query("""
            SELECT new br.com.fretai.reputacao.domain.MediaNotas(AVG(a.nota), COUNT(a))
            FROM Avaliacao a WHERE a.avaliadoTipo = :tipo AND a.avaliadoId = :avaliadoId""")
    MediaNotas media(Avaliacao.TipoAvaliado tipo, UUID avaliadoId);
}
