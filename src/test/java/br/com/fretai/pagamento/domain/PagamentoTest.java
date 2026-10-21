package br.com.fretai.pagamento.domain;

import br.com.fretai.frete.domain.Autor;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.shared.seguranca.Papel;
import br.com.fretai.support.Fixtures;
import br.com.fretai.usuario.domain.CategoriaVeiculo;
import br.com.fretai.usuario.domain.Motorista;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Pagamento com garantia")
class PagamentoTest {

    private Pagamento pagamento;

    @BeforeEach
    void setUp() {
        Motorista motorista = Fixtures.motorista(CategoriaVeiculo.CAMINHAO);
        ReflectionTestUtils.setField(motorista, "id", UUID.randomUUID());
        Frete frete = Fixtures.fretePendente();
        frete.aceitarPeloValorAnunciado(motorista, null, new Autor(motorista.getId(), Papel.MOTORISTA));
        pagamento = new Pagamento(frete, new BigDecimal("10000.00"), new BigDecimal("40"),
                Instant.now().plus(Duration.ofDays(2)), "fake",
                new GatewayPagamento.CobrancaPix("cob-1", "copia", "qr"));
    }

    @Test
    @DisplayName("Divide valor em adiantamento e saldo pelo percentual combinado")
    void divisao() {
        assertEquals(new BigDecimal("4000.00"), pagamento.getValorAdiantamento());
        assertEquals(new BigDecimal("6000.00"), pagamento.getValorSaldo());
        assertEquals(StatusPagamento.PENDENTE, pagamento.getStatus());
    }

    @Test
    @DisplayName("PENDENTE → RETIDO → ADIANTAMENTO_LIBERADO → LIBERADO, só depois da janela")
    void fluxo() {
        pagamento.confirmarRecebimento(Instant.now());
        assertTrue(pagamento.pagoEmDia());
        pagamento.registrarAdiantamento("trf-1");

        assertFalse(pagamento.saldoPodeSair(Instant.now()), "sem canhoto, nada de saldo");
        pagamento.agendarLiberacaoSaldo(Instant.now().plus(Duration.ofHours(24)));
        assertFalse(pagamento.saldoPodeSair(Instant.now()), "janela de contestação aberta");
        assertTrue(pagamento.saldoPodeSair(Instant.now().plus(Duration.ofHours(25))));

        pagamento.agendarLiberacaoSaldo(Instant.now().minusSeconds(1));
        pagamento.registrarSaldo("trf-2");
        assertEquals(StatusPagamento.LIBERADO, pagamento.getStatus());
    }

    @Test
    @DisplayName("Saldo bloqueado por contestação não sai, nem com a janela vencida")
    void contestacao() {
        pagamento.confirmarRecebimento(Instant.now());
        pagamento.registrarAdiantamento(null);
        pagamento.agendarLiberacaoSaldo(Instant.now().minusSeconds(1));
        pagamento.bloquearSaldo();

        assertFalse(pagamento.saldoPodeSair(Instant.now()));
        assertThrows(IllegalStateException.class, () -> pagamento.registrarSaldo("x"));
    }

    @Test
    @DisplayName("Estorno só antes de o dinheiro começar a sair")
    void estorno() {
        pagamento.confirmarRecebimento(Instant.now());
        pagamento.registrarAdiantamento("trf-1");

        assertThrows(IllegalStateException.class, pagamento::estornar);
    }

    @Test
    @DisplayName("Pago depois do vencimento não conta como em dia")
    void atrasado() {
        pagamento.confirmarRecebimento(Instant.now().plus(Duration.ofDays(3)));
        assertFalse(pagamento.pagoEmDia());
    }
}
