package br.com.fretai.frete.infra;

import br.com.fretai.frete.domain.BuscaFretes;
import br.com.fretai.frete.domain.FiltroBusca;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

/** Busca por raio com ST_DWithin/ST_Distance do PostGIS, sobre as colunas geography geradas (V4_1). */
@Component
class PostgisBuscaFretes implements BuscaFretes {

    private final NamedParameterJdbcTemplate jdbc;

    PostgisBuscaFretes(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Page<Encontrado> buscar(FiltroBusca filtro, Pageable pageable) {
        ConsultaBuscaFretes consulta = new ConsultaBuscaFretes(filtro);
        MapSqlParameterSource parametros = new MapSqlParameterSource(consulta.parametros());

        Long total = jdbc.queryForObject(consulta.sqlContagem(), parametros, Long.class);
        if (total == null || total == 0) {
            return Page.empty(pageable);
        }
        parametros.addValues(Map.of("limite", pageable.getPageSize(), "deslocamento", pageable.getOffset()));
        List<Encontrado> pagina = jdbc.query(consulta.sqlPagina(), parametros, (rs, i) ->
                new Encontrado(rs.getObject("id", UUID.class), rs.getDouble("distancia_km")));
        return new PageImpl<>(pagina, pageable, total);
    }
}
