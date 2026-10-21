-- Só roda no PostgreSQL (o H2 dos testes não tem PostGIS).
-- As colunas geography são GERADAS a partir de latitude/longitude: o Java grava
-- só os números e o banco mantém o ponto sempre em sincronia, sem o Hibernate
-- precisar conhecer tipos espaciais.

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE frete ADD COLUMN ponto_coleta_geo geography(Point, 4326)
    GENERATED ALWAYS AS (
        CASE WHEN ponto_coleta_latitude IS NULL OR ponto_coleta_longitude IS NULL THEN NULL
             ELSE ST_SetSRID(ST_MakePoint(ponto_coleta_longitude, ponto_coleta_latitude), 4326)::geography
        END) STORED;

ALTER TABLE frete ADD COLUMN ponto_entrega_geo geography(Point, 4326)
    GENERATED ALWAYS AS (
        CASE WHEN ponto_entrega_latitude IS NULL OR ponto_entrega_longitude IS NULL THEN NULL
             ELSE ST_SetSRID(ST_MakePoint(ponto_entrega_longitude, ponto_entrega_latitude), 4326)::geography
        END) STORED;
