-- Schema inicial do Fretai.
-- Toda mudança de banco daqui em diante é um novo arquivo V2__..., V3__... (nunca editar este).

CREATE TABLE usuario (
    id          UUID PRIMARY KEY,
    cpf         VARCHAR(11)  NOT NULL UNIQUE,
    nome        VARCHAR(100) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    senha_hash  VARCHAR(100) NOT NULL,
    telefone    VARCHAR(20)  NOT NULL,
    criado_em   TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE cliente (
    id UUID PRIMARY KEY REFERENCES usuario (id)
);

CREATE TABLE motorista (
    id            UUID PRIMARY KEY REFERENCES usuario (id),
    tipo_veiculo  VARCHAR(20) NOT NULL,
    placa         VARCHAR(7)  NOT NULL UNIQUE
);

CREATE TABLE frete (
    id                        UUID PRIMARY KEY,
    versao                    BIGINT NOT NULL,
    cliente_id                UUID NOT NULL REFERENCES cliente (id),
    motorista_id              UUID REFERENCES motorista (id),

    ponto_coleta_cep              VARCHAR(8) NOT NULL,
    ponto_coleta_logradouro       VARCHAR(255),
    ponto_coleta_numero           VARCHAR(20),
    ponto_coleta_complemento      VARCHAR(255),
    ponto_coleta_bairro           VARCHAR(255),
    ponto_coleta_cidade           VARCHAR(255),
    ponto_coleta_uf               VARCHAR(2),
    ponto_coleta_ponto_referencia VARCHAR(255),

    ponto_entrega_cep              VARCHAR(8) NOT NULL,
    ponto_entrega_logradouro       VARCHAR(255),
    ponto_entrega_numero           VARCHAR(20),
    ponto_entrega_complemento      VARCHAR(255),
    ponto_entrega_bairro           VARCHAR(255),
    ponto_entrega_cidade           VARCHAR(255),
    ponto_entrega_uf               VARCHAR(2),
    ponto_entrega_ponto_referencia VARCHAR(255),

    nome_destinatario      VARCHAR(100)   NOT NULL,
    telefone_destinatario  VARCHAR(20)    NOT NULL,
    descricao_carga        VARCHAR(500)   NOT NULL,
    peso_kg                NUMERIC(10, 2) NOT NULL,
    valor                  NUMERIC(12, 2) NOT NULL,
    status                 VARCHAR(20)    NOT NULL,
    motivo_cancelamento    VARCHAR(500),
    criado_em              TIMESTAMP WITH TIME ZONE NOT NULL,
    aceito_em              TIMESTAMP WITH TIME ZONE,
    concluido_em           TIMESTAMP WITH TIME ZONE
);

-- Consultas mais comuns: "fretes pendentes" (motoristas) e "meus fretes" (cliente/motorista).
CREATE INDEX idx_frete_status_criado_em ON frete (status, criado_em);
CREATE INDEX idx_frete_cliente ON frete (cliente_id);
CREATE INDEX idx_frete_motorista ON frete (motorista_id);
