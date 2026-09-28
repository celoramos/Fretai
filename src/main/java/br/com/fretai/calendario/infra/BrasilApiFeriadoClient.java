package br.com.fretai.calendario.infra;

import br.com.fretai.calendario.domain.Feriado;
import br.com.fretai.calendario.domain.FeriadoGateway;
import br.com.fretai.shared.exception.ServicoExternoIndisponivelException;
import br.com.fretai.shared.infra.RestClients;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Duration;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Feriados pela BrasilAPI (https://brasilapi.com.br/docs#tag/Feriados-Nacionais).
 * Inclui os móveis (Carnaval, Sexta-feira Santa, Corpus Christi), calculados a
 * partir da Páscoa. O calendário de um ano não muda, então fica em cache.
 */
@Component
class BrasilApiFeriadoClient implements FeriadoGateway {

    private final RestClient restClient;

    BrasilApiFeriadoClient(@Value("${fretai.brasilapi.url}") String baseUrl,
                           @Value("${fretai.brasilapi.timeout}") Duration timeout) {
        this.restClient = RestClients.comTimeout(baseUrl, timeout).build();
    }

    @Override
    @Cacheable("feriados")
    public List<Feriado> nacionaisDoAno(int ano) {
        if (ano < ANO_MINIMO || ano > ANO_MAXIMO) {
            throw new IllegalArgumentException("Ano fora do intervalo suportado (" + ANO_MINIMO + " a " + ANO_MAXIMO + ").");
        }

        List<RespostaFeriado> resposta;
        try {
            resposta = restClient.get()
                    .uri("/api/feriados/v1/{ano}", ano)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });
        } catch (RestClientException e) {
            throw new ServicoExternoIndisponivelException("Serviço de feriados indisponível",
                    "Não foi possível consultar os feriados agora. Tente novamente em instantes.", e);
        }

        if (resposta == null) {
            return List.of();
        }
        return resposta.stream()
                .map(f -> new Feriado(f.date(), f.name()))
                .sorted(Comparator.comparing(Feriado::data))
                .toList();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record RespostaFeriado(LocalDate date, String name) {
    }
}
