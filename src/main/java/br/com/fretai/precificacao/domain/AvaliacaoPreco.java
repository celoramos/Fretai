package br.com.fretai.precificacao.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * O valor oferecido faz sentido? Dois alertas, um para cada lado:
 * <ul>
 *   <li><b>abaixo do piso</b>: ilegal (Lei 13.703/2018) e prejudica o motorista;</li>
 *   <li><b>muito acima da média</b> das rotas parecidas: típico do golpe do "fretão",
 *       em que o falso embarcador atrai o motorista com um valor alto demais.</li>
 * </ul>
 *
 * @param piso      nulo quando não dá para calcular (sem distância, sem tipo de carga ANTT ou sem coeficiente)
 * @param mediaPorKm nula quando não há fretes parecidos suficientes para comparar
 */
public record AvaliacaoPreco(PisoMinimo piso, boolean abaixoDoPiso, BigDecimal mediaPorKm, boolean acimaDaMedia) {

    public static final AvaliacaoPreco SEM_DADOS = new AvaliacaoPreco(null, false, null, false);

    /**
     * @param valor         o que está sendo oferecido (nulo = "a combinar": nada a alertar)
     * @param fatorSuspeita 2.0 = alerta quando o R$/km passa do dobro da média
     */
    public static AvaliacaoPreco avaliar(BigDecimal valor, BigDecimal distanciaKm, PisoMinimo piso,
                                         Double mediaPorKm, BigDecimal fatorSuspeita) {
        boolean abaixo = valor != null && piso != null && valor.compareTo(piso.valor()) < 0;
        BigDecimal media = mediaPorKm == null ? null : BigDecimal.valueOf(mediaPorKm).setScale(2, RoundingMode.HALF_UP);
        boolean acima = false;
        if (valor != null && media != null && distanciaKm != null && distanciaKm.signum() > 0) {
            BigDecimal porKm = valor.divide(distanciaKm, 4, RoundingMode.HALF_UP);
            acima = porKm.compareTo(media.multiply(fatorSuspeita)) > 0;
        }
        return new AvaliacaoPreco(piso, abaixo, media, acima);
    }
}
