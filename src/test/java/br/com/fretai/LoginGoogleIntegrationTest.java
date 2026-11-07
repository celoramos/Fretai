package br.com.fretai;

import br.com.fretai.shared.exception.CredenciaisInvalidasException;
import br.com.fretai.shared.seguranca.IdentidadeGoogle;
import br.com.fretai.shared.seguranca.VerificadorGoogle;
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

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Ponta a ponta com o banco: o Google é simulado, o resto (migration, entidade, segurança) é real. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Login e cadastro com Google")
class LoginGoogleIntegrationTest {

    @Autowired private MockMvc mvc;
    @MockitoBean private VerificadorGoogle verificadorGoogle;

    @BeforeEach
    void simularGoogle() {
        when(verificadorGoogle.verificar("token-nova")).thenReturn(new IdentidadeGoogle("sub-nova", "nova@gmail.com", "Rita Nova"));
        when(verificadorGoogle.verificar("token-ruim")).thenThrow(new CredenciaisInvalidasException("Não deu para confirmar sua conta Google."));
    }

    @Test
    @DisplayName("Sem conta: 404 com e-mail e nome; depois do cadastro com Google, entra e não tem senha")
    void cadastroEEntrada() throws Exception {
        mvc.perform(post("/api/auth/google").contentType(MediaType.APPLICATION_JSON).content("{\"credencial\":\"token-nova\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo").value("CADASTRO_NECESSARIO"))
                .andExpect(jsonPath("$.email").value("nova@gmail.com"))
                .andExpect(jsonPath("$.nome").value("Rita Nova"));

        // O e-mail digitado é ignorado: vale o que o Google verificou.
        mvc.perform(post("/api/motoristas").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cpf":"73184509214","nome":"Rita Nova","email":"outro@exemplo.com","telefone":"11988887777",
                         "tipoVeiculo":"CAMINHAO","placa":"GOO1G23","credencialGoogle":"token-nova"}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("nova@gmail.com"));

        mvc.perform(post("/api/auth/google").contentType(MediaType.APPLICATION_JSON).content("{\"credencial\":\"token-nova\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.papel").value("MOTORISTA"));

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nova@gmail.com\",\"senha\":\"qualquerCoisa1\"}"))
                .andExpect(status().isUnauthorized());

        // A mesma conta Google não abre um segundo cadastro.
        mvc.perform(post("/api/motoristas").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cpf":"60421738553","nome":"Outra","email":"x@exemplo.com","telefone":"11988887777",
                         "tipoVeiculo":"CAMINHAO","placa":"GOO2G34","credencialGoogle":"token-nova"}"""))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Credencial que o Google não confirma: 401")
    void credencialRuim() throws Exception {
        mvc.perform(post("/api/auth/google").contentType(MediaType.APPLICATION_JSON).content("{\"credencial\":\"token-ruim\"}"))
                .andExpect(status().isUnauthorized());
    }
}
