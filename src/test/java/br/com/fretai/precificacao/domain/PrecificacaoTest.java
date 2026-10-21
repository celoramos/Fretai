package br.com.fretai.precificacao.domain;

import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Os números aqui são inventados para o teste; não têm relação com a tabela da ANTT. */
@DisplayName("Piso, custo da viagem e alertas de preço")
class PrecificacaoTest {

    private final CoeficientePiso coeficiente = new CoeficientePiso(TipoCargaAntt.CARGA_GERAL, 5,
            new BigDecimal("4.0000"), new BigDecimal("300.00"), "Tabela de teste");
    private final BigDecimal dobro = new BigDecimal("2.0");

    @Test
    @DisplayName("Piso = km × CCD + CC")
    void piso() {
        PisoMinimo piso = PisoMinimo.de(coeficiente, new BigDecimal("500"));

        assertEquals(new BigDecimal("2300.00"), piso.valor());
        assertFalse(piso.coeficientesDeExemplo());
        assertTrue(new CoeficientePiso(TipoCargaAntt.CARGA_GERAL, 5, BigDecimal.ONE, BigDecimal.ONE,
                CoeficientePiso.FONTE_EXEMPLO).isExemplo());
    }

    @Test
    @DisplayName("Custo: 500 km a 2,5 km/l e R$ 6,00/l = 200 l = R$ 1.200 + pedágio + outros")
    void custo() {
        CustoViagem custo = CustoViagem.calcular(new BigDecimal("500"), new BigDecimal("2.5"), new BigDecimal("6.00"),
                new BigDecimal("150.00"), new BigDecimal("50.00"));

        assertEquals(new BigDecimal("200.00"), custo.litros());
        assertEquals(new BigDecimal("1200.00"), custo.combustivel());
        assertEquals(new BigDecimal("1400.00"), custo.total());
        assertThrows(IllegalArgumentException.class, () -> CustoViagem.calcular(BigDecimal.TEN, BigDecimal.ZERO,
                BigDecimal.ONE, null, null));
    }

    @Test
    @DisplayName("Abaixo do piso alerta; no piso, não")
    void abaixoDoPiso() {
        PisoMinimo piso = PisoMinimo.de(coeficiente, new BigDecimal("500"));
        BigDecimal km = new BigDecimal("500");

        assertTrue(AvaliacaoPreco.avaliar(new BigDecimal("2299.99"), km, piso, null, dobro).abaixoDoPiso());
        assertFalse(AvaliacaoPreco.avaliar(new BigDecimal("2300.00"), km, piso, null, dobro).abaixoDoPiso());
    }

    @Test
    @DisplayName("Fretão: R$/km acima do dobro da média alerta; sem média, não alerta")
    void acimaDaMedia() {
        BigDecimal km = new BigDecimal("500");
        // Média de R$ 5/km: dobro = R$ 10/km = R$ 5.000 para 500 km.
        assertTrue(AvaliacaoPreco.avaliar(new BigDecimal("5005.00"), km, null, 5.0, dobro).acimaDaMedia());
        assertFalse(AvaliacaoPreco.avaliar(new BigDecimal("5000.00"), km, null, 5.0, dobro).acimaDaMedia());
        assertFalse(AvaliacaoPreco.avaliar(new BigDecimal("99999"), km, null, null, dobro).acimaDaMedia());
    }

    @Test
    @DisplayName("Valor a combinar não gera alerta nenhum")
    void aCombinar() {
        AvaliacaoPreco a = AvaliacaoPreco.avaliar(null, new BigDecimal("500"),
                PisoMinimo.de(coeficiente, new BigDecimal("500")), 5.0, dobro);

        assertFalse(a.abaixoDoPiso());
        assertFalse(a.acimaDaMedia());
        assertNotNull(a.piso(), "o piso aparece mesmo assim, para orientar a negociação");
    }
}
