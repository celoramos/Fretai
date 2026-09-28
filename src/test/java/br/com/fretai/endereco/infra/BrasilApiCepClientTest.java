package br.com.fretai.endereco.infra;

import br.com.fretai.endereco.domain.CepNaoEncontradoException;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.ServicoCepIndisponivelException;
import br.com.fretai.support.ServidorHttpFalso;
import java.time.Duration;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("BrasilAPI: CEP")
class BrasilApiCepClientTest {

    private final ServidorHttpFalso servidor = new ServidorHttpFalso();
    private final BrasilApiCepClient client = new BrasilApiCepClient(servidor.url(), Duration.ofSeconds(2));

    @AfterEach
    void parar() {
        servidor.close();
    }

    @Test
    @DisplayName("Traduz a resposta em inglês para o Endereco do domínio")
    void mapeiaResposta() {
        servidor.responder(200, """
                {"cep":"01001000","state":"SP","city":"São Paulo","neighborhood":"Sé",
                 "street":"Praça da Sé","service":"open-cep",
                 "location":{"type":"Point","coordinates":{"longitude":"-46.633081","latitude":"-23.5503898"}}}
                """);

        Endereco endereco = client.buscar("01001000");

        assertEquals("Praça da Sé", endereco.logradouro());
        assertEquals("Sé", endereco.bairro());
        assertEquals("São Paulo", endereco.localidade());
        assertEquals("SP", endereco.uf());
        assertEquals("/api/cep/v2/01001000", servidor.requisicoes().getFirst().getPath());
    }

    @Test
    @DisplayName("404 → CEP não encontrado")
    void naoEncontrado() {
        servidor.responder(404, "{\"message\":\"Todos os serviços de CEP retornaram erro.\"}");

        assertThrows(CepNaoEncontradoException.class, () -> client.buscar("99999999"));
    }

    @Test
    @DisplayName("500 → serviço indisponível")
    void indisponivel() {
        servidor.responder(500, "{}");

        assertThrows(ServicoCepIndisponivelException.class, () -> client.buscar("01001000"));
    }
}
