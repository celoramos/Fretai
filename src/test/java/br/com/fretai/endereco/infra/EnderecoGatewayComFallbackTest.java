package br.com.fretai.endereco.infra;

import br.com.fretai.endereco.domain.CepNaoEncontradoException;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.ServicoCepIndisponivelException;
import br.com.fretai.support.Fixtures;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("CEP com provedor de reserva")
class EnderecoGatewayComFallbackTest {

    private final ProvedorCep principal = mock(ProvedorCep.class);
    private final ProvedorCep reserva = mock(ProvedorCep.class);
    private final EnderecoGatewayComFallback gateway = new EnderecoGatewayComFallback(List.of(principal, reserva));

    @Test
    @DisplayName("Principal respondeu → a reserva nem é consultada")
    void principalResponde() {
        when(principal.buscar("01001000")).thenReturn(Fixtures.enderecoSaoPaulo());

        Endereco endereco = gateway.buscarPorCep("01001-000");

        assertEquals("São Paulo", endereco.localidade());
        verifyNoInteractions(reserva);
    }

    @Test
    @DisplayName("Principal fora do ar → usa a reserva")
    void principalForaDoAr() {
        when(principal.buscar("01001000")).thenThrow(new ServicoCepIndisponivelException("fora", null));
        when(reserva.buscar("01001000")).thenReturn(Fixtures.enderecoSaoPaulo());

        assertEquals("São Paulo", gateway.buscarPorCep("01001000").localidade());
    }

    @Test
    @DisplayName("Todos fora do ar → serviço indisponível (503)")
    void todosForaDoAr() {
        when(principal.buscar(anyString())).thenThrow(new ServicoCepIndisponivelException("fora", null));
        when(reserva.buscar(anyString())).thenThrow(new ServicoCepIndisponivelException("fora", null));

        assertThrows(ServicoCepIndisponivelException.class, () -> gateway.buscarPorCep("01001000"));
    }

    @Test
    @DisplayName("CEP com formato inválido → nenhum provedor é consultado")
    void cepInvalido() {
        assertThrows(IllegalArgumentException.class, () -> gateway.buscarPorCep("123"));
        verifyNoInteractions(principal, reserva);
    }

    @Test
    @DisplayName("ViaCEP não conhece o CEP → a BrasilAPI é consultada e acha")
    void principalNaoAcha() {
        when(principal.buscar("01001000")).thenThrow(new CepNaoEncontradoException("não achei"));
        when(reserva.buscar("01001000")).thenReturn(Fixtures.enderecoSaoPaulo());

        assertEquals("São Paulo", gateway.buscarPorCep("01001000").localidade());
    }

    @Test
    @DisplayName("Nenhum provedor conhece o CEP → CEP não encontrado (422)")
    void ninguemAcha() {
        when(principal.buscar(anyString())).thenThrow(new CepNaoEncontradoException("não achei"));
        when(reserva.buscar(anyString())).thenThrow(new CepNaoEncontradoException("não achei"));

        assertThrows(CepNaoEncontradoException.class, () -> gateway.buscarPorCep("99999999"));
    }

    @Test
    @DisplayName("Um não achou e o outro estava fora do ar → indisponível (503), não dá para afirmar que não existe")
    void naoAchouEOutroCaiu() {
        when(principal.buscar(anyString())).thenThrow(new CepNaoEncontradoException("não achei"));
        when(reserva.buscar(anyString())).thenThrow(new ServicoCepIndisponivelException("fora", null));

        assertThrows(ServicoCepIndisponivelException.class, () -> gateway.buscarPorCep("99999999"));
    }
}
