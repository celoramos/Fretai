package br.com.fretai.frete.domain;

import br.com.fretai.support.Fixtures;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.TipoVeiculo;
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
