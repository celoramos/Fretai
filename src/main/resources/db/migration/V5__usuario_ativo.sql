-- Excluir pela API só desativa: o usuário some das listagens e não faz login,
-- mas os fretes, propostas e avaliações dele continuam no histórico.
ALTER TABLE usuario ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE;
