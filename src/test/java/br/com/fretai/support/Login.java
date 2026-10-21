package br.com.fretai.support;

import com.jayway.jsonpath.JsonPath;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Faz login de verdade pela API e devolve o cabeçalho Authorization para as próximas chamadas. */
public final class Login {

    public static final String SENHA = "senhaForte1";

    private Login() {
    }

    public static RequestPostProcessor como(MockMvc mvc, String email) throws Exception {
        return como(mvc, email, SENHA);
    }

    public static RequestPostProcessor como(MockMvc mvc, String email, String senha) throws Exception {
        String corpo = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"%s\", \"senha\": \"%s\"}".formatted(email, senha)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = JsonPath.read(corpo, "$.accessToken");
        return request -> {
            request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token);
            return request;
        };
    }
}
