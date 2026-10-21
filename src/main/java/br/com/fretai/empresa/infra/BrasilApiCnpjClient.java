package br.com.fretai.empresa.infra;

import br.com.fretai.empresa.domain.DadosCnpj;
import br.com.fretai.empresa.domain.EmpresaGateway;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.shared.exception.ServicoExternoIndisponivelException;
import br.com.fretai.shared.infra.RestClients;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Duration;
import java.time.LocalDate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** CNPJ pela BrasilAPI (https://brasilapi.com.br/docs#tag/CNPJ), que lê a base aberta da Receita. */
@Component
class BrasilApiCnpjClient implements EmpresaGateway {

    private final RestClient restClient;

    BrasilApiCnpjClient(@Value("${fretai.brasilapi.url}") String baseUrl,
                        @Value("${fretai.brasilapi.timeout}") Duration timeout) {
        this.restClient = RestClients.comTimeout(baseUrl, timeout).build();
    }

    @Override
    @Cacheable(cacheNames = "cnpj", key = "T(br.com.fretai.empresa.domain.EmpresaGateway).normalizarCnpj(#cnpj)")
    public DadosCnpj buscarPorCnpj(String cnpj) {
        String cnpjNormalizado = EmpresaGateway.normalizarCnpj(cnpj);

        RespostaCnpj r;
        try {
            r = restClient.get()
                    .uri("/api/cnpj/v1/{cnpj}", cnpjNormalizado)
                    .retrieve()
                    .body(RespostaCnpj.class);
        } catch (HttpClientErrorException.NotFound | HttpClientErrorException.BadRequest e) {
            // O dígito verificador já foi conferido; 400 aqui é a BrasilAPI dizendo que não conhece o CNPJ.
            throw new RecursoNaoEncontradoException("CNPJ não encontrado na Receita Federal: " + cnpjNormalizado);
        } catch (RestClientException e) {
            throw new ServicoExternoIndisponivelException("Serviço de CNPJ indisponível",
                    "Não foi possível consultar o CNPJ agora. Tente novamente em instantes.", e);
        }

        if (r == null) {
            throw new RecursoNaoEncontradoException("CNPJ não encontrado na Receita Federal: " + cnpjNormalizado);
        }
        return new DadosCnpj(r.cnpj(), r.razaoSocial(), vazioComoNulo(r.nomeFantasia()), r.situacaoCadastral(),
                r.inicioAtividade(), r.atividadePrincipal(), r.municipio(), r.uf(), r.cep());
    }

    private static String vazioComoNulo(String valor) {
        return (valor == null || valor.isBlank()) ? null : valor;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record RespostaCnpj(
            String cnpj,
            @JsonProperty("razao_social") String razaoSocial,
            @JsonProperty("nome_fantasia") String nomeFantasia,
            @JsonProperty("descricao_situacao_cadastral") String situacaoCadastral,
            @JsonProperty("data_inicio_atividade") LocalDate inicioAtividade,
            @JsonProperty("cnae_fiscal_descricao") String atividadePrincipal,
            String municipio,
            String uf,
            String cep) {
    }
}
