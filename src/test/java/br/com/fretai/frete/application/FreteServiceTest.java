package br.com.fretai.frete.application;

import br.com.fretai.endereco.domain.CepNaoEncontradoException;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.EnderecoGateway;
import br.com.fretai.frete.application.dto.EnderecoRequest;
import br.com.fretai.frete.application.dto.FreteResponse;
import br.com.fretai.frete.application.dto.SolicitarFreteRequest;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.FreteRepository;
import br.com.fretai.frete.domain.StatusFrete;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.support.Fixtures;
import br.com.fretai.usuario.domain.Cliente;
import br.com.fretai.usuario.domain.ClienteRepository;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.MotoristaRepository;
import br.com.fretai.usuario.domain.TipoVeiculo;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Serviço de Frete (orquestração)")
class FreteServiceTest {

    @Mock private FreteRepository freteRepository;
    @Mock private ClienteRepository clienteRepository;
    @Mock private MotoristaRepository motoristaRepository;
    @Mock private EnderecoGateway enderecoGateway;

    @InjectMocks
    private FreteService freteService;

    private final UUID clienteId = UUID.randomUUID();
    private Cliente cliente;

    @BeforeEach
    void setUp() {
        cliente = new Cliente("52998224725", "Carlos Silva", "carlos@email.com", "hash", "11999998888");
    }

    private SolicitarFreteRequest pedido(String cepOrigem, String cepDestino) {
        return new SolicitarFreteRequest(clienteId,
                new EnderecoRequest(cepOrigem, "100", "Sala 3", "Próximo à Catedral"),
                new EnderecoRequest(cepDestino, "50", null, null),
                "Ana Pereira", "21977776666", "Caixa de peças", new BigDecimal("12"), new BigDecimal("180.00"));
    }

    @Test
    @DisplayName("Solicita frete consultando os dois CEPs e salva como PENDENTE")
    void solicitaFrete() {
        when(clienteRepository.findById(clienteId)).thenReturn(Optional.of(cliente));
        when(enderecoGateway.buscarPorCep("01001000"))
                .thenReturn(new Endereco("01001-000", "Praça da Sé", "Sé", "São Paulo", "SP"));
        when(enderecoGateway.buscarPorCep("20040002"))
                .thenReturn(new Endereco("20040-002", "Rua da Assembleia", "Centro", "Rio de Janeiro", "RJ"));
        when(freteRepository.save(any(Frete.class))).thenAnswer(i -> i.getArgument(0));

        FreteResponse resposta = freteService.solicitar(pedido("01001000", "20040002"));

        assertEquals(StatusFrete.PENDENTE, resposta.status());
        assertEquals("Carlos Silva", resposta.cliente().nome());
        assertNull(resposta.motorista());
        assertEquals(new BigDecimal("180.00"), resposta.valor());
        assertTrue(resposta.coleta().enderecoCompleto().contains("Praça da Sé, nº 100"));
        assertEquals("Rio de Janeiro", resposta.entrega().cidade());
        verify(freteRepository).save(any(Frete.class));
    }

    @Test
    @DisplayName("Cliente inexistente → RecursoNaoEncontrado, sem consultar CEP")
    void clienteInexistente() {
        when(clienteRepository.findById(clienteId)).thenReturn(Optional.empty());

        assertThrows(RecursoNaoEncontradoException.class,
                () -> freteService.solicitar(pedido("01001000", "20040002")));
        verifyNoInteractions(enderecoGateway, freteRepository);
    }

    @Test
    @DisplayName("CEP inexistente → propaga CepNaoEncontrado e não salva nada")
    void cepInexistente() {
        when(clienteRepository.findById(clienteId)).thenReturn(Optional.of(cliente));
        when(enderecoGateway.buscarPorCep("99999999"))
                .thenThrow(new CepNaoEncontradoException("CEP não encontrado: 99999999"));

        assertThrows(CepNaoEncontradoException.class,
                () -> freteService.solicitar(pedido("99999999", "20040002")));
        verify(freteRepository, never()).save(any());
    }

    @Test
    @DisplayName("Aceite carrega motorista e frete, aplica a transição e grava com flush")
    void aceitaFrete() {
        UUID freteId = UUID.randomUUID();
        UUID motoristaId = UUID.randomUUID();
        Frete frete = Fixtures.fretePendente();
        Motorista motorista = new Motorista("11144477735", "Marcos", "m@email.com", "hash",
                "11988887777", TipoVeiculo.VAN, "ABC1234");
        when(motoristaRepository.findById(motoristaId)).thenReturn(Optional.of(motorista));
        when(freteRepository.findById(freteId)).thenReturn(Optional.of(frete));
        when(freteRepository.saveAndFlush(frete)).thenReturn(frete);

        FreteResponse resposta = freteService.aceitar(freteId, motoristaId);

        assertEquals(StatusFrete.ACEITO, resposta.status());
        assertEquals("Marcos", resposta.motorista().nome());
        verify(freteRepository).saveAndFlush(frete);
    }

    @Test
    @DisplayName("Frete inexistente → RecursoNaoEncontrado")
    void freteInexistente() {
        UUID freteId = UUID.randomUUID();
        when(freteRepository.findById(freteId)).thenReturn(Optional.empty());

        assertThrows(RecursoNaoEncontradoException.class, () -> freteService.iniciarTransporte(freteId));
    }
}
