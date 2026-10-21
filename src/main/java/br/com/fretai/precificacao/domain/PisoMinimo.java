package br.com.fretai.precificacao.domain;

import java.math.BigDecimal;

/**
 * Piso calculado para uma viagem.
 *
 * @param numeroEixos       eixos usados no cálculo (do caminhão escolhido, ou o menor entre os aceitos)
 * @param coeficientesDeExemplo true enquanto a tabela da ANTT não foi preenchida: o valor não vale nada
 */
public record PisoMinimo(BigDecimal valor, TipoCargaAntt tipoCarga, int numeroEixos, BigDecimal distanciaKm,
                         BigDecimal ccd, BigDecimal cc, String fonte, boolean coeficientesDeExemplo) {

    public static PisoMinimo de(CoeficientePiso coeficiente, BigDecimal distanciaKm) {
        return new PisoMinimo(coeficiente.pisoPara(distanciaKm), coeficiente.getTipoCarga(),
                coeficiente.getNumeroEixos(), distanciaKm, coeficiente.getCcd(), coeficiente.getCc(),
                coeficiente.getFonte(), coeficiente.isExemplo());
    }
}
