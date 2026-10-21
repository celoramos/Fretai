-- Piso mínimo do frete (Lei 13.703/2018): piso = distância (km) × CCD + CC
--   CCD = coeficiente de custo de deslocamento, em R$/km
--   CC  = coeficiente de custo de carga e descarga, em R$
-- Os coeficientes oficiais variam por tipo de carga e número de eixos e são
-- atualizados pela ANTT. Eles ficam nesta tabela, editável por administrador
-- (PUT /api/piso-antt/{tipoCarga}/{eixos}), e NÃO no código.

CREATE TABLE coeficiente_piso_antt (
    tipo_carga    VARCHAR(40)    NOT NULL,
    numero_eixos  INTEGER        NOT NULL,
    ccd           NUMERIC(10, 4) NOT NULL CHECK (ccd >= 0),
    cc            NUMERIC(10, 2) NOT NULL CHECK (cc >= 0),
    -- 'EXEMPLO' enquanto não for preenchido com a tabela vigente. Depois, a norma de origem
    -- (ex.: 'Resolução ANTT nº ...'), que aparece junto do piso na API.
    fonte         VARCHAR(200)   NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (tipo_carga, numero_eixos)
);

-- ATENÇÃO: VALORES DE EXEMPLO, NÃO SÃO OS DA ANTT.
-- Servem só para o sistema funcionar em desenvolvimento. Substitua pela tabela
-- vigente publicada pela ANTT antes de qualquer uso real. Enquanto a fonte for
-- 'EXEMPLO', a API marca o piso como "coeficientesDeExemplo": true.
INSERT INTO coeficiente_piso_antt (tipo_carga, numero_eixos, ccd, cc, fonte, atualizado_em)
SELECT t.tipo, e.eixos, 1.0000 + e.eixos * 0.5000, 100.00 + e.eixos * 50.00, 'EXEMPLO', CURRENT_TIMESTAMP
FROM (VALUES ('GRANEL_SOLIDO'), ('GRANEL_LIQUIDO'), ('FRIGORIFICADA'), ('CONTEINERIZADA'), ('CARGA_GERAL'),
             ('NEOGRANEL'), ('PERIGOSA_GRANEL_SOLIDO'), ('PERIGOSA_GRANEL_LIQUIDO'), ('PERIGOSA_FRIGORIFICADA'),
             ('PERIGOSA_CONTEINERIZADA'), ('PERIGOSA_CARGA_GERAL'), ('GRANEL_PRESSURIZADA')) AS t (tipo)
CROSS JOIN (VALUES (2), (3), (4), (5), (6), (7), (9)) AS e (eixos);

-- Piso e alertas de preço calculados na publicação (e recalculados no aceite,
-- com os eixos do caminhão escolhido). Ficam gravados como foto do momento.
ALTER TABLE frete ADD COLUMN piso_minimo        NUMERIC(12, 2);
ALTER TABLE frete ADD COLUMN piso_eixos         INTEGER;
ALTER TABLE frete ADD COLUMN piso_exemplo       BOOLEAN;
ALTER TABLE frete ADD COLUMN alerta_abaixo_piso BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE frete ADD COLUMN alerta_acima_media BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE frete ADD COLUMN media_rota_por_km  NUMERIC(10, 2);
