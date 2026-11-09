package br.com.fretai;

import br.com.fretai.auth.domain.CorreioSenha;
import com.jayway.jsonpath.JsonPath;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Esqueci a senha: um link de uso único, que vence, troca a senha e derruba as sessões de antes. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Senha nova por link")
class SenhaNovaIntegrationTest {

    private static final String LINK_INVALIDO = "Este link não vale mais. Peça outro na tela de entrar.";

    @Autowired private MockMvc mvc;
    @Autowired private JdbcTemplate jdbc;

    @MockitoBean private CorreioSenha correio;

    @Test
    @DisplayName("E-mail sem conta: 204 do mesmo jeito, e nada é enviado")
    void emailSemContaResponde204ENaoManda() throws Exception {
        pedirLink("ninguem.aqui@email.com").andExpect(status().isNoContent());
        verify(correio, never()).enviarLink(any(), any(), any());
    }

    @Test
    @DisplayName("O link troca a senha: a nova entra, a antiga não")
    void linkTrocaASenha() throws Exception {
        cadastrarCliente("16180340900", "troca@email.com");
        String token = tokenDoLink("troca@email.com");

        definirSenha(token, "outraSenha9").andExpect(status().isNoContent());

        entrar("troca@email.com", "outraSenha9").andExpect(status().isOk());
        entrar("troca@email.com", "senhaForte1").andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("O link vale uma vez só")
    void linkSoValeUmaVez() throws Exception {
        cadastrarCliente("16180341036", "uma.vez@email.com");
        String token = tokenDoLink("uma.vez@email.com");
        definirSenha(token, "outraSenha9").andExpect(status().isNoContent());

        definirSenha(token, "terceiraSenha9")
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.detail").value(LINK_INVALIDO));
    }

    @Test
    @DisplayName("Link vencido não troca a senha")
    void linkVencido() throws Exception {
        cadastrarCliente("16180341117", "vencido@email.com");
        String token = tokenDoLink("vencido@email.com");
        jdbc.update("UPDATE token_senha SET expira_em = ? WHERE usado_em IS NULL",
                Timestamp.from(Instant.now().minus(1, ChronoUnit.MINUTES)));

        definirSenha(token, "outraSenha9")
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.detail").value(LINK_INVALIDO));
    }

    @Test
    @DisplayName("Senha curta: 400 no campo")
    void senhaCurta() throws Exception {
        definirSenha("qualquer", "123")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.senha").value("A senha deve ter entre 8 e 72 caracteres."));
    }

    @Test
    @DisplayName("Trocar a senha derruba as sessões abertas")
    void trocaDeSenhaDerrubaAsSessoes() throws Exception {
        cadastrarCliente("16180341389", "sessao.senha@email.com");
        String refresh = JsonPath.read(entrar("sessao.senha@email.com", "senhaForte1")
                .andReturn().getResponse().getContentAsString(), "$.refreshToken");
        definirSenha(tokenDoLink("sessao.senha@email.com"), "outraSenha9").andExpect(status().isNoContent());

        mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\": \"%s\"}".formatted(refresh)))
                .andExpect(status().isUnauthorized());
    }

    private String tokenDoLink(String email) throws Exception {
        pedirLink(email).andExpect(status().isNoContent());
        ArgumentCaptor<String> link = ArgumentCaptor.forClass(String.class);
        verify(correio).enviarLink(eq(email), anyString(), link.capture());
        return link.getValue().substring(link.getValue().indexOf("token=") + "token=".length());
    }

    private ResultActions pedirLink(String email) throws Exception {
        return mvc.perform(post("/api/auth/senha/link").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"%s\"}".formatted(email)));
    }

    private ResultActions definirSenha(String token, String senha) throws Exception {
        return mvc.perform(post("/api/auth/senha/nova").contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\": \"%s\", \"senha\": \"%s\"}".formatted(token, senha)));
    }

    private ResultActions entrar(String email, String senha) throws Exception {
        return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"%s\", \"senha\": \"%s\"}".formatted(email, senha)));
    }

    private void cadastrarCliente(String cpf, String email) throws Exception {
        mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cpf": "%s", "nome": "Juliana Matos", "email": "%s",
                         "senha": "senhaForte1", "telefone": "(71) 98877-1234"}
                        """.formatted(cpf, email)))
                .andExpect(status().isCreated());
    }
}
