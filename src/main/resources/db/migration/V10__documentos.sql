-- Documentos do motorista (CNH, CRLV, comprovantes), sempre ligados a um frete.
-- O arquivo em si fica no armazenamento (disco local ou S3/MinIO); aqui só a chave.
CREATE TABLE documento (
    id             UUID PRIMARY KEY,
    motorista_id   UUID         NOT NULL REFERENCES motorista (id),
    frete_id       UUID         NOT NULL REFERENCES frete (id),
    tipo           VARCHAR(20)  NOT NULL,
    chave          VARCHAR(300) NOT NULL UNIQUE,
    content_type   VARCHAR(50)  NOT NULL,
    tamanho_bytes  BIGINT       NOT NULL,
    verificado     BOOLEAN      NOT NULL DEFAULT FALSE,
    verificado_por UUID,
    verificado_em  TIMESTAMP WITH TIME ZONE,
    criado_em      TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_documento_frete ON documento (frete_id);
CREATE INDEX idx_documento_motorista ON documento (motorista_id, verificado);

-- Quem abriu cada documento e quando (LGPD: dado pessoal de terceiro).
CREATE TABLE acesso_documento (
    id           UUID PRIMARY KEY,
    documento_id UUID        NOT NULL REFERENCES documento (id),
    usuario_id   UUID        NOT NULL,
    papel        VARCHAR(20) NOT NULL,
    origem       VARCHAR(64),
    acessado_em  TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_acesso_documento ON acesso_documento (documento_id, acessado_em);
