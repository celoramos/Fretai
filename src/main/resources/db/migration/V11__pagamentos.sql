-- Pagamento com garantia: o contratante paga por Pix no aceite, o valor fica
-- retido no PSP, o adiantamento sai na saída da carga e o saldo na entrega.
-- O Fretaí não guarda dinheiro: só guarda o estado e os ids do PSP.

-- Para onde o PSP transfere adiantamento e saldo.
ALTER TABLE motorista ADD COLUMN chave_pix VARCHAR(77);

CREATE TABLE pagamento (
    id                          UUID PRIMARY KEY,
    versao                      BIGINT         NOT NULL,
    frete_id                    UUID           NOT NULL REFERENCES frete (id),
    contratante_empresa_id      UUID REFERENCES empresa (id),
    contratante_cliente_id      UUID REFERENCES cliente (id),
    motorista_id                UUID           NOT NULL REFERENCES motorista (id),
    valor_total                 NUMERIC(12, 2) NOT NULL,
    valor_adiantamento          NUMERIC(12, 2) NOT NULL,
    valor_saldo                 NUMERIC(12, 2) NOT NULL,
    status                      VARCHAR(30)    NOT NULL,
    gateway                     VARCHAR(20)    NOT NULL,
    cobranca_id                 VARCHAR(100)   NOT NULL UNIQUE,
    pix_copia_e_cola            VARCHAR(500),
    pix_qr_code                 VARCHAR(30000),
    vencimento                  TIMESTAMP WITH TIME ZONE NOT NULL,
    pago_em                     TIMESTAMP WITH TIME ZONE,
    adiantamento_transferencia  VARCHAR(100),
    adiantamento_liberado_em    TIMESTAMP WITH TIME ZONE,
    saldo_liberavel_apos        TIMESTAMP WITH TIME ZONE,
    saldo_bloqueado             BOOLEAN        NOT NULL DEFAULT FALSE,
    saldo_transferencia         VARCHAR(100),
    saldo_liberado_em           TIMESTAMP WITH TIME ZONE,
    estornado_em                TIMESTAMP WITH TIME ZONE,
    criado_em                   TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_pagamento_frete ON pagamento (frete_id);
CREATE INDEX idx_pagamento_empresa ON pagamento (contratante_empresa_id, vencimento);
CREATE INDEX idx_pagamento_liberacao ON pagamento (status, saldo_liberavel_apos);

-- Idempotência de webhook: o PSP reenvia o mesmo evento; o id dele é a chave.
CREATE TABLE webhook_recebido (
    id_evento   VARCHAR(120) PRIMARY KEY,
    gateway     VARCHAR(20)  NOT NULL,
    tipo        VARCHAR(40)  NOT NULL,
    cobranca_id VARCHAR(100),
    recebido_em TIMESTAMP WITH TIME ZONE NOT NULL
);
