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
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Segurança: login, refresh token, limite de tentativas e dono do recurso")
class SegurancaIntegrationTest {

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
                i.getArgument(0), "Empresa Teste Ltda", null, "ATIVA", LocalDate.of(2000, 1, 1),
                "Transporte", "São Paulo", "SP", "01001000"));
    }

    @Test
    @DisplayName("Sem token → 401 em ProblemDetail; rotas públicas continuam abertas")
    void semToken() throws Exception {
        mvc.perform(get("/api/fretes"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string(HttpHeaders.WWW_AUTHENTICATE, "Bearer"))
                .andExpect(jsonPath("$.title").value("Não autenticado"));
        mvc.perform(get("/api/fretes").header(HttpHeaders.AUTHORIZATION, "Bearer token-forjado"))
                .andExpect(status().isUnauthorized());

        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Login devolve papel; senha errada → 401 com a mesma mensagem de e-mail inexistente")
    void login() throws Exception {
        cadastrarMotorista("10765432196", "login@email.com", "LOG1A11");

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"LOGIN@email.com\", \"senha\": \"senhaForte1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.papel").value("MOTORISTA"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(900));

        String senhaErrada = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"login@email.com\", \"senha\": \"errada123\"}"))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        String emailInexistente = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"ninguem@email.com\", \"senha\": \"errada123\"}"))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        org.junit.jupiter.api.Assertions.assertEquals(
                (String) JsonPath.read(senhaErrada, "$.detail"), JsonPath.read(emailInexistente, "$.detail"));
    }

    @Test
    @DisplayName("5 senhas erradas → 429 com Retry-After, mesmo acertando a senha depois")
    void limiteDeTentativas() throws Exception {
        cadastrarMotorista("11530864259", "forca@email.com", "FOR1A11");
        for (int i = 0; i < 5; i++) {
            mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\": \"forca@email.com\", \"senha\": \"chute%d00\"}".formatted(i)))
                    .andExpect(status().isUnauthorized());
        }

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"forca@email.com\", \"senha\": \"senhaForte1\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists(HttpHeaders.RETRY_AFTER));
    }

    @Test
    @DisplayName("Refresh troca o par de tokens; reusar o antigo derruba todas as sessões")
    void refreshComRotacao() throws Exception {
        cadastrarMotorista("12296296378", "sessao@email.com", "SES1A11");
        String login = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"sessao@email.com\", \"senha\": \"senhaForte1\"}"))
                .andReturn().getResponse().getContentAsString();
        String refresh1 = JsonPath.read(login, "$.refreshToken");

        String renovado = mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\": \"%s\"}".formatted(refresh1)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String refresh2 = JsonPath.read(renovado, "$.refreshToken");
        assertNotEquals(refresh1, refresh2);

        // Alguém reaproveita o token velho (vazou): 401, e o novo também deixa de valer.
        mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\": \"%s\"}".formatted(refresh1)))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\": \"%s\"}".formatted(refresh2)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Empresa só edita os próprios fretes e não publica em nome de outra")
    void empresaSoMexeNoQueEDela() throws Exception {
        String empresaA = cadastrarEmpresa("70001357924690", "13061728457", "a@empresa.com");
        String empresaB = cadastrarEmpresa("70002715849296", "13827160529", "b@empresa.com");
        RequestPostProcessor a = Login.como(mvc, "a@empresa.com");
        RequestPostProcessor b = Login.como(mvc, "b@empresa.com");

        String freteDeA = JsonPath.read(mvc.perform(post("/api/fretes/empresa/{id}", empresaA).with(a)
                        .contentType(MediaType.APPLICATION_JSON).content(FRETE))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(), "$.id");

        mvc.perform(put("/api/fretes/{id}", freteDeA).with(b).contentType(MediaType.APPLICATION_JSON).content(FRETE))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.title").value("Acesso negado"));
        mvc.perform(post("/api/fretes/empresa/{id}", empresaA).with(b)
                        .contentType(MediaType.APPLICATION_JSON).content(FRETE))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/empresas/{id}", empresaA).with(b).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"telefone\": \"1133330000\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/fretes/empresa/{id}", empresaB).with(b)).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Motorista não lista outros motoristas nem edita perfil alheio")
    void motorista() throws Exception {
        String m1 = cadastrarMotorista("14592592620", "m1@email.com", "MMM1A11");
        String m2 = cadastrarMotorista("15358024727", "m2@email.com", "MMM2A22");
        RequestPostProcessor logado = Login.como(mvc, "m1@email.com");

        mvc.perform(get("/api/motoristas").with(logado)).andExpect(status().isForbidden());
        mvc.perform(put("/api/motoristas/{id}", m2).with(logado).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\": \"Outro Nome\", \"telefone\": \"11977776666\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/motoristas/{id}", m1).with(logado).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\": \"Novo Nome\", \"telefone\": \"11977776666\"}"))
                .andExpect(status().isOk());
    }

    // ---------- auxiliares ----------

    private static final String FRETE = """
            {"coleta":  {"cep": "01001-000", "latitude": -23.55, "longitude": -46.63},
             "entrega": {"cep": "20040-002", "latitude": -22.90, "longitude": -43.17},
             "descricaoCarga": "Paletes", "especieCarga": "Cerâmica", "tipoCargaAntt": "CARGA_GERAL",
             "pesoKg": 20000, "valor": 5000.00, "dataColeta": "2099-03-10"}
            """;

    private String cadastrarEmpresa(String cnpj, String cpf, String email) throws Exception {
        String corpo = mvc.perform(post("/api/empresas").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cnpj": "%s", "tipo": "EMBARCADOR", "telefone": "1133334444",
                         "responsavel": {"cpf": "%s", "nome": "Responsável", "email": "%s",
                                         "senha": "senhaForte1", "telefone": "11999998888"}}
                        """.formatted(cnpj, cpf, email)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(corpo, "$.id");
    }

    private String cadastrarMotorista(String cpf, String email, String placa) throws Exception {
        String corpo = mvc.perform(post("/api/motoristas").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cpf": "%s", "nome": "Motorista Teste", "email": "%s", "senha": "senhaForte1",
                         "telefone": "11988887777", "tipoVeiculo": "CAMINHAO", "placa": "%s"}
                        """.formatted(cpf, email, placa)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(corpo, "$.id");
    }
}
