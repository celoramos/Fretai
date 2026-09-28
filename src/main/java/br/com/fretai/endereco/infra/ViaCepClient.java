package br.com.fretai.endereco.infra;

import br.com.fretai.endereco.domain.CepNaoEncontradoException;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.ServicoCepIndisponivelException;
import br.com.fretai.shared.infra.RestClients;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
class ViaCepClient implements ProvedorCep {

    private final RestClient restClient;

    ViaCepClient(@Value("${fretai.viacep.url}") String baseUrl,
                 @Value("${fretai.viacep.timeout}") Duration timeout) {
        this.restClient = RestClients.comTimeout(baseUrl, timeout).build();
    }

    @Override
    public String nome() {
        return "ViaCEP";
    }

    @Override
    public Endereco buscar(String cepNormalizado) {
        Endereco endereco;
        try {
            endereco = restClient.get()
                    .uri("/ws/{cep}/json/", cepNormalizado)
                    .retrieve()
                    .body(Endereco.class);
        } catch (RestClientException e) {
            throw new ServicoCepIndisponivelException("Serviço de CEP indisponível no momento.", e);
        }

        if (endereco == null || endereco.isErro()) {
            throw new CepNaoEncontradoException("CEP não encontrado: " + cepNormalizado);
        }
        return endereco;
    }
}
