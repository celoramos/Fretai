package br.com.fretai.frete.domain;

import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.shared.seguranca.Papel;
import br.com.fretai.support.Fixtures;
import br.com.fretai.usuario.domain.CategoriaVeiculo;
import br.com.fretai.usuario.domain.Motorista;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Proposta")
class PropostaTest {

    private final Motorista motorista = comId(Fixtures.motorista(CategoriaVeiculo.CAMINHAO));
    private final Frete frete = Fixtures.fretePublicado(Fixtures.embarcador(), null);
    private final Autor autor = new Autor(motorista.getId(), Papel.MOTORISTA);

    private Proposta proposta(String valor, String adiantamento) {
        return new Proposta(frete, motorista, Fixtures.carretaSider(motorista), autor, new BigDecimal(valor),
                new BigDecimal(adiantamento), Fixtures.DIA_COMUM.plusDays(2), null);
    }

    @Test
    @DisplayName("Adiantamento fora de 0–100% e valor zerado são recusados")
    void limites() {
        assertThrows(RegraNegocioException.class, () -> proposta("5000", "101"));
        assertThrows(RegraNegocioException.class, () -> proposta("5000", "-1"));
        assertThrows(RegraNegocioException.class, () -> proposta("0", "10"));
        assertDoesNotThrow(() -> proposta("5000", "100"));
    }

    @Test
    @DisplayName("Prazo de entrega antes da coleta é recusado")
    void prazo() {
        assertThrows(RegraNegocioException.class, () -> new Proposta(frete, motorista, null, autor,
                new BigDecimal("5000"), BigDecimal.ZERO, Fixtures.DIA_COMUM.minusDays(1), null));
    }

    @Test
    @DisplayName("Aceite copia as condições para o frete; proposta respondida não muda mais")
    void aceite() {
        Proposta p = proposta("7000.00", "40");
        frete.receberProposta(autor);

        frete.aceitarProposta(p, null, new Autor(UUID.randomUUID(), Papel.EMPRESA));

        assertEquals(StatusProposta.ACEITA, p.getStatus());
        assertEquals(StatusFrete.ACEITO, frete.getStatus());
        assertEquals(new BigDecimal("7000.00"), frete.getValorAcordado());
        assertEquals(new BigDecimal("40"), frete.getAdiantamentoPercentual());
        assertThrows(IllegalStateException.class, p::recusar);
    }

    @Test
    @DisplayName("Frete a combinar não aceita 'pelo valor anunciado'")
    void aCombinar() {
        assertThrows(RegraNegocioException.class,
                () -> frete.aceitarPeloValorAnunciado(motorista, Fixtures.carretaSider(motorista), autor));
        assertEquals(StatusFrete.PUBLICADO, frete.getStatus());
    }

    private static <T> T comId(T entidade) {
        ReflectionTestUtils.setField(entidade, "id", UUID.randomUUID());
        return entidade;
    }
}
