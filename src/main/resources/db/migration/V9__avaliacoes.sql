-- Avaliação bidirecional depois da entrega: o contratante avalia o motorista e
-- o motorista avalia o contratante (empresa ou cliente). Uma por lado por frete.
CREATE TABLE avaliacao (
    id              UUID PRIMARY KEY,
    frete_id        UUID        NOT NULL REFERENCES frete (id),
    lado            VARCHAR(20) NOT NULL,
    avaliador_id    UUID        NOT NULL,
    avaliado_tipo   VARCHAR(20) NOT NULL,
    avaliado_id     UUID        NOT NULL,
    nota            INTEGER     NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario      VARCHAR(500),
    criada_em       TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_avaliacao_frete_lado UNIQUE (frete_id, lado)
);
CREATE INDEX idx_avaliacao_avaliado ON avaliacao (avaliado_tipo, avaliado_id);
