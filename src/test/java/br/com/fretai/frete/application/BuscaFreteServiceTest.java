package br.com.fretai.frete.application;

import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.frete.application.dto.BuscaFreteRequest;
import br.com.fretai.frete.application.dto.FreteEncontradoResponse;
import br.com.fretai.frete.domain.BuscaFretes;
import br.com.fretai.frete.domain.FiltroBusca;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.FreteRepository;
import br.com.fretai.support.Fixtures;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Serviço de busca por raio")
class BuscaFreteServiceTest {

    @Mock private BuscaFretes buscaFretes;
    @Mock private FreteRepository freteRepository;
    @Mock private PreparacaoFrete preparacao;
    private BuscaFreteService service;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        service = new BuscaFreteService(buscaFretes, freteRepository, preparacao, 150);
    }

    private static BuscaFreteRequest pedidoPorCep() {
        return new BuscaFreteRequest(null, null, "13010-000", null, null, null, null, null,
                null, null, null, null, null, null);
    }

    @Test
    @DisplayName("Origem por CEP é localizada; raio padrão 100 km; resposta na ordem da distância")
    void ordemDaBusca() {
        Frete perto = comId(Fixtures.fretePublicado(Fixtures.embarcador()));
        Frete longe = comId(Fixtures.fretePublicado(Fixtures.embarcador()));
        when(preparacao.localizarCep("13010-000")).thenReturn(new Coordenadas(-22.9, -47.06));
        when(buscaFretes.buscar(any(), any())).thenReturn(new PageImpl<>(List.of(
                new BuscaFretes.Encontrado(perto.getId(), 3.14159),
                new BuscaFretes.Encontrado(longe.getId(), 87.0))));
        // O banco devolve fora de ordem de propósito.
        when(freteRepository.findAllById(anyList())).thenReturn(List.of(longe, perto));

        Page<FreteEncontradoResponse> pagina = service.buscar(pedidoPorCep(), PageRequest.of(0, 20));

        assertEquals(List.of(perto.getId(), longe.getId()),
                pagina.getContent().stream().map(r -> r.frete().id()).toList());
        assertEquals(3.1, pagina.getContent().get(0).distanciaOrigemKm());

        ArgumentCaptor<FiltroBusca> filtro = ArgumentCaptor.forClass(FiltroBusca.class);
        verify(buscaFretes).buscar(filtro.capture(), any());
        assertEquals(100, filtro.getValue().raioKm());
        assertNull(filtro.getValue().destino());
    }

    private static Frete comId(Frete frete) {
        ReflectionTestUtils.setField(frete, "id", UUID.randomUUID());
        return frete;
    }
}
