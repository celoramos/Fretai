package br.com.fretai.endereco.infra;

import br.com.fretai.endereco.domain.CepNaoEncontradoException;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.ServicoCepIndisponivelException;
import br.com.fretai.shared.infra.RestClients;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * CEP pela BrasilAPI (https://brasilapi.com.br). Ela mesma consulta vários
 * provedores (Correios, ViaCEP, OpenCEP...), por isso serve bem de reserva.
 */
@Component
class BrasilApiCepClient implements ProvedorCep {

    private final RestClient restClient;

    BrasilApiCepClient(@Value("${fretai.brasilapi.url}") String baseUrl,
                       @Value("${fretai.brasilapi.timeout}") Duration timeout) {
        this.restClient = RestClients.comTimeout(baseUrl, timeout).build();
    }

    @Override
    public String nome() {
        return "BrasilAPI";
    }

    @Override
    public Endereco buscar(String cepNormalizado) {
        RespostaCep resposta;
        try {
            resposta = restClient.get()
                    .uri("/api/cep/v2/{cep}", cepNormalizado)
                    .retrieve()
                    .body(RespostaCep.class);
        } catch (HttpClientErrorException.NotFound e) {
            throw new CepNaoEncontradoException("CEP não encontrado: " + cepNormalizado);
        } catch (RestClientException e) {
            throw new ServicoCepIndisponivelException("Serviço de CEP indisponível no momento.", e);
        }

        if (resposta == null) {
            throw new CepNaoEncontradoException("CEP não encontrado: " + cepNormalizado);
        }
        return new Endereco(resposta.cep(), resposta.street(), resposta.neighborhood(),
                resposta.city(), resposta.state());
    }

    /** Só os campos que o Fretai usa; a BrasilAPI responde em inglês. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    record RespostaCep(String cep, String state, String city, String neighborhood, String street) {
    }
}
