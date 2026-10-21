package br.com.fretai;

import br.com.fretai.calendario.domain.FeriadoGateway;
import br.com.fretai.empresa.domain.DadosCnpj;
import br.com.fretai.empresa.domain.EmpresaGateway;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.EnderecoGateway;
import br.com.fretai.endereco.domain.GeocodificacaoGateway;
import br.com.fretai.rota.domain.Rota;
import br.com.fretai.rota.domain.RotaGateway;
import br.com.fretai.support.Login;
import com.jayway.jsonpath.JsonPath;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Propostas: negociação, aceite e trilha de auditoria")
class PropostaIntegrationTest {

    @Autowired private MockMvc mvc;

    @MockitoBean private EnderecoGateway enderecoGateway;
    @MockitoBean private GeocodificacaoGateway geocodificacaoGateway;
    @MockitoBean private RotaGateway rotaGateway;
    @MockitoBean private FeriadoGateway feriadoGateway;
    @MockitoBean private EmpresaGateway empresaGateway;

    @BeforeEach
    void simularServicosExternos() {
        when(feriadoGateway.nacionaisDoAno(anyInt())).thenReturn(List.of());
        when(enderecoGateway.buscarPorCep(anyString()))
                .thenReturn(new Endereco("01001-000", "Praça da Sé", "Sé", "São Paulo", "SP"));
        when(geocodificacaoGateway.localizar(any(), any())).thenReturn(Optional.empty());
        when(rotaGateway.calcular(any(), any())).thenReturn(new Rota(new BigDecimal("430.0"), false));
        when(empresaGateway.buscarPorCnpj(anyString())).thenAnswer(i -> new DadosCnpj(
                i.getArgument(0), "Embarcadora Teste Ltda", null, "ATIVA", LocalDate.of(2000, 1, 1),
                "Indústria", "São Paulo", "SP", "01001000"));
    }

    @Test
    @DisplayName("Dois motoristas propõem; empresa aceita um; o outro é recusado; histórico registra tudo")
    void negociacao() throws Exception {
        String empresaId = cadastrarEmpresa("70004073773853", "16123456890", "neg@empresa.com");
        RequestPostProcessor empresa = Login.como(mvc, "neg@empresa.com");
        String m1 = cadastrarMotorista("16888888967", "neg1@email.com", "NEG1A11");
        String m2 = cadastrarMotorista("17654321031", "neg2@email.com", "NEG2A22");
        RequestPostProcessor motorista1 = Login.como(mvc, "neg1@email.com");
        RequestPostProcessor motorista2 = Login.como(mvc, "neg2@email.com");
        String carreta1 = cadastrarVeiculo(m1, motorista1, "CAR1A11", "CARRETA", "SIDER");
        String carreta2 = cadastrarVeiculo(m2, motorista2, "CAR2A22", "CARRETA", "SIDER");
        String freteId = publicarACombinar(empresaId, empresa);

        String p1 = proporComoMotorista(freteId, motorista1, carreta1, "7000.00", "40");
        mvc.perform(get("/api/fretes/{id}", freteId).with(empresa))
                .andExpect(jsonPath("$.status").value("PROPOSTA_ENVIADA"));
        String p2 = proporComoMotorista(freteId, motorista2, carreta2, "6500.00", "0");

        // Um motorista não vê a proposta do outro; a empresa vê as duas.
        mvc.perform(get("/api/fretes/{id}/propostas", freteId).with(motorista1))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(p1));
        mvc.perform(get("/api/fretes/{id}/propostas", freteId).with(empresa))
                .andExpect(jsonPath("$.length()").value(2));

        // Quem propôs não aceita a própria proposta.
        mvc.perform(post("/api/propostas/{id}/aceite", p1).with(motorista1)).andExpect(status().isForbidden());

        mvc.perform(post("/api/propostas/{id}/aceite", p1).with(empresa))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACEITA"))
                .andExpect(jsonPath("$.valorAdiantamento").value(2800.00));

        mvc.perform(get("/api/fretes/{id}", freteId).with(empresa))
                .andExpect(jsonPath("$.status").value("ACEITO"))
                .andExpect(jsonPath("$.motorista.id").value(m1))
                .andExpect(jsonPath("$.veiculo.placa").value("CAR1A11"))
                .andExpect(jsonPath("$.valorAcordado").value(7000.00))
                .andExpect(jsonPath("$.adiantamentoPercentual").value(40.00));

        mvc.perform(get("/api/propostas/minhas").with(motorista2))
                .andExpect(jsonPath("$.content[0].id").value(p2))
                .andExpect(jsonPath("$.content[0].status").value("RECUSADA"));

        mvc.perform(get("/api/fretes/{id}/eventos", freteId).with(motorista1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].para").value(org.hamcrest.Matchers.contains(
                        "PUBLICADO", "PROPOSTA_ENVIADA", "ACEITO")))
                .andExpect(jsonPath("$[1].autorPapel").value("MOTORISTA"))
                .andExpect(jsonPath("$[2].autorPapel").value("EMPRESA"));
        // Quem não participou do frete não vê a trilha.
        mvc.perform(get("/api/fretes/{id}/eventos", freteId).with(motorista2)).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Retirar a única proposta devolve o frete para PUBLICADO")
    void retirada() throws Exception {
        String empresaId = cadastrarEmpresa("70005431698450", "18419753114", "ret@empresa.com");
        RequestPostProcessor empresa = Login.como(mvc, "ret@empresa.com");
        String m = cadastrarMotorista("19185185213", "ret@email.com", "RET1A11");
        RequestPostProcessor motorista = Login.como(mvc, "ret@email.com");
        String carreta = cadastrarVeiculo(m, motorista, "RET2B22", "CARRETA", "BAU");
        String freteId = publicarACombinar(empresaId, empresa);

        String p = proporComoMotorista(freteId, motorista, carreta, "5000.00", "20");
        // Uma proposta aberta por motorista por frete.
        mvc.perform(post("/api/fretes/{id}/propostas", freteId).with(motorista).contentType(MediaType.APPLICATION_JSON)
                        .content(propostaJson(carreta, "4900.00", "20")))
                .andExpect(status().isConflict());

        mvc.perform(post("/api/propostas/{id}/retirada", p).with(empresa)).andExpect(status().isForbidden());
        mvc.perform(post("/api/propostas/{id}/retirada", p).with(motorista))
                .andExpect(jsonPath("$.status").value("RETIRADA"));
        mvc.perform(get("/api/fretes/{id}", freteId).with(empresa))
                .andExpect(jsonPath("$.status").value("PUBLICADO"));
    }

    @Test
    @DisplayName("Empresa propõe a um motorista; ele aceita dizendo o caminhão; caminhão incompatível → 422")
    void propostaDaEmpresa() throws Exception {
        String empresaId = cadastrarEmpresa("70006789623065", "19950617359", "conv@empresa.com");
        RequestPostProcessor empresa = Login.como(mvc, "conv@empresa.com");
        String m = cadastrarMotorista("20716049465", "conv@email.com", "CON1A11");
        RequestPostProcessor motorista = Login.como(mvc, "conv@email.com");
        String truck = cadastrarVeiculo(m, motorista, "TRU1A11", "TRUCK", "BAU");
        String carreta = cadastrarVeiculo(m, motorista, "CON2B22", "CARRETA", "BAU");
        String freteId = publicarACombinar(empresaId, empresa);

        String p = JsonPath.read(mvc.perform(post("/api/fretes/{id}/propostas", freteId).with(empresa)
                                .contentType(MediaType.APPLICATION_JSON).content("""
                                        {"motoristaId": "%s", "valor": 8000.00, "adiantamentoPercentual": 50,
                                         "prazoEntrega": "2099-03-15"}""".formatted(m)))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.autorPapel").value("EMPRESA"))
                        .andReturn().getResponse().getContentAsString(), "$.id");

        mvc.perform(post("/api/propostas/{id}/aceite", p).with(motorista).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"veiculoId\": \"%s\"}".formatted(truck)))
                .andExpect(status().isUnprocessableContent());
        mvc.perform(post("/api/propostas/{id}/aceite", p).with(motorista).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"veiculoId\": \"%s\"}".formatted(carreta)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/fretes/{id}", freteId).with(motorista))
                .andExpect(jsonPath("$.status").value("ACEITO"))
                .andExpect(jsonPath("$.prazoEntrega").value("2099-03-15"));
    }

    // ---------- auxiliares ----------

    private String publicarACombinar(String empresaId, RequestPostProcessor empresa) throws Exception {
        return JsonPath.read(mvc.perform(post("/api/fretes/empresa/{id}", empresaId).with(empresa)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"coleta":  {"cep": "01001-000", "latitude": -23.55, "longitude": -46.63},
                                 "entrega": {"cep": "20040-002", "latitude": -22.90, "longitude": -43.17},
                                 "descricaoCarga": "Paletes", "especieCarga": "Cerâmica",
                                 "tipoCargaAntt": "CARGA_GERAL", "pesoKg": 20000, "valorACombinar": true,
                                 "dataColeta": "2099-03-10", "veiculosAceitos": ["CARRETA"]}"""))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(), "$.id");
    }

    private static String propostaJson(String veiculoId, String valor, String adiantamento) {
        return """
                {"veiculoId": "%s", "valor": %s, "adiantamentoPercentual": %s, "prazoEntrega": "2099-03-14"}
                """.formatted(veiculoId, valor, adiantamento);
    }

    private String proporComoMotorista(String freteId, RequestPostProcessor motorista, String veiculoId,
                                       String valor, String adiantamento) throws Exception {
        return JsonPath.read(mvc.perform(post("/api/fretes/{id}/propostas", freteId).with(motorista)
                        .contentType(MediaType.APPLICATION_JSON).content(propostaJson(veiculoId, valor, adiantamento)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(), "$.id");
    }

    private String cadastrarEmpresa(String cnpj, String cpf, String email) throws Exception {
        return JsonPath.read(mvc.perform(post("/api/empresas").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cnpj": "%s", "tipo": "EMBARCADOR", "telefone": "1133334444",
                         "responsavel": {"cpf": "%s", "nome": "Responsável", "email": "%s",
                                         "senha": "senhaForte1", "telefone": "11999998888"}}
                        """.formatted(cnpj, cpf, email)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(), "$.id");
    }

    private String cadastrarMotorista(String cpf, String email, String placa) throws Exception {
        return JsonPath.read(mvc.perform(post("/api/motoristas").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cpf": "%s", "nome": "Motorista %s", "email": "%s", "senha": "senhaForte1",
                         "telefone": "11988887777", "tipoVeiculo": "CAMINHAO", "placa": "%s"}
                        """.formatted(cpf, placa, email, placa)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(), "$.id");
    }

    private String cadastrarVeiculo(String motoristaId, RequestPostProcessor motorista, String placa, String tipo,
                                    String carroceria) throws Exception {
        return JsonPath.read(mvc.perform(post("/api/motoristas/{id}/veiculos", motoristaId).with(motorista)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"placa": "%s", "rntrc": "12345678", "tipo": "%s", "carroceria": "%s",
                                 "numeroEixos": 5, "rastreador": true}""".formatted(placa, tipo, carroceria)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(), "$.id");
    }
}
