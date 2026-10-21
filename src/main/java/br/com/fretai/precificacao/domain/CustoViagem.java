package br.com.fretai.precificacao.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * Quanto a viagem custa para o caminhoneiro: diesel + pedágio + outros custos.
 * Não inclui manutenção, pneus, seguro e o salário dele: por isso o piso da ANTT
 * existe e costuma ser maior que este número.
 */
public record CustoViagem(BigDecimal distanciaKm, BigDecimal litros, BigDecimal combustivel, BigDecimal pedagio,
                          BigDecimal outros, BigDecimal total) {

    /**
     * @param consumoKmPorLitro ex.: 2.5 para uma carreta carregada
     * @param precoDieselLitro  ex.: 6.20
     */
    public static CustoViagem calcular(BigDecimal distanciaKm, BigDecimal consumoKmPorLitro,
                                       BigDecimal precoDieselLitro, BigDecimal pedagio, BigDecimal outros) {
        Objects.requireNonNull(distanciaKm, "Distância é obrigatória.");
        if (consumoKmPorLitro == null || consumoKmPorLitro.signum() <= 0) {
            throw new IllegalArgumentException("O consumo (km/l) deve ser maior que zero.");
        }
        BigDecimal pedagioOuZero = pedagio == null ? BigDecimal.ZERO : pedagio;
        BigDecimal outrosOuZero = outros == null ? BigDecimal.ZERO : outros;
        BigDecimal litros = distanciaKm.divide(consumoKmPorLitro, 2, RoundingMode.HALF_UP);
        BigDecimal combustivel = litros.multiply(precoDieselLitro).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = combustivel.add(pedagioOuZero).add(outrosOuZero).setScale(2, RoundingMode.HALF_UP);
        return new CustoViagem(distanciaKm, litros, combustivel, pedagioOuZero, outrosOuZero, total);
    }
}
