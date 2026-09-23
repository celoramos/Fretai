package br.com.fretai.endereco.infra;

import br.com.fretai.endereco.domain.CepNaoEncontradoException;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.EnderecoGateway;
import br.com.fretai.endereco.domain.ServicoCepIndisponivelException;
import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class ViaCepClient implements EnderecoGateway {

    private final RestClient restClient;

    public ViaCepClient(@Value("${fretai.viacep.url}") String baseUrl,
                        @Value("${fretai.viacep.timeout}") Duration timeout) {
        // Um único HttpClient reaproveitado (pool de conexões) e com timeout:
        // se o ViaCEP ficar lento, a requisição do usuário falha rápido em vez de travar.
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(timeout).build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(timeout);

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    @Cacheable(cacheNames = "cep", key = "T(br.com.fretai.endereco.EnderecoGateway).normalizarCep(#cep)")
    public Endereco buscarPorCep(String cep) {
        String cepNormalizado = EnderecoGateway.normalizarCep(cep);

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
