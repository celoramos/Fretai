-- Esqueci a senha: link de uso único que vence. Como no refresh token, só o hash SHA-256 fica aqui.
CREATE TABLE token_senha (
    id          UUID PRIMARY KEY,
    usuario_id  UUID        NOT NULL REFERENCES usuario (id),
    hash        VARCHAR(64) NOT NULL UNIQUE,
    expira_em   TIMESTAMP WITH TIME ZONE NOT NULL,
    usado_em    TIMESTAMP WITH TIME ZONE,
    criado_em   TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_token_senha_usuario ON token_senha (usuario_id);
