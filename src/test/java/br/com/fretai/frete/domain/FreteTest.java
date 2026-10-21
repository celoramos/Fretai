package br.com.fretai.frete.domain;

import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.support.Fixtures;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.TipoVeiculo;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Máquina de estados do Frete")
class FreteTest {

    private Frete frete;
    private Motorista motorista;

    @BeforeEach
    void setUp() {
        frete = Fixtures.fretePendente();
        motorista = Fixtures.motorista(TipoVeiculo.UTILITARIO);
    }

    @Test
    @DisplayName("Nasce PENDENTE, sem motorista")
    void nascePendente() {
        assertEquals(StatusFrete.PENDENTE, frete.getStatus());
        assertNull(frete.getMotorista());
        assertNotNull(frete.getCriadoEm());
    }

    @Test
    @DisplayName("Percorre o fluxo feliz PENDENTE → ACEITO → EM_TRANSITO → ENTREGUE")
    void fluxoCompleto() {
        frete.aceitar(motorista);
        assertEquals(StatusFrete.ACEITO, frete.getStatus());
        assertSame(motorista, frete.getMotorista());
        assertNotNull(frete.getAceitoEm());

        frete.iniciarTransporte();
        assertEquals(StatusFrete.EM_TRANSITO, frete.getStatus());

        frete.concluir();
        assertEquals(StatusFrete.ENTREGUE, frete.getStatus());
        assertNotNull(frete.getConcluidoEm());
    }

    @Nested
    @DisplayName("Transições inválidas")
    class TransicoesInvalidas {

        @Test
        void naoIniciaTransporteSemMotorista() {
            assertThrows(IllegalStateException.class, frete::iniciarTransporte);
        }

        @Test
        void naoConcluiSemEstarEmTransito() {
            frete.aceitar(motorista);
            assertThrows(IllegalStateException.class, frete::concluir);
        }

        @Test
        void naoAceitaDuasVezes() {
            frete.aceitar(motorista);
            assertThrows(IllegalStateException.class, () -> frete.aceitar(motorista));
        }

        @Test
        void naoAceitaMotoristaNulo() {
            assertThrows(NullPointerException.class, () -> frete.aceitar(null));
        }

        @Test
        void naoCancelaFreteEntregue() {
            frete.aceitar(motorista);
            frete.iniciarTransporte();
            frete.concluir();
            assertThrows(IllegalStateException.class, () -> frete.cancelar("tarde demais"));
        }

        @Test
        void naoCancelaDuasVezes() {
            frete.cancelar("Cliente desistiu");
            assertThrows(IllegalStateException.class, () -> frete.cancelar("Outro motivo"));
        }
    }

    @Nested
    @DisplayName("Feriado e domingo")
    class FeriadoEDomingo {

        private final LocalDate finados = LocalDate.of(2026, 11, 2);
        private final BigDecimal vintePorCento = new BigDecimal("20");

        @Test
        @DisplayName("Dia comum: sem adicional, total = valor oferecido")
        void diaComum() {
            assertFalse(frete.isFeriado());
            assertFalse(frete.isDomingo());
            assertEquals(0, BigDecimal.ZERO.compareTo(frete.getAdicionalFeriado()));
            assertEquals(new BigDecimal("180.00"), frete.getValorTotal());
        }

        @Test
        @DisplayName("Domingo é marcado, mas não gera adicional")
        void domingoSemAdicional() {
            Frete noDomingo = Fixtures.fretePendente(LocalDate.of(2026, 11, 8), new BigDecimal("180.00"));
            assertTrue(noDomingo.isDomingo());
            assertEquals(new BigDecimal("180.00"), noDomingo.getValorTotal());
        }

        @Test
        @DisplayName("Feriado soma 20%: R$ 1.500,00 → R$ 300,00 de adicional, R$ 1.800,00 no total")
        void feriadoSomaAdicional() {
            Frete noFeriado = Fixtures.fretePendente(finados, new BigDecimal("1500.00"));
            noFeriado.registrarFeriado("Finados", vintePorCento);

            assertTrue(noFeriado.isFeriado());
            assertEquals("Finados", noFeriado.getNomeFeriado());
            assertEquals(new BigDecimal("300.00"), noFeriado.getAdicionalFeriado());
            assertEquals(new BigDecimal("1800.00"), noFeriado.getValorTotal());
        }

        @Test
        @DisplayName("Adicional é arredondado para o centavo mais próximo")
        void arredondaCentavos() {
            Frete noFeriado = Fixtures.fretePendente(finados, new BigDecimal("99.99"));
            noFeriado.registrarFeriado("Finados", vintePorCento);

            assertEquals(new BigDecimal("20.00"), noFeriado.getAdicionalFeriado());
            assertEquals(new BigDecimal("119.99"), noFeriado.getValorTotal());
        }

        @Test
        @DisplayName("Motorista que não aceita feriado não pode pegar frete de feriado")
        void motoristaQueNaoAceitaFeriado() {
            Frete noFeriado = Fixtures.fretePendente(finados, new BigDecimal("180.00"));
            noFeriado.registrarFeriado("Finados", vintePorCento);
            motorista.definirAceitaFeriado(false);

            RegraNegocioException erro = assertThrows(RegraNegocioException.class, () -> noFeriado.aceitar(motorista));
            assertTrue(erro.getMessage().contains("Finados"));
            assertEquals(StatusFrete.PENDENTE, noFeriado.getStatus());
        }

        @Test
        @DisplayName("Motorista que não aceita feriado continua pegando frete em dia comum")
        void motoristaQueNaoAceitaFeriadoEmDiaComum() {
            motorista.definirAceitaFeriado(false);
            frete.aceitar(motorista);
            assertEquals(StatusFrete.ACEITO, frete.getStatus());
        }

        @Test
        @DisplayName("Depois de aceito, o feriado (e o preço) não muda mais")
        void naoRegistraFeriadoDepoisDeAceito() {
            frete.aceitar(motorista);
            assertThrows(IllegalStateException.class, () -> frete.registrarFeriado("Finados", vintePorCento));
        }
    }

    @Test
    @DisplayName("Cancelamento guarda o motivo")
    void cancelamentoGuardaMotivo() {
        frete.cancelar("Cliente desistiu");
        assertEquals(StatusFrete.CANCELADO, frete.getStatus());
        assertEquals("Cliente desistiu", frete.getMotivoCancelamento());
        assertNotNull(frete.getConcluidoEm());
    }

    @Test
    @DisplayName("Endereço completo é formatado a partir do CEP consultado")
    void enderecoCompleto() {
        String coleta = frete.getPontoColeta().getEnderecoCompleto();
        assertEquals("Praça da Sé, nº 100 (Sala 3) - Sé, São Paulo/SP - CEP: 01001-000 [Ref: Próximo à Catedral]", coleta);
        assertTrue(frete.getPontoEntrega().getEnderecoCompleto().contains("Rio de Janeiro/RJ"));
    }
}
