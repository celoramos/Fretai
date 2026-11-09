-- Fotos que o cliente pessoa física manda com o pedido (até 5), para o motorista ver antes de aceitar.
CREATE TABLE foto_carga (
    id        UUID PRIMARY KEY,
    frete_id  UUID         NOT NULL REFERENCES frete (id),
    chave     VARCHAR(200) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_foto_carga_frete ON foto_carga (frete_id);
