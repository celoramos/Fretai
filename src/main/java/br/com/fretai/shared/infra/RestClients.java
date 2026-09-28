package br.com.fretai.shared.infra;

import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/** Monta os RestClient das integrações externas, todos com o mesmo cuidado de timeout. */
public final class RestClients {

    private RestClients() {
    }

    /**
     * Um único HttpClient reaproveitado (pool de conexões) e com timeout: se o
     * serviço externo ficar lento, a requisição do usuário falha rápido em vez de travar.
     */
    public static RestClient.Builder comTimeout(String baseUrl, Duration timeout) {
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(timeout).build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(timeout);

        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory);
    }
}
