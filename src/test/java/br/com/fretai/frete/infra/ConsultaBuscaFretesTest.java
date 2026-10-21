package br.com.fretai.frete.infra;

import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.frete.domain.FiltroBusca;
import br.com.fretai.frete.domain.OpcaoFiltro;
import br.com.fretai.veiculo.domain.TipoCarroceria;
import br.com.fretai.veiculo.domain.TipoVeiculo;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Montagem do SQL da busca: o que entra e o que fica de fora conforme os filtros. */
@DisplayName("SQL da busca por raio")
class ConsultaBuscaFretesTest {

    private static final Coordenadas CAMPINAS = new Coordenadas(-22.9056, -47.0608);

    @Test
    @DisplayName("Só origem: ST_DWithin na coleta, raio em metros, ordena por distância")
    void soOrigem() {
        ConsultaBuscaFretes c = new ConsultaBuscaFretes(new FiltroBusca(CAMPINAS, 50, null, 0,
                null, null, null, null, null, null));

        assertTrue(c.sqlPagina().contains("ST_DWithin(f.ponto_coleta_geo"));
        assertTrue(c.sqlPagina().contains("ORDER BY distancia_km"));
        assertFalse(c.sqlPagina().contains("ponto_entrega_geo"));
        assertFalse(c.sqlContagem().contains("frete_tipo_veiculo"));
        assertEquals(50_000.0, c.parametros().get("raioM"));
        assertEquals(List.of("PROPOSTA_ENVIADA", "PUBLICADO"), c.parametros().get("status"));
    }

    @Test
    @DisplayName("Destino, tipos e flags SIM/NAO viram cláusulas; AMBOS não filtra")
    void todosOsFiltros() {
        ConsultaBuscaFretes c = new ConsultaBuscaFretes(new FiltroBusca(CAMPINAS, 200,
                new Coordenadas(-23.55, -46.63), 100,
                Set.of(TipoVeiculo.CARRETA), Set.of(TipoCarroceria.SIDER, TipoCarroceria.BAU),
                OpcaoFiltro.NAO, OpcaoFiltro.AMBOS, OpcaoFiltro.SIM, OpcaoFiltro.AMBOS));
        String sql = c.sqlContagem();

        assertTrue(sql.contains("ST_DWithin(f.ponto_entrega_geo"));
        assertTrue(sql.contains("frete_tipo_veiculo"));
        assertTrue(sql.contains("frete_tipo_carroceria"));
        assertTrue(sql.contains("f.exige_rastreador = :exigeRastreador"));
        assertTrue(sql.contains("(f.valor IS NOT NULL) = :comPreco"));
        assertFalse(sql.contains("publicado_por_agenciador"), "AMBOS não filtra");
        assertFalse(sql.contains("f.complemento"), "AMBOS não filtra");
        assertEquals(Boolean.FALSE, c.parametros().get("exigeRastreador"));
        assertEquals(List.of("BAU", "SIDER"), c.parametros().get("carrocerias"));
    }

    @Test
    @DisplayName("Nenhum valor do usuário é concatenado no SQL")
    void semConcatenacao() {
        ConsultaBuscaFretes c = new ConsultaBuscaFretes(new FiltroBusca(new Coordenadas(-12.3456, 45.6789), 77,
                null, 0, Set.of(TipoVeiculo.TRUCK), null, OpcaoFiltro.SIM, null, null, null));

        assertFalse(c.sqlPagina().contains("12.3456"));
        assertFalse(c.sqlPagina().contains("TRUCK"));
        assertFalse(c.sqlPagina().contains("77"));
    }
}
