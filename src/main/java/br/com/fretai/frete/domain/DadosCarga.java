package br.com.fretai.frete.domain;

import java.math.BigDecimal;

/**
 * O que vai ser transportado num frete de empresa.
 *
 * @param descricao     texto livre para o motorista (ex.: "paletes de cerâmica, 22 un.")
 * @param especie       espécie da carga como aparece no CT-e (ex.: "cerâmica", "soja")
 * @param tipoCargaAntt define quais coeficientes da ANTT valem para o piso mínimo
 */
public record DadosCarga(String descricao, String especie, TipoCargaAntt tipoCargaAntt, BigDecimal pesoKg) {
}
