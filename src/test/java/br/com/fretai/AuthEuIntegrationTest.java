package br.com.fretai;

import br.com.fretai.support.Login;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** O menu da conta mostra o nome e o e-mail de quem está logado. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Quem está logado")
class AuthEuIntegrationTest {

    @Autowired private MockMvc mvc;

    @Test
    @DisplayName("GET /api/auth/eu traz o nome e o e-mail, além do id e do papel")
    void euTrazNomeEEmail() throws Exception {
        mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cpf": "14142135902", "nome": "Juliana Matos", "email": "juliana.eu@email.com",
                         "senha": "senhaForte1", "telefone": "(71) 98877-1234"}
                        """))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/auth/eu").with(Login.como(mvc, "juliana.eu@email.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.papel").value("CLIENTE"))
                .andExpect(jsonPath("$.nome").value("Juliana Matos"))
                .andExpect(jsonPath("$.email").value("juliana.eu@email.com"));
    }
}
