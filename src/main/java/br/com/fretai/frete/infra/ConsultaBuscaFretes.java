package br.com.fretai.frete.infra;

import br.com.fretai.frete.domain.FiltroBusca;
import br.com.fretai.frete.domain.OpcaoFiltro;
import java.util.Map;
import java.util.TreeMap;

/**
 * Monta o SQL da busca por raio. Separado do acesso ao banco para poder testar
 * a montagem (quais filtros viram quais cláusulas) sem PostgreSQL.
 *
 * Todo valor vai como parâmetro nomeado; nada do usuário é concatenado no SQL.
 */
final class ConsultaBuscaFretes {

    private static final String PONTO = "ST_SetSRID(ST_MakePoint(:%s, :%s), 4326)::geography";

    private final StringBuilder where = new StringBuilder();
    private final Map<String, Object> parametros = new TreeMap<>();

    ConsultaBuscaFretes(FiltroBusca filtro) {
        parametros.put("status", FiltroBusca.STATUS_VISIVEIS.stream().map(Enum::name).sorted().toList());
        parametros.put("origemLat", filtro.origem().latitude());
        parametros.put("origemLng", filtro.origem().longitude());
        parametros.put("raioM", filtro.raioKm() * 1000);
        where.append("f.status IN (:status)")
                // ST_DWithin em geography usa o índice GIST e mede em metros sobre o elipsoide.
                .append(" AND ST_DWithin(f.ponto_coleta_geo, ").append(ponto("origemLat", "origemLng"))
                .append(", :raioM)");

        if (filtro.destino() != null) {
            parametros.put("destinoLat", filtro.destino().latitude());
            parametros.put("destinoLng", filtro.destino().longitude());
            parametros.put("raioDestinoM", filtro.raioDestinoKm() * 1000);
            where.append(" AND ST_DWithin(f.ponto_entrega_geo, ").append(ponto("destinoLat", "destinoLng"))
                    .append(", :raioDestinoM)");
        }
        if (!filtro.tiposVeiculo().isEmpty()) {
            parametros.put("tiposVeiculo", filtro.tiposVeiculo().stream().map(Enum::name).sorted().toList());
            where.append(aceitaQualquerOu("frete_tipo_veiculo", "tipo_veiculo", "tiposVeiculo"));
        }
        if (!filtro.carrocerias().isEmpty()) {
            parametros.put("carrocerias", filtro.carrocerias().stream().map(Enum::name).sorted().toList());
            where.append(aceitaQualquerOu("frete_tipo_carroceria", "tipo_carroceria", "carrocerias"));
        }
        booleano(filtro.exigeRastreador(), "f.exige_rastreador", "exigeRastreador");
        booleano(filtro.agenciador(), "f.publicado_por_agenciador", "agenciador");
        booleano(filtro.comPreco(), "(f.valor IS NOT NULL)", "comPreco");
        booleano(filtro.complemento(), "f.complemento", "complemento");
    }

    String sqlPagina() {
        return "SELECT f.id, ST_Distance(f.ponto_coleta_geo, " + ponto("origemLat", "origemLng") + ") / 1000.0"
                + " AS distancia_km FROM frete f WHERE " + where
                + " ORDER BY distancia_km, f.criado_em DESC LIMIT :limite OFFSET :deslocamento";
    }

    String sqlContagem() {
        return "SELECT count(*) FROM frete f WHERE " + where;
    }

    Map<String, Object> parametros() {
        return parametros;
    }

    private static String ponto(String lat, String lng) {
        return PONTO.formatted(lng, lat);
    }

    /** Frete sem restrição de tipo aceita qualquer um; com restrição, precisa listar o tipo pedido. */
    private static String aceitaQualquerOu(String tabela, String coluna, String parametro) {
        return " AND (NOT EXISTS (SELECT 1 FROM " + tabela + " t WHERE t.frete_id = f.id)"
                + " OR EXISTS (SELECT 1 FROM " + tabela + " t WHERE t.frete_id = f.id AND t." + coluna
                + " IN (:" + parametro + ")))";
    }

    private void booleano(OpcaoFiltro opcao, String expressao, String parametro) {
        Boolean valor = opcao.comoBooleano();
        if (valor != null) {
            parametros.put(parametro, valor);
            where.append(" AND ").append(expressao).append(" = :").append(parametro);
        }
    }
}
