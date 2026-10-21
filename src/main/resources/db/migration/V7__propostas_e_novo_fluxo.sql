-- Novo fluxo de status com propostas:
--   PUBLICADO ⇄ PROPOSTA_ENVIADA → ACEITO → EM_TRANSITO → ENTREGUE → PAGO (+ CANCELADO)
-- PENDENTE passa a se chamar PUBLICADO. Os demais status antigos têm o mesmo nome.
UPDATE frete SET status = 'PUBLICADO' WHERE status = 'PENDENTE';
UPDATE evento_frete SET status_anterior = 'PUBLICADO' WHERE status_anterior = 'PENDENTE';
UPDATE evento_frete SET status_novo = 'PUBLICADO' WHERE status_novo = 'PENDENTE';

-- O que foi combinado no aceite. Fretes antigos já aceitos ficam com o valor anunciado e sem adiantamento.
ALTER TABLE frete ADD COLUMN valor_acordado          NUMERIC(12, 2);
ALTER TABLE frete ADD COLUMN adiantamento_percentual NUMERIC(5, 2);
ALTER TABLE frete ADD COLUMN prazo_entrega           DATE;
ALTER TABLE frete ADD COLUMN pago_em                 TIMESTAMP WITH TIME ZONE;
UPDATE frete SET valor_acordado = valor_total, adiantamento_percentual = 0
WHERE status IN ('ACEITO', 'EM_TRANSITO', 'ENTREGUE');

CREATE TABLE proposta (
    id                      UUID PRIMARY KEY,
    frete_id                UUID           NOT NULL REFERENCES frete (id),
    motorista_id            UUID           NOT NULL REFERENCES motorista (id),
    veiculo_id              UUID REFERENCES veiculo (id),
    autor_papel             VARCHAR(20)    NOT NULL,
    autor_id                UUID           NOT NULL,
    valor                   NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
    adiantamento_percentual NUMERIC(5, 2)  NOT NULL CHECK (adiantamento_percentual BETWEEN 0 AND 100),
    prazo_entrega           DATE,
    observacao              VARCHAR(500),
    status                  VARCHAR(20)    NOT NULL,
    criada_em               TIMESTAMP WITH TIME ZONE NOT NULL,
    respondida_em           TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_proposta_frete ON proposta (frete_id, status);
CREATE INDEX idx_proposta_motorista ON proposta (motorista_id, criada_em);
