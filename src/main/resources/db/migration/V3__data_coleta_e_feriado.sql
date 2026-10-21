-- Frete agendado: dia da coleta, se cai em feriado/domingo e o adicional de feriado.
-- Fretes antigos assumem a coleta no dia em que foram criados e nenhum adicional.

ALTER TABLE frete ADD COLUMN data_coleta DATE;
UPDATE frete SET data_coleta = CAST(criado_em AS DATE);
ALTER TABLE frete ALTER COLUMN data_coleta SET NOT NULL;

ALTER TABLE frete ADD COLUMN feriado      BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE frete ADD COLUMN nome_feriado VARCHAR(100);
ALTER TABLE frete ADD COLUMN domingo      BOOLEAN NOT NULL DEFAULT FALSE;

-- valor = o que o cliente ofereceu; valor_total = valor + adicional_feriado.
ALTER TABLE frete ADD COLUMN adicional_feriado NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE frete ADD COLUMN valor_total       NUMERIC(12, 2);
UPDATE frete SET valor_total = valor;
ALTER TABLE frete ALTER COLUMN valor_total SET NOT NULL;

-- Trabalhar em feriado é escolha do motorista; quem já está cadastrado continua aceitando.
ALTER TABLE motorista ADD COLUMN aceita_feriado BOOLEAN NOT NULL DEFAULT TRUE;
