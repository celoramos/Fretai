package br.com.fretai;

import br.com.fretai.calendario.domain.FeriadoGateway;
import br.com.fretai.empresa.domain.DadosCnpj;
import br.com.fretai.empresa.domain.EmpresaGateway;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.EnderecoGateway;
import br.com.fretai.endereco.domain.GeocodificacaoGateway;
import br.com.fretai.notificacao.domain.Notificador;
import br.com.fretai.notificacao.domain.TipoNotificacao;
import br.com.fretai.pagamento.application.PagamentoService;
import br.com.fretai.rota.domain.Rota;
import br.com.fretai.rota.domain.RotaGateway;
import br.com.fretai.support.Login;
import com.jayway.jsonpath.JsonPath;
import java.math.BigDecimal;
import java.net.URI;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "fretai.admin.email=admin.canhoto@fretai.dev", "fretai.admin.senha=senhaDoAdmin123",
        "fretai.admin.cpf=32197530941"})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Canhoto digital, contestação e liberação do saldo")
class CanhotoIntegrationTest {

    private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 9, 9};
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 1, 2};
    /** Endereço de entrega: centro do Rio. */
    private static final double DESTINO_LAT = -22.9035;
    private static final double DESTINO_LNG = -43.1757;

    @Autowired private MockMvc mvc;
    @Autowired private PagamentoService pagamentoService;

    @MockitoBean private Notificador notificador;
    @MockitoBean private EnderecoGateway enderecoGateway;
    @MockitoBean private GeocodificacaoGateway geocodificacaoGateway;
    @MockitoBean private RotaGateway rotaGateway;
    @MockitoBean private FeriadoGateway feriadoGateway;
    @MockitoBean private EmpresaGateway empresaGateway;

    @BeforeEach
    void simularServicosExternos() {
        when(feriadoGateway.nacionaisDoAno(anyInt())).thenReturn(List.of());
        when(enderecoGateway.buscarPorCep(anyString()))
                .thenReturn(new Endereco("20040-002", "Rua da Assembleia", "Centro", "Rio de Janeiro", "RJ"));
        when(geocodificacaoGateway.localizar(any(), any())).thenReturn(Optional.empty());
        when(rotaGateway.calcular(any(), any())).thenReturn(new Rota(new BigDecimal("430"), false));
        when(empresaGateway.buscarPorCnpj(anyString())).thenAnswer(i -> new DadosCnpj(
                i.getArgument(0), "Recebedora Ltda", null, "ATIVA", LocalDate.of(2000, 1, 1),
                "Comércio", "Rio de Janeiro", "RJ", "20040002"));
    }

    @Test
    @DisplayName("GPS longe é recusado; canhoto válido entrega o frete; recebedor contesta com o código; admin resolve")
    void fluxoCompleto() throws Exception {
        String empresaId = JsonPath.read(mvc.perform(post("/api/empresas").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cnpj": "70013579246020", "tipo": "EMBARCADOR", "telefone": "2133334444",
                         "responsavel": {"cpf": "30666666709", "nome": "Responsável", "email": "canhoto@empresa.com",
                                         "senha": "senhaForte1", "telefone": "21999998888"}}"""))
                .andReturn().getResponse().getContentAsString(), "$.id");
        RequestPostProcessor empresa = Login.como(mvc, "canhoto@empresa.com");
        String motoristaId = JsonPath.read(mvc.perform(post("/api/motoristas").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"cpf": "31432098870", "nome": "Entregador", "email": "entrega@email.com",
                                 "senha": "senhaForte1", "telefone": "11988887777", "tipoVeiculo": "CAMINHAO",
                                 "placa": "CAN1A11"}"""))
                .andReturn().getResponse().getContentAsString(), "$.id");
        RequestPostProcessor motorista = Login.como(mvc, "entrega@email.com");
        mvc.perform(put("/api/motoristas/{id}/chave-pix", motoristaId).with(motorista)
                .contentType(MediaType.APPLICATION_JSON).content("{\"chavePix\": \"31432098870\"}"));
        String veiculoId = JsonPath.read(mvc.perform(post("/api/motoristas/{id}/veiculos", motoristaId).with(motorista)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"placa": "CAN2B22", "rntrc": "12345678", "tipo": "CARRETA", "carroceria": "SIDER",
                                 "numeroEixos": 5, "rastreador": true}"""))
                .andReturn().getResponse().getContentAsString(), "$.id");
        String freteId = JsonPath.read(mvc.perform(post("/api/fretes/empresa/{id}", empresaId).with(empresa)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"coleta":  {"cep": "01001-000", "latitude": -23.5505, "longitude": -46.6333},
                                 "entrega": {"cep": "20040-002", "latitude": %s, "longitude": %s},
                                 "descricaoCarga": "Paletes", "especieCarga": "Cerâmica", "tipoCargaAntt": "CARGA_GERAL",
                                 "pesoKg": 20000, "valor": 9000.00, "dataColeta": "2099-03-10"}"""
                                .formatted(DESTINO_LAT, DESTINO_LNG)))
                .andReturn().getResponse().getContentAsString(), "$.id");
        mvc.perform(post("/api/fretes/{id}/aceite", freteId).with(motorista).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"motoristaId\": \"%s\", \"veiculoId\": \"%s\"}".formatted(motoristaId, veiculoId)))
                .andExpect(status().isOk());
        String cobrancaId = JsonPath.read(mvc.perform(post("/api/fretes/{id}/pagamento", freteId).with(empresa))
                .andReturn().getResponse().getContentAsString(), "$.cobrancaId");
        mvc.perform(post("/api/webhooks/pagamentos").header("X-Webhook-Token", "fake-dev")
                .contentType(MediaType.APPLICATION_JSON).content("""
                        {"idEvento": "evt-%s", "tipo": "PAGAMENTO_CONFIRMADO", "cobrancaId": "%s"}"""
                        .formatted(UUID.randomUUID(), cobrancaId)));
        mvc.perform(post("/api/fretes/{id}/inicio", freteId).with(motorista)).andExpect(status().isOk());

        // GPS em São Paulo: longe demais do destino no Rio.
        mvc.perform(canhoto(freteId, -23.5505, -46.6333, PNG).with(motorista))
                .andExpect(status().isUnprocessableContent());
        // Assinatura precisa ser PNG.
        mvc.perform(canhoto(freteId, DESTINO_LAT, DESTINO_LNG, JPEG).with(motorista))
                .andExpect(status().isUnprocessableContent());
        // A empresa não registra canhoto.
        mvc.perform(canhoto(freteId, DESTINO_LAT, DESTINO_LNG, PNG).with(empresa)).andExpect(status().isForbidden());

        // A ~60 m do destino: vale.
        mvc.perform(canhoto(freteId, -22.9030, -43.1755, PNG).with(motorista))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.localConferido").value(true))
                .andExpect(jsonPath("$.fotoUrl").exists());
        mvc.perform(get("/api/fretes/{id}", freteId).with(empresa)).andExpect(jsonPath("$.status").value("ENTREGUE"));
        mvc.perform(get("/api/fretes/{id}/pagamento", freteId).with(empresa))
                .andExpect(jsonPath("$.status").value("ADIANTAMENTO_LIBERADO"))
                .andExpect(jsonPath("$.saldoLiberavelApos").exists());

        // A foto abre pelo link temporário.
        String fotoUrl = JsonPath.read(mvc.perform(get("/api/fretes/{id}/canhoto", freteId).with(empresa))
                .andReturn().getResponse().getContentAsString(), "$.fotoUrl");
        mvc.perform(get(URI.create(fotoUrl).getPath())).andExpect(status().isOk());

        // O recebedor recebeu o código por mensagem e contesta sem login.
        ArgumentCaptor<Notificador.Mensagem> mensagens = ArgumentCaptor.forClass(Notificador.Mensagem.class);
        verify(notificador, atLeastOnce()).enviar(mensagens.capture());
        assertTrue(mensagens.getAllValues().stream().anyMatch(m -> m.tipo() == TipoNotificacao.PAGAMENTO_RETIDO));
        Notificador.Mensagem entrega = mensagens.getAllValues().stream()
                .filter(m -> m.tipo() == TipoNotificacao.ENTREGA_REGISTRADA).findFirst().orElseThrow();
        String codigo = entrega.parametros().get(2);
        assertEquals("2133334444", entrega.telefone(), "frete de empresa: o código vai para a empresa");

        mvc.perform(post("/api/canhotos/contestacao").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"codigo\": \"ERRADO99\", \"motivo\": \"x\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/canhotos/contestacao").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"codigo\": \"%s\", \"motivo\": \"Faltaram 2 paletes\"}".formatted(codigo.toLowerCase())))
                .andExpect(status().isAccepted());
        mvc.perform(get("/api/fretes/{id}/pagamento", freteId).with(empresa))
                .andExpect(jsonPath("$.saldoBloqueado").value(true));

        // Bloqueado, o saldo não sai nem com a janela vencida.
        String pagamentoId = JsonPath.read(mvc.perform(get("/api/fretes/{id}/pagamento", freteId).with(empresa))
                .andReturn().getResponse().getContentAsString(), "$.id");
        pagamentoService.agendarSaldo(UUID.fromString(freteId), Instant.now().minusSeconds(1));
        assertFalse(pagamentoService.liberarSaldo(UUID.fromString(pagamentoId)));

        RequestPostProcessor admin = Login.como(mvc, "admin.canhoto@fretai.dev", "senhaDoAdmin123");
        mvc.perform(post("/api/fretes/{id}/canhoto/resolucao", freteId).with(empresa)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"resolucao\": \"ENTREGA_CONFIRMADA\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/fretes/{id}/canhoto/resolucao", freteId).with(admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"resolucao\": \"ENTREGA_CONFIRMADA\", \"observacao\": \"Paletes no estoque do cliente\"}"))
                .andExpect(status().isOk());

        assertTrue(pagamentoService.liberarSaldo(UUID.fromString(pagamentoId)));
        mvc.perform(get("/api/fretes/{id}", freteId).with(motorista)).andExpect(jsonPath("$.status").value("PAGO"));

        // Frete de retorno é só do motorista do frete.
        mvc.perform(get("/api/fretes/{id}/retorno", freteId).with(empresa)).andExpect(status().isForbidden());
    }

    private static MockMultipartHttpServletRequestBuilder canhoto(String freteId, double lat, double lng,
                                                                 byte[] assinatura) {
        return (MockMultipartHttpServletRequestBuilder) multipart("/api/fretes/{id}/canhoto", freteId)
                .file(new MockMultipartFile("foto", "foto.png", "image/png", PNG))
                .file(new MockMultipartFile("assinatura", "assinatura.png", "image/png", assinatura))
                .param("nomeRecebedor", "Joana Recebedora")
                .param("latitude", String.valueOf(lat))
                .param("longitude", String.valueOf(lng));
    }
}
