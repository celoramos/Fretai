-- Canhoto digital: prova de entrega com foto, GPS e assinatura do recebedor.
CREATE TABLE canhoto (
    id                       UUID PRIMARY KEY,
    frete_id                 UUID          NOT NULL UNIQUE REFERENCES frete (id),
    motorista_id             UUID          NOT NULL REFERENCES motorista (id),
    foto_chave               VARCHAR(300)  NOT NULL,
    assinatura_chave         VARCHAR(300)  NOT NULL,
    nome_recebedor           VARCHAR(100)  NOT NULL,
    latitude                 DOUBLE PRECISION NOT NULL,
    longitude                DOUBLE PRECISION NOT NULL,
    -- Nula quando o destino do frete não tem coordenadas (local não conferido).
    distancia_destino_km     NUMERIC(8, 3),
    registrado_em            TIMESTAMP WITH TIME ZONE NOT NULL,
    contestacao_ate          TIMESTAMP WITH TIME ZONE NOT NULL,
    -- SHA-256 do código que o recebedor usa para contestar sem ter conta.
    codigo_contestacao_hash  VARCHAR(64)   NOT NULL UNIQUE,
    contestado               BOOLEAN       NOT NULL DEFAULT FALSE,
    motivo_contestacao       VARCHAR(500),
    contestado_em            TIMESTAMP WITH TIME ZONE,
    resolucao                VARCHAR(30),
    observacao_resolucao     VARCHAR(500),
    resolvido_em             TIMESTAMP WITH TIME ZONE
);

-- Onde o motorista costuma estar e até onde quer ser avisado de frete novo.
ALTER TABLE motorista ADD COLUMN base_latitude     DOUBLE PRECISION;
ALTER TABLE motorista ADD COLUMN base_longitude    DOUBLE PRECISION;
ALTER TABLE motorista ADD COLUMN raio_interesse_km INTEGER;
