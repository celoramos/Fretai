-- O pedido de pessoa física diz o tamanho do veículo e o que vai levar. Frete de empresa não usa
-- os dois (tem tipo de caminhão e carga ANTT), por isso ficam nulos.
ALTER TABLE frete ADD COLUMN categoria_veiculo VARCHAR(20);
ALTER TABLE frete ADD COLUMN tipo_carga VARCHAR(20);

-- Carro de passeio e moto não fazem frete. O site nunca foi ao ar: só dados de teste caem aqui.
UPDATE motorista SET tipo_veiculo = 'UTILITARIO' WHERE tipo_veiculo IN ('MOTO', 'CARRO');
