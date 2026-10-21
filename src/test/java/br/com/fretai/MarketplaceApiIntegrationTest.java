package br.com.fretai;

import br.com.fretai.calendario.domain.FeriadoGateway;
import br.com.fretai.empresa.domain.DadosCnpj;
import br.com.fretai.empresa.domain.EmpresaGateway;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.EnderecoGateway;
import br.com.fretai.endereco.domain.GeocodificacaoGateway;
import br.com.fretai.rota.domain.Rota;
import br.com.fretai.rota.domain.RotaGateway;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** CRUD do marketplace pela API, contra o H2 com as migrations reais. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("API do marketplace: empresas, veículos e fretes publicados")
class MarketplaceApiIntegrationTest {

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
                EmpresaGateway.normalizarCnpj(i.getArgument(0)), "Transportes Teste Ltda", null, "ATIVA",
                LocalDate.of(2000, 1, 1), "Transporte", "São Paulo", "SP", "01001000"));
    }

    @Test
    @DisplayName("Empresa: cadastra, busca por id, consulta CNPJ na Receita, edita e desativa")
    void crudEmpresa() throws Exception {
        String id = cadastrarEmpresa("10101010000177", "AGENCIADOR", "12312312387", "agencia@email.com");

        mvc.perform(get("/api/empresas/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("AGENCIADOR"))
                .andExpect(jsonPath("$.razaoSocial").value("Transportes Teste Ltda"));

        // Mesma raiz de URL, formato de CNPJ: vai para a consulta da Receita.
        mvc.perform(get("/api/empresas/{cnpj}", "10101010000177"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.situacaoCadastral").value("ATIVA"));

        mvc.perform(put("/api/empresas/{id}", id).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nomeFantasia\": \"Agência Rápida\", \"telefone\": \"11 3333-0000\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nomeFantasia").value("Agência Rápida"));

        mvc.perform(delete("/api/empresas/{id}", id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/empresas/{id}", id)).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("CNPJ repetido → 409")
    void cnpjRepetido() throws Exception {
        cadastrarEmpresa("20202020000152", "EMBARCADOR", "23423423498", "um@email.com");

        mvc.perform(post("/api/empresas").contentType(MediaType.APPLICATION_JSON)
                        .content(empresaJson("20.202.020/0001-52", "EMBARCADOR", "34534534507", "dois@email.com")))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Veículo: cadastra, lista, edita, exclui; de outro motorista é 404")
    void crudVeiculo() throws Exception {
        String motoristaId = cadastrarMotorista("45645645600", "caminhoneiro@email.com", "CAM1A11");
        String outroMotorista = cadastrarMotorista("56756756710", "outro@email.com", "OUT1A11");

        String veiculoId = JsonPath.read(mvc.perform(post("/api/motoristas/{id}/veiculos", motoristaId)
                                .contentType(MediaType.APPLICATION_JSON).content(veiculoJson("BIT2B22", 7)))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.tipo").value("BITREM"))
                        .andReturn().getResponse().getContentAsString(), "$.id");

        mvc.perform(get("/api/motoristas/{id}/veiculos", motoristaId))
                .andExpect(jsonPath("$.length()").value(1));
        mvc.perform(put("/api/motoristas/{m}/veiculos/{v}", motoristaId, veiculoId)
                        .contentType(MediaType.APPLICATION_JSON).content(veiculoJson("BIT2B22", 9)))
                .andExpect(jsonPath("$.numeroEixos").value(9));
        mvc.perform(get("/api/motoristas/{m}/veiculos/{v}", outroMotorista, veiculoId))
                .andExpect(status().isNotFound());

        mvc.perform(delete("/api/motoristas/{m}/veiculos/{v}", motoristaId, veiculoId))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/motoristas/{id}/veiculos", motoristaId))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("Frete de empresa: publica, lista paginado, edita; valor e 'a combinar' são exclusivos")
    void freteDeEmpresa() throws Exception {
        String empresaId = cadastrarEmpresa("30303030000138", "EMBARCADOR", "67867867821", "embarcador@email.com");

        String freteId = JsonPath.read(mvc.perform(post("/api/fretes/empresa/{id}", empresaId)
                                .contentType(MediaType.APPLICATION_JSON).content(freteJson("8500.00", false)))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.empresa.id").value(empresaId))
                        .andExpect(jsonPath("$.cliente").doesNotExist())
                        .andExpect(jsonPath("$.tipoCargaAntt").value("GRANEL_SOLIDO"))
                        .andExpect(jsonPath("$.veiculosAceitos[0]").value("BITREM"))
                        .andExpect(jsonPath("$.coleta.latitude").value(-23.55))
                        .andExpect(jsonPath("$.distanciaKm").value(430.0))
                        .andReturn().getResponse().getContentAsString(), "$.id");

        mvc.perform(get("/api/fretes/empresa/{id}", empresaId).param("size", "1").param("sort", "criadoEm,desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(freteId))
                .andExpect(jsonPath("$.page.size").value(1));

        mvc.perform(put("/api/fretes/{id}", freteId).contentType(MediaType.APPLICATION_JSON)
                        .content(freteJson(null, true)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valorACombinar").value(true))
                .andExpect(jsonPath("$.valor").doesNotExist());

        mvc.perform(post("/api/fretes/empresa/{id}", empresaId).contentType(MediaType.APPLICATION_JSON)
                        .content(freteJson("8500.00", true)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.valorCoerente").exists());
    }

    @Test
    @DisplayName("Ordenar por campo inexistente → 400, não 500")
    void ordenacaoInvalida() throws Exception {
        mvc.perform(get("/api/empresas").param("sort", "naoExiste"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Ordenação inválida"));
    }

    // ---------- auxiliares ----------

    private static String empresaJson(String cnpj, String tipo, String cpf, String email) {
        return """
                {"cnpj": "%s", "tipo": "%s", "telefone": "1133334444",
                 "responsavel": {"cpf": "%s", "nome": "Responsável", "email": "%s",
                                 "senha": "senhaForte1", "telefone": "11999998888"}}
                """.formatted(cnpj, tipo, cpf, email);
    }

    private String cadastrarEmpresa(String cnpj, String tipo, String cpf, String email) throws Exception {
        String corpo = mvc.perform(post("/api/empresas").contentType(MediaType.APPLICATION_JSON)
                        .content(empresaJson(cnpj, tipo, cpf, email)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(corpo, "$.id");
    }

    private String cadastrarMotorista(String cpf, String email, String placa) throws Exception {
        String corpo = mvc.perform(post("/api/motoristas").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cpf": "%s", "nome": "José Estradeiro", "email": "%s", "senha": "senhaForte1",
                         "telefone": "11988887777", "tipoVeiculo": "CAMINHAO", "placa": "%s"}
                        """.formatted(cpf, email, placa)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(corpo, "$.id");
    }

    private static String veiculoJson(String placa, int eixos) {
        return """
                {"placa": "%s", "rntrc": "12345678", "tipo": "BITREM", "carroceria": "GRANELEIRO",
                 "numeroEixos": %d, "rastreador": true}
                """.formatted(placa, eixos);
    }

    private static String freteJson(String valor, boolean aCombinar) {
        return """
                {"coleta":  {"cep": "01001-000", "numero": "100", "latitude": -23.55, "longitude": -46.63},
                 "entrega": {"cep": "20040-002", "numero": "50", "latitude": -22.90, "longitude": -43.17},
                 "descricaoCarga": "Soja a granel", "especieCarga": "Soja", "tipoCargaAntt": "GRANEL_SOLIDO",
                 "pesoKg": 37000, "valor": %s, "valorACombinar": %s, "dataColeta": "2099-03-10",
                 "veiculosAceitos": ["BITREM"], "carroceriasAceitas": ["GRANELEIRO"],
                 "exigeRastreador": true, "complemento": false}
                """.formatted(valor, aCombinar);
    }
}
