package br.com.fretai.frete.application;

import br.com.fretai.calendario.application.CalendarioService;
import br.com.fretai.calendario.application.dto.VerificacaoDataResponse;
import br.com.fretai.endereco.domain.CepNaoEncontradoException;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.endereco.domain.EnderecoGateway;
import br.com.fretai.endereco.domain.GeocodificacaoGateway;
import br.com.fretai.frete.application.dto.EnderecoRequest;
import br.com.fretai.frete.application.dto.FreteResponse;
import br.com.fretai.frete.application.dto.SolicitarFreteRequest;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.FreteRepository;
import br.com.fretai.frete.domain.StatusFrete;
import br.com.fretai.rota.domain.Rota;
import br.com.fretai.rota.domain.RotaGateway;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.shared.seguranca.Papel;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import br.com.fretai.support.Fixtures;
import br.com.fretai.usuario.domain.Cliente;
import br.com.fretai.usuario.domain.ClienteRepository;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.MotoristaRepository;
import br.com.fretai.usuario.domain.CategoriaVeiculo;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Serviço de Frete (orquestração)")
class FreteServiceTest {

    @Mock private FreteRepository freteRepository;
    @Mock private ClienteRepository clienteRepository;
    @Mock private MotoristaRepository motoristaRepository;
    @Mock private EnderecoGateway enderecoGateway;
    @Mock private GeocodificacaoGateway geocodificacaoGateway;
    @Mock private RotaGateway rotaGateway;
    @Mock private CalendarioService calendarioService;

    private FreteService freteService;

    private final UUID clienteId = UUID.randomUUID();
    private Cliente cliente;

    @BeforeEach
    void setUp() {
        freteService = new FreteService(freteRepository, clienteRepository, motoristaRepository,
                new PreparacaoFrete(enderecoGateway, geocodificacaoGateway, rotaGateway, calendarioService,
                        new BigDecimal("20")));
        cliente = new Cliente("52998224725", "Carlos Silva", "carlos@email.com", "hash", "11999998888");
    }

    private SolicitarFreteRequest pedido(String cepOrigem, String cepDestino) {
        return pedido(cepOrigem, cepDestino, Fixtures.DIA_COMUM, new BigDecimal("180.00"));
    }

    private SolicitarFreteRequest pedido(String cepOrigem, String cepDestino, LocalDate dataColeta, BigDecimal valor) {
        return new SolicitarFreteRequest(clienteId,
                new EnderecoRequest(cepOrigem, "100", "Sala 3", "Próximo à Catedral"),
                new EnderecoRequest(cepDestino, "50", null, null),
                "Ana Pereira", "21977776666", "Caixa de peças", new BigDecimal("12"), valor, dataColeta);
    }

    private void diaComum() {
        when(calendarioService.verificar(Fixtures.DIA_COMUM))
                .thenReturn(new VerificacaoDataResponse(Fixtures.DIA_COMUM, false, null, false, true));
    }

    @Test
    @DisplayName("Coleta no feriado → grava o feriado e soma 20% ao valor oferecido")
    void coletaNoFeriado() {
        LocalDate finados = LocalDate.of(2026, 11, 2);
        when(clienteRepository.findById(clienteId)).thenReturn(Optional.of(cliente));
        when(enderecoGateway.buscarPorCep(anyString())).thenReturn(Fixtures.enderecoSaoPaulo());
        when(geocodificacaoGateway.localizar(any(), any())).thenReturn(Optional.empty());
        when(calendarioService.verificar(finados))
                .thenReturn(new VerificacaoDataResponse(finados, true, "Finados", false, false));
        when(freteRepository.save(any(Frete.class))).thenAnswer(i -> i.getArgument(0));

        FreteResponse resposta = freteService.solicitar(pedido("01001000", "20040002", finados, new BigDecimal("1500.00")));

        assertTrue(resposta.feriado());
        assertEquals("Finados", resposta.nomeFeriado());
        assertEquals(new BigDecimal("1500.00"), resposta.valor());
        assertEquals(new BigDecimal("300.00"), resposta.adicionalFeriado());
        assertEquals(new BigDecimal("1800.00"), resposta.valorTotal());
    }

    @Test
    @DisplayName("Solicita frete consultando os dois CEPs e salva como PENDENTE")
    void solicitaFrete() {
        diaComum();
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
        assertEquals(new BigDecimal("180.00"), resposta.valorTotal());
        assertFalse(resposta.feriado());
        assertTrue(resposta.coleta().enderecoCompleto().contains("Praça da Sé, nº 100"));
        assertEquals("Rio de Janeiro", resposta.entrega().cidade());
        verify(freteRepository).save(any(Frete.class));
    }

    @Test
    @DisplayName("Com as duas pontas no mapa, grava coordenadas e distância da rota")
    void registraRota() {
        diaComum();
        Coordenadas sp = new Coordenadas(-23.5503898, -46.633081);
        Coordenadas rj = new Coordenadas(-22.9035, -43.1756);
        Endereco enderecoSp = Fixtures.enderecoSaoPaulo();
        Endereco enderecoRj = Fixtures.enderecoRioDeJaneiro();
        when(clienteRepository.findById(clienteId)).thenReturn(Optional.of(cliente));
        when(enderecoGateway.buscarPorCep("01001000")).thenReturn(enderecoSp);
        when(enderecoGateway.buscarPorCep("20040002")).thenReturn(enderecoRj);
        when(geocodificacaoGateway.localizar(enderecoSp, "100")).thenReturn(Optional.of(sp));
        when(geocodificacaoGateway.localizar(enderecoRj, "50")).thenReturn(Optional.of(rj));
        when(rotaGateway.calcular(sp, rj)).thenReturn(new Rota(new BigDecimal("429.3"), false));
        when(freteRepository.save(any(Frete.class))).thenAnswer(i -> i.getArgument(0));

        FreteResponse resposta = freteService.solicitar(pedido("01001000", "20040002"));

        assertEquals(new BigDecimal("429.3"), resposta.distanciaKm());
        assertFalse(resposta.distanciaEstimada());
        assertEquals(-23.5503898, resposta.coleta().latitude());
        assertEquals(-43.1756, resposta.entrega().longitude());
    }

    @Test
    @DisplayName("Endereço fora do mapa → frete criado mesmo assim, sem distância")
    void semGeocodificacao() {
        diaComum();
        when(clienteRepository.findById(clienteId)).thenReturn(Optional.of(cliente));
        when(enderecoGateway.buscarPorCep(anyString())).thenReturn(Fixtures.enderecoSaoPaulo());
        when(geocodificacaoGateway.localizar(any(), any())).thenReturn(Optional.empty());
        when(freteRepository.save(any(Frete.class))).thenAnswer(i -> i.getArgument(0));

        FreteResponse resposta = freteService.solicitar(pedido("01001000", "20040002"));

        assertEquals(StatusFrete.PENDENTE, resposta.status());
        assertNull(resposta.distanciaKm());
        assertNull(resposta.coleta().latitude());
        verifyNoInteractions(rotaGateway);
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
                "11988887777", CategoriaVeiculo.VAN, "ABC1234");
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

        assertThrows(RecursoNaoEncontradoException.class, () -> freteService.iniciarTransporte(freteId,
                new UsuarioLogado(UUID.randomUUID(), Papel.MOTORISTA, null)));
    }
}
