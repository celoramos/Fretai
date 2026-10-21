package br.com.fretai.precificacao.application.dto;

import br.com.fretai.precificacao.domain.CoeficientePiso;
import br.com.fretai.precificacao.domain.TipoCargaAntt;
import java.math.BigDecimal;
import java.time.Instant;

public record CoeficienteResponse(TipoCargaAntt tipoCarga, int numeroEixos, BigDecimal ccd, BigDecimal cc,
                                  String fonte, boolean exemplo, Instant atualizadoEm) {

    public static CoeficienteResponse de(CoeficientePiso c) {
        return new CoeficienteResponse(c.getTipoCarga(), c.getNumeroEixos(), c.getCcd(), c.getCc(), c.getFonte(),
                c.isExemplo(), c.getAtualizadoEm());
    }
}
