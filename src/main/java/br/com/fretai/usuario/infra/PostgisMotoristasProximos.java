package br.com.fretai.usuario.infra;

import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.usuario.domain.MotoristasProximos;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

/** Cada motorista tem o próprio raio: a distância é comparada com o raio dele, não com um valor fixo. */
@Component
class PostgisMotoristasProximos implements MotoristasProximos {

    private static final String SQL = """
            SELECT m.id FROM motorista m JOIN usuario u ON u.id = m.id
            WHERE u.ativo AND m.base_geo IS NOT NULL AND m.raio_interesse_km IS NOT NULL
              AND ST_DWithin(m.base_geo, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                             m.raio_interesse_km * 1000)""";

    private final NamedParameterJdbcTemplate jdbc;

    PostgisMotoristasProximos(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<UUID> interessadosEm(Coordenadas ponto) {
        return jdbc.query(SQL, Map.of("lat", ponto.latitude(), "lng", ponto.longitude()),
                (rs, i) -> rs.getObject("id", UUID.class));
    }
}
