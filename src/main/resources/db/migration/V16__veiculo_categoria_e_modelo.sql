-- O veículo de quem faz frete de pessoa física é utilitário, van ou caminhão, com modelo e placa.
-- Os dados de caminhão (RNTRC, tipo, carroceria, eixos) passam a ser opcionais: só o frete de empresa
-- exige. Os veículos que já existem são todos caminhões completos.
ALTER TABLE veiculo ADD COLUMN categoria VARCHAR(20) NOT NULL DEFAULT 'CAMINHAO';
ALTER TABLE veiculo ADD COLUMN modelo VARCHAR(60);
ALTER TABLE veiculo ALTER COLUMN rntrc DROP NOT NULL;
ALTER TABLE veiculo ALTER COLUMN tipo DROP NOT NULL;
ALTER TABLE veiculo ALTER COLUMN carroceria DROP NOT NULL;
ALTER TABLE veiculo ALTER COLUMN numero_eixos DROP NOT NULL;
