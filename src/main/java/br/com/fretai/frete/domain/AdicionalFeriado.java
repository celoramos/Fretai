package br.com.fretai.frete.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Quanto um feriado acrescenta ao valor que o cliente ofereceu. */
final class AdicionalFeriado {

    private static final BigDecimal CEM = BigDecimal.valueOf(100);

    private AdicionalFeriado() {
    }

    /**
     * Ex.: valor 1500.00 e percentual 20 → 300.00.
     *
     * @param valor      o que o cliente ofereceu, em reais
     * @param percentual 20 significa 20%
     * @return o adicional em reais, com 2 casas decimais
     */
    static BigDecimal calcular(BigDecimal valor, BigDecimal percentual) {
        // Multiplica antes de dividir: assim a única divisão é por 100 e o arredondamento acontece uma vez só.
        return valor.multiply(percentual).divide(CEM, 2, RoundingMode.HALF_UP);
    }
}
