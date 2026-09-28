-- Coordenadas de coleta e entrega (Nominatim/OpenStreetMap) e distância da rota (GraphHopper).
-- Tudo opcional: fretes antigos, e os que não forem localizados no mapa, ficam com NULL.

ALTER TABLE frete ADD COLUMN ponto_coleta_latitude   DOUBLE PRECISION;
ALTER TABLE frete ADD COLUMN ponto_coleta_longitude  DOUBLE PRECISION;
ALTER TABLE frete ADD COLUMN ponto_entrega_latitude  DOUBLE PRECISION;
ALTER TABLE frete ADD COLUMN ponto_entrega_longitude DOUBLE PRECISION;

-- distancia_estimada = TRUE quando a distância veio da linha reta, e não de um roteador.
ALTER TABLE frete ADD COLUMN distancia_km       NUMERIC(8, 1);
ALTER TABLE frete ADD COLUMN distancia_estimada BOOLEAN;
