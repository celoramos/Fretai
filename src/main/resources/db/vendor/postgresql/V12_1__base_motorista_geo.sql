-- Ponto base do motorista como geography gerada, para "frete novo perto de mim".
ALTER TABLE motorista ADD COLUMN base_geo geography(Point, 4326)
    GENERATED ALWAYS AS (
        CASE WHEN base_latitude IS NULL OR base_longitude IS NULL THEN NULL
             ELSE ST_SetSRID(ST_MakePoint(base_longitude, base_latitude), 4326)::geography
        END) STORED;

CREATE INDEX idx_motorista_base_geo ON motorista USING GIST (base_geo);
