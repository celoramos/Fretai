package br.com.fretai.endereco.infra;

import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.GeocodificacaoGateway;
import br.com.fretai.shared.infra.RestClients;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriBuilder;

/**
 * Geocodificação pelo Nominatim, do OpenStreetMap. A política de uso do serviço
 * público (https://operations.osmfoundation.org/policies/nominatim/) exige um
 * User-Agent que identifique a aplicação e no máximo 1 requisição por segundo;
 * as duas coisas são garantidas aqui. Para volume alto, suba um Nominatim próprio
 * e aponte {@code fretai.nominatim.url} para ele.
 *
 * Só são enviados logradouro, número, cidade e UF, nunca nome ou telefone de ninguém.
 */
@Component
class NominatimClient implements GeocodificacaoGateway {

    private static final Logger log = LoggerFactory.getLogger(NominatimClient.class);

    private final RestClient restClient;
    private final Duration intervaloMinimo;
    private Instant ultimaChamada = Instant.EPOCH;

    NominatimClient(@Value("${fretai.nominatim.url}") String baseUrl,
                    @Value("${fretai.nominatim.timeout}") Duration timeout,
                    @Value("${fretai.nominatim.user-agent}") String userAgent,
                    @Value("${fretai.nominatim.intervalo-minimo}") Duration intervaloMinimo) {
        this.restClient = RestClients.comTimeout(baseUrl, timeout)
                .defaultHeader(HttpHeaders.USER_AGENT, userAgent)
                .build();
        this.intervaloMinimo = intervaloMinimo;
    }

    /** Resultado vazio não entra no cache: pode ter sido uma falha passageira. */
    @Override
    @Cacheable(cacheNames = "geocodificacao", unless = "#result == null")
    public Optional<Coordenadas> localizar(Endereco endereco, String numero) {
        try {
            // Primeiro pelo endereço completo; se o OSM não conhecer a rua, fica o centro da cidade,
            // que ainda serve para estimar a distância de um frete entre cidades.
            Optional<Coordenadas> ponto = temTexto(endereco.logradouro())
                    ? consultar(endereco, rua(endereco.logradouro(), numero))
                    : Optional.empty();
            return ponto.isPresent() ? ponto : consultar(endereco, null);
        } catch (RestClientException | IllegalArgumentException e) {
            log.warn("Não foi possível geocodificar {}/{}: {}", endereco.localidade(), endereco.uf(), e.getMessage());
            return Optional.empty();
        }
    }

    private Optional<Coordenadas> consultar(Endereco endereco, String rua) {
        respeitarLimiteDeUso();
        List<Resultado> resultados = restClient.get()
                .uri(uri -> montarBusca(uri, endereco, rua))
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });

        if (resultados == null || resultados.isEmpty()) {
            return Optional.empty();
        }
        Resultado primeiro = resultados.getFirst();
        return Optional.of(new Coordenadas(Double.parseDouble(primeiro.lat()), Double.parseDouble(primeiro.lon())));
    }

    private static URI montarBusca(UriBuilder uri, Endereco endereco, String rua) {
        uri.path("/search")
                .queryParam("city", endereco.localidade())
                .queryParam("state", endereco.uf())
                .queryParam("country", "Brasil")
                .queryParam("countrycodes", "br")
                .queryParam("format", "jsonv2")
                .queryParam("limit", 1);
        if (rua != null) {
            uri.queryParam("street", rua);
        }
        return uri.build();
    }

    /** No formato estruturado do Nominatim, o número vem antes do nome da rua. */
    private static String rua(String logradouro, String numero) {
        return temTexto(numero) ? numero.trim() + " " + logradouro : logradouro;
    }

    private synchronized void respeitarLimiteDeUso() {
        long esperaMs = intervaloMinimo.minus(Duration.between(ultimaChamada, Instant.now())).toMillis();
        if (esperaMs > 0) {
            try {
                Thread.sleep(esperaMs);
            } catch (InterruptedException e) {
                // Não vira IllegalStateException de propósito: o handler global trata essa como 409.
                Thread.currentThread().interrupt();
            }
        }
        ultimaChamada = Instant.now();
    }

    private static boolean temTexto(String valor) {
        return valor != null && !valor.isBlank();
    }

    /** O Nominatim devolve latitude e longitude como texto. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    record Resultado(String lat, String lon) {
    }
}
