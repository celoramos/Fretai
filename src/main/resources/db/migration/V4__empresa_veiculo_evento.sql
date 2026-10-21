-- Marketplace B2B: empresas (embarcador ou agenciador) publicam fretes,
-- caminhoneiros cadastram veículos, e toda mudança de status vira um evento.
-- O fluxo de cliente pessoa física continua funcionando: um frete pertence a
-- um cliente OU a uma empresa, nunca aos dois.

CREATE TABLE empresa (
    id            UUID PRIMARY KEY,
    cnpj          VARCHAR(14)  NOT NULL UNIQUE,
    razao_social  VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    tipo          VARCHAR(20)  NOT NULL,
    telefone      VARCHAR(20)  NOT NULL,
    ativa         BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em     TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Quem faz login em nome da empresa: uma pessoa (CPF) ligada a ela.
CREATE TABLE usuario_empresa (
    id         UUID PRIMARY KEY REFERENCES usuario (id),
    empresa_id UUID NOT NULL REFERENCES empresa (id)
);
CREATE INDEX idx_usuario_empresa_empresa ON usuario_empresa (empresa_id);

CREATE TABLE veiculo (
    id           UUID PRIMARY KEY,
    motorista_id UUID        NOT NULL REFERENCES motorista (id),
    placa        VARCHAR(7)  NOT NULL UNIQUE,
    rntrc        VARCHAR(9)  NOT NULL,
    tipo         VARCHAR(20) NOT NULL,
    carroceria   VARCHAR(20) NOT NULL,
    numero_eixos INTEGER     NOT NULL,
    rastreador   BOOLEAN     NOT NULL,
    ativo        BOOLEAN     NOT NULL DEFAULT TRUE,
    criado_em    TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_veiculo_motorista ON veiculo (motorista_id);

-- Frete de empresa: sem destinatário obrigatório e com valor opcional ("a combinar").
ALTER TABLE frete ALTER COLUMN cliente_id DROP NOT NULL;
ALTER TABLE frete ALTER COLUMN nome_destinatario DROP NOT NULL;
ALTER TABLE frete ALTER COLUMN telefone_destinatario DROP NOT NULL;
ALTER TABLE frete ALTER COLUMN valor DROP NOT NULL;
ALTER TABLE frete ALTER COLUMN valor_total DROP NOT NULL;

ALTER TABLE frete ADD COLUMN empresa_id UUID REFERENCES empresa (id);
ALTER TABLE frete ADD COLUMN veiculo_id UUID REFERENCES veiculo (id);
ALTER TABLE frete ADD COLUMN especie_carga   VARCHAR(100);
ALTER TABLE frete ADD COLUMN tipo_carga_antt VARCHAR(40);
ALTER TABLE frete ADD COLUMN valor_a_combinar         BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE frete ADD COLUMN exige_rastreador         BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE frete ADD COLUMN complemento              BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE frete ADD COLUMN publicado_por_agenciador BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE frete ADD CONSTRAINT ck_frete_um_contratante CHECK (
    (cliente_id IS NOT NULL AND empresa_id IS NULL) OR (cliente_id IS NULL AND empresa_id IS NOT NULL));
-- Sem valor, só se for "a combinar".
ALTER TABLE frete ADD CONSTRAINT ck_frete_valor CHECK (valor IS NOT NULL OR valor_a_combinar);

CREATE INDEX idx_frete_empresa ON frete (empresa_id);

-- Veículos e carrocerias que o frete aceita (vazio = qualquer um).
CREATE TABLE frete_tipo_veiculo (
    frete_id     UUID        NOT NULL REFERENCES frete (id) ON DELETE CASCADE,
    tipo_veiculo VARCHAR(20) NOT NULL,
    PRIMARY KEY (frete_id, tipo_veiculo)
);

CREATE TABLE frete_tipo_carroceria (
    frete_id        UUID        NOT NULL REFERENCES frete (id) ON DELETE CASCADE,
    tipo_carroceria VARCHAR(20) NOT NULL,
    PRIMARY KEY (frete_id, tipo_carroceria)
);

-- Trilha de auditoria: cada mudança de status, quem fez e quando. Nunca é apagada.
CREATE TABLE evento_frete (
    id              UUID PRIMARY KEY,
    frete_id        UUID        NOT NULL REFERENCES frete (id),
    status_anterior VARCHAR(20),
    status_novo     VARCHAR(20) NOT NULL,
    autor_id        UUID,
    autor_papel     VARCHAR(20),
    observacao      VARCHAR(500),
    ocorrido_em     TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_evento_frete_frete ON evento_frete (frete_id, ocorrido_em);
