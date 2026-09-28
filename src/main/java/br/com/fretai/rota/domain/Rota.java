package br.com.fretai.rota.domain;

import br.com.fretai.endereco.domain.Coordenadas;
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Distância entre coleta e entrega.
 *
 * @param estimada {@code true} quando veio da linha reta corrigida, e não de um
 *                 roteador de verdade. O preço calculado a partir dela deve ser
 *                 tratado como aproximado.
 */
public record Rota(BigDecimal distanciaKm, boolean estimada) {

    /**
     * Estrada nunca é reta. Em rotas brasileiras o trajeto real costuma ficar
     * entre 20% e 40% acima da linha reta; 1,3 é o meio desse intervalo.
     */
    static final double FATOR_SINUOSIDADE = 1.3;

    public Rota {
        if (distanciaKm == null || distanciaKm.signum() < 0) {
            throw new IllegalArgumentException("Distância inválida: " + distanciaKm);
        }
        distanciaKm = distanciaKm.setScale(1, RoundingMode.HALF_UP);
    }

    public static Rota porEstrada(double metros) {
        return new Rota(BigDecimal.valueOf(metros / 1000), false);
    }

    public static Rota estimadaPorLinhaReta(Coordenadas origem, Coordenadas destino) {
        double km = origem.distanciaLinhaRetaKm(destino) * FATOR_SINUOSIDADE;
        return new Rota(BigDecimal.valueOf(km), true);
    }
}
