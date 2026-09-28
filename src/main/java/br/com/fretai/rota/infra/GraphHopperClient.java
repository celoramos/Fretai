package br.com.fretai.rota.infra;

import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.rota.domain.Rota;
import br.com.fretai.rota.domain.RotaGateway;
import br.com.fretai.shared.infra.RestClients;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Distância de estrada pela Routing API do GraphHopper (https://www.graphhopper.com).
 * Precisa de chave (o plano gratuito basta para começar); sem ela, ou com o
 * serviço fora do ar, a rota é estimada pela linha reta.
 *
 * O plano gratuito só tem os perfis car, bike e foot. Com um plano pago, troque
 * {@code fretai.graphhopper.perfil} para truck e a rota passa a respeitar
 * restrições de caminhão.
 */
@Component
class GraphHopperClient implements RotaGateway {

    private static final Logger log = LoggerFactory.getLogger(GraphHopperClient.class);

    private final RestClient restClient;
    private final String chave;
    private final String perfil;

    GraphHopperClient(@Value("${fretai.graphhopper.url}") String baseUrl,
                      @Value("${fretai.graphhopper.timeout}") Duration timeout,
                      @Value("${fretai.graphhopper.chave:}") String chave,
                      @Value("${fretai.graphhopper.perfil}") String perfil) {
        this.restClient = RestClients.comTimeout(baseUrl, timeout).build();
        this.chave = chave;
        this.perfil = perfil;
        if (chave.isBlank()) {
            log.info("GRAPHHOPPER_CHAVE não definida: distâncias serão estimadas pela linha reta.");
        }
    }

    @Override
    public Rota calcular(Coordenadas origem, Coordenadas destino) {
        if (chave.isBlank()) {
            return Rota.estimadaPorLinhaReta(origem, destino);
        }
        try {
            Resposta resposta = restClient.get()
                    .uri(uri -> uri.path("/route")
                            .queryParam("point", ponto(origem))
                            .queryParam("point", ponto(destino))
                            .queryParam("profile", perfil)
                            .queryParam("calc_points", false)
                            .queryParam("key", chave)
                            .build())
                    .retrieve()
                    .body(Resposta.class);

            if (resposta != null && resposta.paths() != null && !resposta.paths().isEmpty()) {
                return Rota.porEstrada(resposta.paths().getFirst().distance());
            }
            log.warn("GraphHopper não achou rota entre {} e {}; usando estimativa.", origem, destino);
        } catch (RestClientException e) {
            // Não loga a URL: ela carrega a chave da API.
            log.warn("GraphHopper indisponível ({}); usando estimativa.", e.getClass().getSimpleName());
        }
        return Rota.estimadaPorLinhaReta(origem, destino);
    }

    /** O GraphHopper espera "latitude,longitude" com ponto decimal, seja qual for o locale da JVM. */
    private static String ponto(Coordenadas c) {
        return String.format(Locale.ROOT, "%.6f,%.6f", c.latitude(), c.longitude());
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Resposta(List<Caminho> paths) {
    }

    /** distance em metros, time em milissegundos. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    record Caminho(double distance, long time) {
    }
}
