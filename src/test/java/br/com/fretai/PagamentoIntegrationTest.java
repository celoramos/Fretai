package br.com.fretai;

import br.com.fretai.calendario.domain.FeriadoGateway;
import br.com.fretai.empresa.domain.DadosCnpj;
import br.com.fretai.empresa.domain.EmpresaGateway;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.EnderecoGateway;
import br.com.fretai.endereco.domain.GeocodificacaoGateway;
import br.com.fretai.pagamento.application.PagamentoService;
import br.com.fretai.pagamento.domain.GatewayPagamento;
import br.com.fretai.pagamento.domain.WebhookRecebidoRepository;
import br.com.fretai.pagamento.infra.FakeGatewayPagamento;
import br.com.fretai.rota.domain.Rota;
import br.com.fretai.rota.domain.RotaGateway;
import br.com.fretai.support.Login;
import com.jayway.jsonpath.JsonPath;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Pagamento com garantia: cobrança, webhook idempotente, adiantamento, saldo e estorno")
class PagamentoIntegrationTest {

    @Autowired private MockMvc mvc;
    @Autowired private FakeGatewayPagamento psp;
    @Autowired private PagamentoService pagamentoService;
    @Autowired private WebhookRecebidoRepository webhooks;

    @MockitoBean private EnderecoGateway enderecoGateway;
    @MockitoBean private GeocodificacaoGateway geocodificacaoGateway;
    @MockitoBean private RotaGateway rotaGateway;
    @MockitoBean private FeriadoGateway feriadoGateway;
    @MockitoBean private EmpresaGateway empresaGateway;

    private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 9, 9};

    private static RequestPostProcessor empresa;
    private static RequestPostProcessor motorista;
    private static String empresaId;
    private static String motoristaId;
    private static String veiculoId;

    @BeforeEach
    void preparar() throws Exception {
        when(feriadoGateway.nacionaisDoAno(anyInt())).thenReturn(List.of());
        when(enderecoGateway.buscarPorCep(anyString()))
                .thenReturn(new Endereco("01001-000", "Praça da Sé", "Sé", "São Paulo", "SP"));
        when(geocodificacaoGateway.localizar(any(), any())).thenReturn(Optional.empty());
        when(rotaGateway.calcular(any(), any())).thenReturn(new Rota(new BigDecimal("50"), false));
        when(empresaGateway.buscarPorCnpj(anyString())).thenAnswer(i -> new DadosCnpj(
                i.getArgument(0), "Pagadora Ltda", null, "ATIVA", LocalDate.of(2000, 1, 1),
                "Comércio", "São Paulo", "SP", "01001000"));
        if (empresa != null) {
            return;
        }
        empresaId = JsonPath.read(mvc.perform(post("/api/empresas").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cnpj": "70012221321476", "tipo": "EMBARCADOR", "telefone": "1133334444",
                         "responsavel": {"cpf": "28370370446", "nome": "Responsável", "email": "paga@empresa.com",
                                         "senha": "senhaForte1", "telefone": "11999998888"}}"""))
                .andReturn().getResponse().getContentAsString(), "$.id");
        empresa = Login.como(mvc, "paga@empresa.com");
        motoristaId = JsonPath.read(mvc.perform(post("/api/motoristas").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cpf": "29135802545", "nome": "Recebedor", "email": "recebe@email.com", "senha": "senhaForte1",
                         "telefone": "11988887777", "tipoVeiculo": "CAMINHAO", "placa": "PAG1A11"}"""))
                .andReturn().getResponse().getContentAsString(), "$.id");
        motorista = Login.como(mvc, "recebe@email.com");
        veiculoId = JsonPath.read(mvc.perform(post("/api/motoristas/{id}/veiculos", motoristaId).with(motorista)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"placa": "PAG2B22", "categoria": "CAMINHAO", "rntrc": "12345678", "tipo": "TRUCK", "carroceria": "BAU",
                                 "numeroEixos": 3, "rastreador": false}"""))
                .andReturn().getResponse().getContentAsString(), "$.id");
    }

    @Test
    @DisplayName("Fluxo feliz: Pix retido, adiantamento na saída, saldo depois do canhoto, frete PAGO")
    void fluxoFeliz() throws Exception {
        String freteId = freteAceitoCom40PorCento();

        mvc.perform(put("/api/motoristas/{id}/chave-pix", motoristaId).with(motorista)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"chavePix\": \"recebe@email.com\"}"))
                .andExpect(jsonPath("$.temChavePix").value(true));

        String cobranca = JsonPath.read(mvc.perform(post("/api/fretes/{id}/pagamento", freteId).with(empresa))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDENTE"))
                .andExpect(jsonPath("$.valorAdiantamento").value(4000.00))
                .andExpect(jsonPath("$.valorSaldo").value(6000.00))
                .andExpect(jsonPath("$.pixCopiaECola").exists())
                .andReturn().getResponse().getContentAsString(), "$.id");
        mvc.perform(post("/api/fretes/{id}/pagamento", freteId).with(empresa)).andExpect(status().isConflict());
        String cobrancaId = cobrancaDoPsp(freteId);

        // Webhook sem token: 401 e nada muda.
        mvc.perform(post("/api/webhooks/pagamentos").contentType(MediaType.APPLICATION_JSON)
                        .content(webhook("evt-sem-token", cobrancaId)))
                .andExpect(status().isUnauthorized());

        String idEvento = "evt-" + UUID.randomUUID();
        for (int i = 0; i < 3; i++) { // o PSP reenvia; só o primeiro tem efeito
            mvc.perform(post("/api/webhooks/pagamentos").header("X-Webhook-Token", "fake-dev")
                            .contentType(MediaType.APPLICATION_JSON).content(webhook(idEvento, cobrancaId)))
                    .andExpect(status().isOk());
        }
        assertTrue(webhooks.existsById(idEvento));
        mvc.perform(get("/api/fretes/{id}/pagamento", freteId).with(motorista))
                .andExpect(jsonPath("$.status").value("RETIDO"))
                .andExpect(jsonPath("$.pixCopiaECola").doesNotExist());

        mvc.perform(post("/api/fretes/{id}/inicio", freteId).with(motorista)).andExpect(status().isOk());
        mvc.perform(get("/api/fretes/{id}/pagamento", freteId).with(motorista))
                .andExpect(jsonPath("$.status").value("ADIANTAMENTO_LIBERADO"));
        assertTrue(psp.transferencias().stream().anyMatch(t -> t.valor().compareTo(new BigDecimal("4000.00")) == 0
                && t.chavePix().equals("recebe@email.com")));

        // Com o dinheiro retido, a entrega só se confirma pelo canhoto: concluir sem ele deixaria o saldo preso.
        mvc.perform(post("/api/fretes/{id}/conclusao", freteId).with(motorista))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.detail").value(
                        "Este frete tem pagamento com garantia: confirme a entrega pelo canhoto digital, que libera o saldo."));
        mvc.perform(get("/api/fretes/{id}", freteId).with(motorista)).andExpect(jsonPath("$.status").value("EM_TRANSITO"));

        mvc.perform(multipart("/api/fretes/{id}/canhoto", freteId)
                        .file(new MockMultipartFile("foto", "foto.png", "image/png", PNG))
                        .file(new MockMultipartFile("assinatura", "assinatura.png", "image/png", PNG))
                        .param("nomeRecebedor", "Joana Recebedora")
                        .param("latitude", "-23.5505").param("longitude", "-46.6333").with(motorista))
                .andExpect(status().isCreated());
        // O canhoto agendou o saldo para depois da janela de contestação; aqui ela já venceu.
        assertFalse(pagamentoService.liberarSaldo(UUID.fromString(cobranca)), "antes da janela o saldo não sai");
        pagamentoService.agendarSaldo(UUID.fromString(freteId), Instant.now().minusSeconds(1));
        assertTrue(pagamentoService.liberarSaldo(UUID.fromString(cobranca)));

        mvc.perform(get("/api/fretes/{id}/pagamento", freteId).with(empresa))
                .andExpect(jsonPath("$.status").value("LIBERADO"));
        mvc.perform(get("/api/fretes/{id}", freteId).with(empresa))
                .andExpect(jsonPath("$.status").value("PAGO"))
                .andExpect(jsonPath("$.pagoEm").exists());
    }

    @Test
    @DisplayName("Sem chave Pix do motorista não há cobrança: não haveria para onde mandar o dinheiro")
    void semChavePix() throws Exception {
        String outro = JsonPath.read(mvc.perform(post("/api/motoristas").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cpf": "29901234662", "nome": "Sem Pix", "email": "sempix@email.com", "senha": "senhaForte1",
                         "telefone": "11988887777", "tipoVeiculo": "CAMINHAO", "placa": "PAG3C33"}"""))
                .andReturn().getResponse().getContentAsString(), "$.id");
        RequestPostProcessor semPix = Login.como(mvc, "sempix@email.com");
        String caminhao = JsonPath.read(mvc.perform(post("/api/motoristas/{id}/veiculos", outro).with(semPix)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"placa": "PAG4D44", "categoria": "CAMINHAO", "rntrc": "12345678", "tipo": "TRUCK", "carroceria": "BAU",
                                 "numeroEixos": 3, "rastreador": false}"""))
                .andReturn().getResponse().getContentAsString(), "$.id");
        String freteId = JsonPath.read(mvc.perform(post("/api/fretes/empresa/{id}", empresaId).with(empresa)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"coleta": {"cep": "01001-000"}, "entrega": {"cep": "01310-100"},
                                 "descricaoCarga": "Caixas", "especieCarga": "Diversos", "tipoCargaAntt": "CARGA_GERAL",
                                 "pesoKg": 5000, "valor": 3000.00, "dataColeta": "2099-03-10"}"""))
                .andReturn().getResponse().getContentAsString(), "$.id");
        mvc.perform(post("/api/fretes/{id}/aceite", freteId).with(semPix).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"motoristaId\": \"%s\", \"veiculoId\": \"%s\"}".formatted(outro, caminhao)))
                .andExpect(status().isOk());

        mvc.perform(post("/api/fretes/{id}/pagamento", freteId).with(empresa))
                .andExpect(status().isUnprocessableContent());
    }

    @Test
    @DisplayName("Cancelado depois de pago e antes da saída: o PSP devolve o valor")
    void estorno() throws Exception {
        mvc.perform(put("/api/motoristas/{id}/chave-pix", motoristaId).with(motorista)
                .contentType(MediaType.APPLICATION_JSON).content("{\"chavePix\": \"+5511988887777\"}"));
        String freteId = freteAceitoCom40PorCento();
        mvc.perform(post("/api/fretes/{id}/pagamento", freteId).with(empresa)).andExpect(status().isCreated());
        String cobrancaId = cobrancaDoPsp(freteId);
        mvc.perform(post("/api/webhooks/pagamentos").header("X-Webhook-Token", "fake-dev")
                .contentType(MediaType.APPLICATION_JSON).content(webhook("evt-" + UUID.randomUUID(), cobrancaId)));

        mvc.perform(post("/api/fretes/{id}/cancelamento", freteId).with(empresa)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"motivo\": \"Carga não ficou pronta\"}"))
                .andExpect(status().isOk());

        assertTrue(psp.foiEstornada(cobrancaId));
        mvc.perform(get("/api/fretes/{id}/pagamento", freteId).with(empresa)).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PSP fora do ar no cancelamento: o frete cancela mesmo assim e o job devolve o valor depois")
    void estornoQueFalhouETentadoDeNovo() throws Exception {
        mvc.perform(put("/api/motoristas/{id}/chave-pix", motoristaId).with(motorista)
                .contentType(MediaType.APPLICATION_JSON).content("{\"chavePix\": \"+5511988887777\"}"));
        String freteId = freteAceitoCom40PorCento();
        UUID pagamentoId = UUID.fromString(JsonPath.read(mvc.perform(post("/api/fretes/{id}/pagamento", freteId)
                .with(empresa)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id"));
        String cobrancaId = cobrancaDoPsp(freteId);
        mvc.perform(post("/api/webhooks/pagamentos").header("X-Webhook-Token", "fake-dev")
                .contentType(MediaType.APPLICATION_JSON).content(webhook("evt-" + UUID.randomUUID(), cobrancaId)));
        assertFalse(pagamentoService.estornosPendentes().contains(pagamentoId), "frete aceito não tem o que devolver");

        psp.foraDoAr(true);
        try {
            mvc.perform(post("/api/fretes/{id}/cancelamento", freteId).with(empresa)
                            .contentType(MediaType.APPLICATION_JSON).content("{\"motivo\": \"Carga não ficou pronta\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("CANCELADO"));
            // O dinheiro continua retido: sem nova tentativa, ficaria assim para sempre.
            assertFalse(psp.foiEstornada(cobrancaId));
            mvc.perform(get("/api/fretes/{id}/pagamento", freteId).with(empresa))
                    .andExpect(jsonPath("$.status").value("RETIDO"));
            assertTrue(pagamentoService.estornosPendentes().contains(pagamentoId));

            // O job roda com o PSP ainda fora: nada muda, e o erro não se perde.
            assertThrows(RuntimeException.class, () -> pagamentoService.retentarEstorno(pagamentoId));
            assertTrue(pagamentoService.estornosPendentes().contains(pagamentoId));
        } finally {
            psp.foraDoAr(false);
        }

        pagamentoService.retentarEstorno(pagamentoId);

        assertTrue(psp.foiEstornada(cobrancaId));
        assertFalse(pagamentoService.estornosPendentes().contains(pagamentoId));
        mvc.perform(get("/api/fretes/{id}/pagamento", freteId).with(empresa)).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Pix que cai depois do cancelamento, com a cobrança ainda aberta no PSP, é devolvido")
    void pixPagoDepoisDoCancelamento() throws Exception {
        mvc.perform(put("/api/motoristas/{id}/chave-pix", motoristaId).with(motorista)
                .contentType(MediaType.APPLICATION_JSON).content("{\"chavePix\": \"+5511988887777\"}"));
        String freteId = freteAceitoCom40PorCento();
        UUID pagamentoId = UUID.fromString(JsonPath.read(mvc.perform(post("/api/fretes/{id}/pagamento", freteId)
                .with(empresa)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id"));
        String cobrancaId = cobrancaDoPsp(freteId);

        psp.foraDoAr(true);
        try {
            // A cobrança não pôde ser cancelada no PSP: o QR Code continua valendo.
            mvc.perform(post("/api/fretes/{id}/cancelamento", freteId).with(empresa)
                            .contentType(MediaType.APPLICATION_JSON).content("{\"motivo\": \"Desistência\"}"))
                    .andExpect(status().isOk());
        } finally {
            psp.foraDoAr(false);
        }
        mvc.perform(post("/api/webhooks/pagamentos").header("X-Webhook-Token", "fake-dev")
                        .contentType(MediaType.APPLICATION_JSON).content(webhook("evt-" + UUID.randomUUID(), cobrancaId)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/fretes/{id}/pagamento", freteId).with(empresa))
                .andExpect(jsonPath("$.status").value("RETIDO"));

        pagamentoService.estornosPendentes().forEach(pagamentoService::retentarEstorno);

        assertTrue(psp.foiEstornada(cobrancaId));
        assertFalse(pagamentoService.estornosPendentes().contains(pagamentoId));
    }

    @Test
    @DisplayName("PSP fora do ar na saída: a carga sai mesmo assim e o job manda o adiantamento depois")
    void adiantamentoQueFalhouETentadoDeNovo() throws Exception {
        mvc.perform(put("/api/motoristas/{id}/chave-pix", motoristaId).with(motorista)
                .contentType(MediaType.APPLICATION_JSON).content("{\"chavePix\": \"recebe@email.com\"}"));
        String freteId = freteAceitoCom40PorCento();
        UUID pagamentoId = UUID.fromString(JsonPath.read(mvc.perform(post("/api/fretes/{id}/pagamento", freteId)
                .with(empresa)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id"));
        mvc.perform(post("/api/webhooks/pagamentos").header("X-Webhook-Token", "fake-dev")
                .contentType(MediaType.APPLICATION_JSON)
                .content(webhook("evt-" + UUID.randomUUID(), cobrancaDoPsp(freteId))));

        psp.foraDoAr(true);
        try {
            mvc.perform(post("/api/fretes/{id}/inicio", freteId).with(motorista)).andExpect(status().isOk());
        } finally {
            psp.foraDoAr(false);
        }
        mvc.perform(get("/api/fretes/{id}/pagamento", freteId).with(motorista))
                .andExpect(jsonPath("$.status").value("RETIDO"));
        assertTrue(pagamentoService.adiantamentosPendentes().contains(pagamentoId));

        pagamentoService.retentarAdiantamento(pagamentoId);

        mvc.perform(get("/api/fretes/{id}/pagamento", freteId).with(motorista))
                .andExpect(jsonPath("$.status").value("ADIANTAMENTO_LIBERADO"));
        assertFalse(pagamentoService.adiantamentosPendentes().contains(pagamentoId));
    }

    // ---------- auxiliares ----------

    private String freteAceitoCom40PorCento() throws Exception {
        String freteId = JsonPath.read(mvc.perform(post("/api/fretes/empresa/{id}", empresaId).with(empresa)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"coleta": {"cep": "01001-000"}, "entrega": {"cep": "01310-100"},
                                 "descricaoCarga": "Caixas", "especieCarga": "Diversos", "tipoCargaAntt": "CARGA_GERAL",
                                 "pesoKg": 5000, "valorACombinar": true, "dataColeta": "2099-03-10"}"""))
                .andReturn().getResponse().getContentAsString(), "$.id");
        String propostaId = JsonPath.read(mvc.perform(post("/api/fretes/{id}/propostas", freteId).with(motorista)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"veiculoId": "%s", "valor": 10000.00, "adiantamentoPercentual": 40}"""
                                .formatted(veiculoId)))
                .andReturn().getResponse().getContentAsString(), "$.id");
        mvc.perform(post("/api/propostas/{id}/aceite", propostaId).with(empresa)).andExpect(status().isOk());
        return freteId;
    }

    private String cobrancaDoPsp(String freteId) throws Exception {
        return JsonPath.read(mvc.perform(get("/api/fretes/{id}/pagamento", freteId).with(empresa))
                .andReturn().getResponse().getContentAsString(), "$.cobrancaId");
    }

    private static String webhook(String idEvento, String cobrancaId) {
        return """
                {"idEvento": "%s", "tipo": "%s", "cobrancaId": "%s"}"""
                .formatted(idEvento, GatewayPagamento.TipoNotificacao.PAGAMENTO_CONFIRMADO, cobrancaId);
    }
}
