package br.com.fretai.precificacao.application.dto;

import br.com.fretai.precificacao.domain.CustoViagem;
import br.com.fretai.precificacao.domain.PisoMinimo;
import java.math.BigDecimal;

/**
 * @param margem      valor oferecido menos o custo da viagem (nulo sem valor oferecido)
 * @param piso        nulo sem tipo de carga e eixos, ou sem coeficiente cadastrado
 */
public record CalculoFreteResponse(CustoViagem custo, PisoMinimo piso, BigDecimal valorOferecido, BigDecimal margem,
                                   boolean abaixoDoPiso) {
}
