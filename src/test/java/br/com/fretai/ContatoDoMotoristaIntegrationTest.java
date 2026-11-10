package br.com.fretai;

import br.com.fretai.empresa.domain.DadosCnpj;
import br.com.fretai.empresa.domain.EmpresaGateway;
import br.com.fretai.support.Login;
import com.jayway.jsonpath.JsonPath;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * O telefone do motorista só sai da API pelo contato do frete, depois do aceite. O cadastro dele não pode
 * ser um atalho para isso: quem não é ele (nem administrador) não lê telefone nem e-mail.
 */
@SpringBootTest(properties = {
        "fretai.admin.email=admin.contato@fretai.dev", "fretai.admin.senha=senhaDoAdmin123",
        "fretai.admin.cpf=53197420888"})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Telefone e e-mail do motorista fora do frete")
class ContatoDoMotoristaIntegrationTest {

    @Autowired private MockMvc mvc;

    @MockitoBean private EmpresaGateway empresaGateway;

    @BeforeEach
    void simularReceita() {
        when(empresaGateway.buscarPorCnpj(anyString())).thenAnswer(i -> new DadosCnpj(
                i.getArgument(0), "Curiosa Transportes Ltda", null, "ATIVA", LocalDate.of(2000, 1, 1),
                "Transporte", "São Paulo", "SP", "01001000"));
    }

    @Test
    @DisplayName("O cadastro do motorista só abre para ele e para o administrador")
    void cadastroSoParaEleEParaOAdministrador() throws Exception {
        String alvo = cadastrarMotorista("19753086466", "alvo.contato@email.com", "ALV1A11");
        cadastrarMotorista("20864197594", "outro.contato@email.com", "PRV1A11");
        cadastrarCliente("31975208668", "cliente.contato@email.com");
        cadastrarEmpresa("70015123450039", "42086319703", "empresa.contato@email.com");

        for (String curioso : new String[] {"outro.contato@email.com", "cliente.contato@email.com",
                "empresa.contato@email.com"}) {
            mvc.perform(get("/api/motoristas/{id}", alvo).with(Login.como(mvc, curioso)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.telefone").doesNotExist())
                    .andExpect(jsonPath("$.email").doesNotExist());
        }

        mvc.perform(get("/api/motoristas/{id}", alvo).with(Login.como(mvc, "alvo.contato@email.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.telefone").value("11988887777"))
                .andExpect(jsonPath("$.email").value("alvo.contato@email.com"));
        mvc.perform(get("/api/motoristas/{id}", alvo).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.telefone").value("11988887777"));
    }

    @Test
    @DisplayName("A empresa lista os motoristas sem telefone nem e-mail; o administrador vê os dois")
    void listaSemContatoParaAEmpresa() throws Exception {
        String alvo = cadastrarMotorista("64208531924", "lista.contato@email.com", "ALV2B22");
        cadastrarEmpresa("70016234560086", "75319642016", "lista.empresa.contato@email.com");
        // O mais novo primeiro: o motorista deste teste cai na primeira página, por mais que o banco tenha outros.
        String url = "/api/motoristas?sort=criadoEm,desc&size=100";

        String daEmpresa = mvc.perform(get(url).with(Login.como(mvc, "lista.empresa.contato@email.com")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<String> ids = JsonPath.read(daEmpresa, "$.content[*].id");
        assertTrue(ids.contains(alvo), "a empresa continua vendo quem está na plataforma");
        List<String> nomes = JsonPath.read(daEmpresa, "$.content[?(@.id == '%s')].nome".formatted(alvo));
        assertEquals(List.of("Motorista Teste"), nomes);
        List<Object> telefones = JsonPath.read(daEmpresa, "$.content[*].telefone");
        List<Object> emails = JsonPath.read(daEmpresa, "$.content[*].email");
        assertTrue(telefones.stream().allMatch(Objects::isNull), "nenhum telefone na lista da empresa: " + telefones);
        assertTrue(emails.stream().allMatch(Objects::isNull), "nenhum e-mail na lista da empresa: " + emails);

        String doAdmin = mvc.perform(get(url).with(admin()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<String> telefoneDoAlvo = JsonPath.read(doAdmin, "$.content[?(@.id == '%s')].telefone".formatted(alvo));
        List<String> emailDoAlvo = JsonPath.read(doAdmin, "$.content[?(@.id == '%s')].email".formatted(alvo));
        assertEquals(List.of("11988887777"), telefoneDoAlvo);
        assertEquals(List.of("lista.contato@email.com"), emailDoAlvo);
        assertFalse(ids.isEmpty());
    }

    // ---------- auxiliares ----------

    private RequestPostProcessor admin() throws Exception {
        return Login.como(mvc, "admin.contato@fretai.dev", "senhaDoAdmin123");
    }

    private String cadastrarMotorista(String cpf, String email, String placa) throws Exception {
        String corpo = mvc.perform(post("/api/motoristas").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cpf": "%s", "nome": "Motorista Teste", "email": "%s", "senha": "senhaForte1",
                         "telefone": "(11) 98888-7777", "tipoVeiculo": "VAN", "placa": "%s"}
                        """.formatted(cpf, email, placa)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(corpo, "$.id");
    }

    private void cadastrarCliente(String cpf, String email) throws Exception {
        mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cpf": "%s", "nome": "Cliente Teste", "email": "%s", "senha": "senhaForte1",
                         "telefone": "11999998888"}
                        """.formatted(cpf, email)))
                .andExpect(status().isCreated());
    }

    private void cadastrarEmpresa(String cnpj, String cpf, String email) throws Exception {
        mvc.perform(post("/api/empresas").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cnpj": "%s", "tipo": "EMBARCADOR", "telefone": "1133334444",
                         "responsavel": {"cpf": "%s", "nome": "Responsável", "email": "%s",
                                         "senha": "senhaForte1", "telefone": "11999998888"}}
                        """.formatted(cnpj, cpf, email)))
                .andExpect(status().isCreated());
    }
}
