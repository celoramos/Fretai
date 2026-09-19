package br.com.Fretai.Frete;

import br.com.Fretai.Cep.ConsultaCep;
import br.com.Fretai.Cep.Endereco;
import br.com.Fretai.Exception.CepNaoEncontradoException;
import br.com.Fretai.Usuarios.CadastroCliente;
import br.com.Fretai.Usuarios.CadastroMotorista;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes do Serviço de Frete e Ciclo de Vida da Entrega")
class FreteServiceTest {

    @Mock
    private ConsultaCep consultaCep;

    @InjectMocks
    private FreteService freteService;

    private CadastroCliente cliente;
    private CadastroMotorista motorista;
    private Endereco enderecoOrigem;
    private Endereco enderecoDestino;

    @BeforeEach
    void setUp() {
        cliente = new CadastroCliente("52998224725", "Carlos Silva", "carlos@email.com", "senha123", "11999998888", "01001-000", "20040-002");
        motorista = new CadastroMotorista("11144477735", "Marcos Souza", "marcos@email.com", "senha456", "11988887777", "Fiorino");

        enderecoOrigem = new Endereco();
        enderecoOrigem.setCep("01001-000");
        enderecoOrigem.setLogradouro("Praça da Sé");
        enderecoOrigem.setBairro("Sé");
        enderecoOrigem.setLocalidade("São Paulo");
        enderecoOrigem.setUf("SP");

        enderecoDestino = new Endereco();
        enderecoDestino.setCep("20040-002");
        enderecoDestino.setLogradouro("Rua da Assembleia");
        enderecoDestino.setBairro("Centro");
        enderecoDestino.setLocalidade("Rio de Janeiro");
        enderecoDestino.setUf("RJ");
    }

    @Test
    @DisplayName("Deve solicitar frete com sucesso gerando pontos de coleta e entrega completos")
    void deveSolicitarFreteComSucesso() {
        when(consultaCep.buscaEndereco("01001000")).thenReturn(enderecoOrigem);
        when(consultaCep.buscaEndereco("20040002")).thenReturn(enderecoDestino);

        Frete frete = freteService.solicitarFrete(
                cliente,
                "01001000", "100", "Sala 3", "Próximo à Catedral",
                "20040002", "50", "Andar 10", "Em frente ao metrô",
                "Ana Pereira", "21977776666",
                "Caixa de Peças Automotivas - 12kg", 180.0
        );

        assertNotNull(frete);
        assertNotNull(frete.getId());
        assertEquals(StatusFrete.PENDENTE, frete.getStatus());
        assertEquals(cliente, frete.getCliente());
        assertNull(frete.getMotorista());
        assertEquals(180.0, frete.getValor());
        assertEquals("Ana Pereira", frete.getNomeDestinatario());

        // Validação da origem formatada
        assertTrue(frete.getPontoColeta().getEnderecoCompleto().contains("Praça da Sé"));
        assertTrue(frete.getPontoColeta().getEnderecoCompleto().contains("nº 100"));
        assertTrue(frete.getPontoColeta().getEnderecoCompleto().contains("[Ref: Próximo à Catedral]"));

        // Validação do destino formatado
        assertTrue(frete.getPontoEntrega().getEnderecoCompleto().contains("Rua da Assembleia"));
        assertTrue(frete.getPontoEntrega().getEnderecoCompleto().contains("nº 50"));
        assertTrue(frete.getPontoEntrega().getEnderecoCompleto().contains("Rio de Janeiro/RJ"));

        // Resumo do frete
        String resumo = frete.gerarResumoFrete();
        assertTrue(resumo.contains("PONTO DE COLETA"));
        assertTrue(resumo.contains("PONTO DE ENTREGA"));
        assertTrue(resumo.contains("Aguardando motorista"));
    }

    @Test
    @DisplayName("Deve lançar CepNaoEncontradoException quando CEP de origem for inválido/inexistente")
    void deveLancarExcecaoQuandoCepNaoExistir() {
        when(consultaCep.buscaEndereco("99999999"))
                .thenThrow(new CepNaoEncontradoException("CEP não encontrado: 99999999"));

        assertThrows(CepNaoEncontradoException.class, () ->
                freteService.solicitarFrete(
                        cliente,
                        "99999999", "10", null, null,
                        "20040002", "20", null, null,
                        "Destinatario", "11999990000",
                        "Documentos", 50.0
                )
        );
    }

    @Test
    @DisplayName("Deve cumprir o fluxo completo do ciclo de vida da entrega (PENDENTE -> ACEITO -> EM_TRANSITO -> ENTREGUE)")
    void devePercorrerFluxoCompletoDoFrete() {
        when(consultaCep.buscaEndereco("01001000")).thenReturn(enderecoOrigem);
        when(consultaCep.buscaEndereco("20040002")).thenReturn(enderecoDestino);

        Frete frete = freteService.solicitarFrete(
                cliente,
                "01001000", "1", null, null,
                "20040002", "2", null, null,
                "Destinatario", "11999990000",
                "Encomenda", 100.0
        );
        assertEquals(StatusFrete.PENDENTE, frete.getStatus());

        // 1. Motorista aceita
        freteService.atribuirMotorista(frete, motorista);
        assertEquals(StatusFrete.ACEITO, frete.getStatus());
        assertEquals(motorista, frete.getMotorista());

        // 2. Inicia transporte
        freteService.iniciarTransporte(frete);
        assertEquals(StatusFrete.EM_TRANSITO, frete.getStatus());

        // 3. Conclui entrega
        freteService.concluirEntrega(frete);
        assertEquals(StatusFrete.ENTREGUE, frete.getStatus());
        assertNotNull(frete.getDataConclusao());
    }

    @Test
    @DisplayName("Não deve permitir iniciar transporte de frete ainda pendente")
    void naoDevePermitirIniciarTransporteSemMotorista() {
        when(consultaCep.buscaEndereco("01001000")).thenReturn(enderecoOrigem);
        when(consultaCep.buscaEndereco("20040002")).thenReturn(enderecoDestino);

        Frete frete = freteService.solicitarFrete(
                cliente,
                "01001000", "1", null, null,
                "20040002", "2", null, null,
                "Destinatario", "11999990000",
                "Encomenda", 100.0
        );

        assertThrows(IllegalStateException.class, () -> freteService.iniciarTransporte(frete));
    }

    @Test
    @DisplayName("Deve permitir cancelar um frete pendente")
    void devePermitirCancelarFretePendente() {
        when(consultaCep.buscaEndereco("01001000")).thenReturn(enderecoOrigem);
        when(consultaCep.buscaEndereco("20040002")).thenReturn(enderecoDestino);

        Frete frete = freteService.solicitarFrete(
                cliente,
                "01001000", "1", null, null,
                "20040002", "2", null, null,
                "Destinatario", "11999990000",
                "Encomenda", 100.0
        );

        freteService.cancelarFrete(frete, "Cliente desistiu");
        assertEquals(StatusFrete.CANCELADO, frete.getStatus());
        assertNotNull(frete.getDataConclusao());

        // Tentar cancelar novamente deve falhar
        assertThrows(IllegalStateException.class, () -> freteService.cancelarFrete(frete, "Outro motivo"));
    }
}
