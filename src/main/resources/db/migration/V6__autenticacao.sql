-- Login: administradores e refresh tokens.

CREATE TABLE administrador (
    id UUID PRIMARY KEY REFERENCES usuario (id)
);

-- Guardamos só o hash SHA-256 do refresh token: quem ler o banco não consegue
-- se passar por ninguém. Cada uso gera um token novo e revoga o anterior.
CREATE TABLE refresh_token (
    id          UUID PRIMARY KEY,
    usuario_id  UUID        NOT NULL REFERENCES usuario (id),
    hash        VARCHAR(64) NOT NULL UNIQUE,
    expira_em   TIMESTAMP WITH TIME ZONE NOT NULL,
    revogado    BOOLEAN     NOT NULL DEFAULT FALSE,
    criado_em   TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_refresh_token_usuario ON refresh_token (usuario_id);
