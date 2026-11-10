package br.com.fretai;

import br.com.fretai.endereco.domain.CepNaoEncontradoException;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.EnderecoGateway;
import br.com.fretai.support.Login;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** O pedido de frete mostra "bairro, cidade" logo depois que a pessoa digita o CEP. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Consulta de CEP")
class ConsultaCepIntegrationTest {

    @Autowired private MockMvc mvc;

    @MockitoBean private EnderecoGateway enderecoGateway;

    private void cliente(String cpf, String email) throws Exception {
        mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cpf": "%s", "nome": "Juliana Matos", "email": "%s",
                         "senha": "senhaForte1", "telefone": "(71) 98877-1234"}
                        """.formatted(cpf, email)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("CEP conhecido: bairro, cidade e UF")
    void cepConhecido() throws Exception {
        cliente("57721566401", "cep.ok@email.com");
        when(enderecoGateway.buscarPorCep("41810-000"))
                .thenReturn(new Endereco("41810-000", "Av. Paulo VI", "Pituba", "Salvador", "BA"));

        mvc.perform(get("/api/enderecos/cep/41810-000").with(Login.como(mvc, "cep.ok@email.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cep").value("41810-000"))
                .andExpect(jsonPath("$.logradouro").value("Av. Paulo VI"))
                .andExpect(jsonPath("$.bairro").value("Pituba"))
                .andExpect(jsonPath("$.cidade").value("Salvador"))
                .andExpect(jsonPath("$.uf").value("BA"));
    }

    @Test
    @DisplayName("CEP que não existe: 422")
    void cepQueNaoExiste() throws Exception {
        cliente("66260701500", "cep.nao@email.com");
        when(enderecoGateway.buscarPorCep("99999-999")).thenThrow(new CepNaoEncontradoException("CEP não encontrado."));

        mvc.perform(get("/api/enderecos/cep/99999-999").with(Login.como(mvc, "cep.nao@email.com")))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @DisplayName("Sem login: 401")
    void semLogin() throws Exception {
        mvc.perform(get("/api/enderecos/cep/41810-000")).andExpect(status().isUnauthorized());
    }
}
