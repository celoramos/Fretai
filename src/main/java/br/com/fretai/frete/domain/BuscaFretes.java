package br.com.fretai.frete.domain;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Busca geográfica de fretes. Vive atrás de uma interface porque depende de
 * PostGIS (ST_DWithin): o resto do sistema não sabe disso.
 */
public interface BuscaFretes {

    /** Mais perto primeiro. A ordenação do {@code pageable} é ignorada: a busca sempre ordena por distância. */
    Page<Encontrado> buscar(FiltroBusca filtro, Pageable pageable);

    /** @param distanciaKm em linha reta, da origem pedida até a coleta do frete */
    record Encontrado(UUID freteId, double distanciaKm) {
    }
}
