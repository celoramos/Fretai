-- Índices espaciais da busca por raio. ST_DWithin sobre geography usa GIST;
-- sem eles, cada busca leria a tabela de fretes inteira.
CREATE INDEX idx_frete_coleta_geo  ON frete USING GIST (ponto_coleta_geo);
CREATE INDEX idx_frete_entrega_geo ON frete USING GIST (ponto_entrega_geo);
