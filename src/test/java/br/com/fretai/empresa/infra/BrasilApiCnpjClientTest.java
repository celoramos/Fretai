package br.com.fretai.empresa.infra;

import br.com.fretai.empresa.domain.DadosCnpj;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.shared.exception.ServicoExternoIndisponivelException;
import br.com.fretai.support.ServidorHttpFalso;
import java.time.Duration;
import java.time.LocalDate;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("BrasilAPI: CNPJ")
class BrasilApiCnpjClientTest {

    private final ServidorHttpFalso servidor = new ServidorHttpFalso();
    private final BrasilApiCnpjClient client = new BrasilApiCnpjClient(servidor.url(), Duration.ofSeconds(2));

    @AfterEach
    void parar() {
        servidor.close();
    }

    @Test
    @DisplayName("Mapeia os campos usados e descarta o quadro de sócios")
    void mapeiaResposta() {
        servidor.responder(200, """
                {"cnpj":"19131243000197","razao_social":"OPEN KNOWLEDGE BRASIL","nome_fantasia":"",
                 "descricao_situacao_cadastral":"ATIVA","data_inicio_atividade":"2013-10-03",
                 "cnae_fiscal_descricao":"Atividades de associações de defesa de direitos sociais",
                 "municipio":"SAO PAULO","uf":"SP","cep":"01311902",
                 "qsa":[{"nome_socio":"FULANO","cnpj_cpf_do_socio":"***112108**"}]}
                """);

        DadosCnpj empresa = client.buscarPorCnpj("19.131.243/0001-97");

        assertEquals("OPEN KNOWLEDGE BRASIL", empresa.razaoSocial());
        assertNull(empresa.nomeFantasia(), "nome fantasia vazio vira null");
        assertTrue(empresa.isAtiva());
        assertEquals(LocalDate.of(2013, 10, 3), empresa.inicioAtividade());
        assertEquals("/api/cnpj/v1/19131243000197", servidor.requisicoes().getFirst().getPath());
    }

    @Test
    @DisplayName("CNPJ inválido não chega a sair para a rede")
    void invalidoNaoConsulta() {
        assertThrows(IllegalArgumentException.class, () -> client.buscarPorCnpj("19131243000198"));
        assertTrue(servidor.requisicoes().isEmpty());
    }

    @Test
    @DisplayName("404 → não encontrado; 500 → indisponível")
    void erros() {
        servidor.responder(404, "{\"message\":\"CNPJ não encontrado\"}");
        assertThrows(RecursoNaoEncontradoException.class, () -> client.buscarPorCnpj("19131243000197"));

        servidor.responder(500, "{}");
        assertThrows(ServicoExternoIndisponivelException.class, () -> client.buscarPorCnpj("19131243000197"));
    }
}
