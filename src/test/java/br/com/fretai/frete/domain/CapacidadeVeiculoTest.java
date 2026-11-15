package br.com.fretai.frete.domain;

import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.shared.seguranca.Papel;
import br.com.fretai.support.Fixtures;
import br.com.fretai.usuario.domain.CategoriaVeiculo;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.veiculo.domain.Veiculo;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Peso que cada tamanho de veículo leva (frete de pessoa física)")
class CapacidadeVeiculoTest {

    private static final Autor AUTOR = new Autor(UUID.randomUUID(), Papel.MOTORISTA);

    @Test
    @DisplayName("Utilitário leva até 700 kg, van até 1,5 t, caminhão sem teto")
    void capacidadePorTamanho() {
        assertTrue(CategoriaVeiculo.UTILITARIO.suporta(new BigDecimal("700")));
        assertFalse(CategoriaVeiculo.UTILITARIO.suporta(new BigDecimal("700.01")));
        assertTrue(CategoriaVeiculo.VAN.suporta(new BigDecimal("1500")));
        assertFalse(CategoriaVeiculo.VAN.suporta(new BigDecimal("1500.01")));
        assertTrue(CategoriaVeiculo.CAMINHAO.suporta(new BigDecimal("30000")));
        assertTrue(CategoriaVeiculo.UTILITARIO.suporta(null), "sem peso informado, não há o que barrar");
    }

    @Test
    @DisplayName("Utilitário não aceita frete de 1 t, mesmo que o tamanho pedido seja utilitário")
    void utilitarioNaoAceitaCargaPesada() {
        Frete frete = freteDe("1000", CategoriaVeiculo.UTILITARIO);
        Motorista motorista = Fixtures.motorista(CategoriaVeiculo.UTILITARIO);

        RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                () -> frete.aceitarPeloValorAnunciado(motorista, null, AUTOR));
        assertEquals("Um utilitário leva até 700 kg, e esta carga tem 1.000 kg.", erro.getMessage());
        assertEquals(StatusFrete.PUBLICADO, frete.getStatus());
    }

    @Test
    @DisplayName("Vale a capacidade do veículo escolhido, não a do cadastro do motorista")
    void valeOVeiculoEscolhido() {
        Motorista motorista = Fixtures.motorista(CategoriaVeiculo.UTILITARIO);
        ReflectionTestUtils.setField(motorista, "id", UUID.randomUUID());
        Veiculo van = new Veiculo(motorista, "VAN1A23", CategoriaVeiculo.VAN, "Master", null, null, null, null, false);
        Frete frete = freteDe("1000", CategoriaVeiculo.UTILITARIO);

        frete.aceitarPeloValorAnunciado(motorista, van, AUTOR);

        assertEquals(StatusFrete.ACEITO, frete.getStatus());
    }

    @Test
    @DisplayName("A proposta também é barrada: o cliente não fecha com quem não leva o peso")
    void propostaBarrada() {
        Frete frete = freteDe("2000", CategoriaVeiculo.VAN);
        Motorista motorista = Fixtures.motorista(CategoriaVeiculo.VAN);

        RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                () -> frete.exigirVeiculoDoTamanho(motorista, null));
        assertEquals("Uma van ou furgão leva até 1.500 kg, e esta carga tem 2.000 kg.", erro.getMessage());
    }

    private static Frete freteDe(String pesoKg, CategoriaVeiculo pedida) {
        EnderecoFrete coleta = new EnderecoFrete(Fixtures.enderecoSaoPaulo(), "100", null, null);
        EnderecoFrete entrega = new EnderecoFrete(Fixtures.enderecoRioDeJaneiro(), "50", null, null);
        return new Frete(Fixtures.cliente(), coleta, entrega, "Ana Pereira", "21977776666",
                "Geladeira e fogão", new BigDecimal(pesoKg), new BigDecimal("400.00"), Fixtures.DIA_COMUM,
                pedida, TipoCarga.MUDANCA);
    }
}
