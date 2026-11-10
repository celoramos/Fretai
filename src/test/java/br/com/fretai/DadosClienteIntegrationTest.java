package br.com.fretai;

import br.com.fretai.support.Login;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** A tela "Meus dados" do cliente pessoa física: ele lê o próprio cadastro e corrige nome e telefone. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Dados do cliente pessoa física")
class DadosClienteIntegrationTest {

    @Autowired private MockMvc mvc;

    @Test
    @DisplayName("O cliente lê o próprio cadastro, sem CPF nem senha na resposta")
    void clienteLeOProprioCadastro() throws Exception {
        String id = cadastrarCliente("31847056253", "Juliana Matos", "juliana.dados@email.com", "(71) 98877-1234");

        mvc.perform(get("/api/clientes/{id}", id).with(Login.como(mvc, "juliana.dados@email.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.nome").value("Juliana Matos"))
                .andExpect(jsonPath("$.email").value("juliana.dados@email.com"))
                .andExpect(jsonPath("$.telefone").value("71988771234"))
                .andExpect(jsonPath("$.criadoEm").exists())
                .andExpect(jsonPath("$.cpf").doesNotExist())
                .andExpect(jsonPath("$.senha").doesNotExist())
                .andExpect(jsonPath("$.senhaHash").doesNotExist());
    }

    @Test
    @DisplayName("O cliente corrige nome e telefone; o menu da conta passa a mostrar o nome novo")
    void clienteCorrigeNomeETelefone() throws Exception {
        String id = cadastrarCliente("42758169355", "Paula Andrade", "paula.dados@email.com", "11999998888");
        RequestPostProcessor paula = Login.como(mvc, "paula.dados@email.com");

        mvc.perform(put("/api/clientes/{id}", id).with(paula).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\": \"  Paula Andrade Lima \", \"telefone\": \"(19) 98877-6655\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Paula Andrade Lima"))
                .andExpect(jsonPath("$.telefone").value("19988776655"))
                .andExpect(jsonPath("$.email").value("paula.dados@email.com"));

        // Gravou de verdade: uma leitura nova e o menu da conta trazem o que foi salvo.
        mvc.perform(get("/api/clientes/{id}", id).with(paula))
                .andExpect(jsonPath("$.nome").value("Paula Andrade Lima"))
                .andExpect(jsonPath("$.telefone").value("19988776655"));
        mvc.perform(get("/api/auth/eu").with(paula))
                .andExpect(jsonPath("$.nome").value("Paula Andrade Lima"));
    }

    @Test
    @DisplayName("Telefone inválido ou nome vazio → 400 com o erro no campo, e nada muda")
    void dadosInvalidos() throws Exception {
        String id = cadastrarCliente("53669270485", "Rita Souza", "rita.dados@email.com", "11999998888");
        RequestPostProcessor rita = Login.como(mvc, "rita.dados@email.com");

        mvc.perform(put("/api/clientes/{id}", id).with(rita).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\": \"Rita Souza\", \"telefone\": \"12345\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.telefone").value("Telefone inválido. Use DDD + número."));
        mvc.perform(put("/api/clientes/{id}", id).with(rita).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\": \" \", \"telefone\": \"11999998888\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.nome").exists());

        mvc.perform(get("/api/clientes/{id}", id).with(rita))
                .andExpect(jsonPath("$.nome").value("Rita Souza"))
                .andExpect(jsonPath("$.telefone").value("11999998888"));
    }

    @Test
    @DisplayName("Outra pessoa não lê nem edita o cadastro do cliente: 403, e sem token 401")
    void soOProprioCliente() throws Exception {
        String id = cadastrarCliente("64570381588", "Carla Dias", "carla.dados@email.com", "11999998888");
        cadastrarCliente("75481492636", "Outro Cliente", "outro.dados@email.com", "11977776666");
        cadastrarMotorista("86392503757", "motorista.dados@email.com", "DAD1A11");

        for (String intruso : new String[] {"outro.dados@email.com", "motorista.dados@email.com"}) {
            RequestPostProcessor logado = Login.como(mvc, intruso);
            mvc.perform(get("/api/clientes/{id}", id).with(logado))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.telefone").doesNotExist());
            mvc.perform(put("/api/clientes/{id}", id).with(logado).contentType(MediaType.APPLICATION_JSON)
                            .content("{\"nome\": \"Nome Trocado\", \"telefone\": \"11955554444\"}"))
                    .andExpect(status().isForbidden());
        }
        mvc.perform(get("/api/clientes/{id}", id)).andExpect(status().isUnauthorized());

        mvc.perform(get("/api/clientes/{id}", id).with(Login.como(mvc, "carla.dados@email.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Carla Dias"))
                .andExpect(jsonPath("$.telefone").value("11999998888"));
    }

    // ---------- auxiliares ----------

    private String cadastrarCliente(String cpf, String nome, String email, String telefone) throws Exception {
        String corpo = mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cpf": "%s", "nome": "%s", "email": "%s", "senha": "senhaForte1", "telefone": "%s"}
                        """.formatted(cpf, nome, email, telefone)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(corpo, "$.id");
    }

    private void cadastrarMotorista(String cpf, String email, String placa) throws Exception {
        mvc.perform(post("/api/motoristas").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cpf": "%s", "nome": "Motorista Teste", "email": "%s", "senha": "senhaForte1",
                         "telefone": "11988887777", "tipoVeiculo": "VAN", "placa": "%s"}
                        """.formatted(cpf, email, placa)))
                .andExpect(status().isCreated());
    }
}
