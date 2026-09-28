package br.com.fretai.endereco.infra;

import br.com.fretai.endereco.domain.CepNaoEncontradoException;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.EnderecoGateway;
import br.com.fretai.endereco.domain.ServicoCepIndisponivelException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

/**
 * O {@link EnderecoGateway} que o sistema usa: consulta os provedores em ordem
 * (ViaCEP primeiro, BrasilAPI de reserva). O cache fica aqui, e não em cada
 * provedor, para que um CEP achado por qualquer um deles não seja consultado de novo.
 */
@Component
class EnderecoGatewayComFallback implements EnderecoGateway {

    private static final Logger log = LoggerFactory.getLogger(EnderecoGatewayComFallback.class);

    private final List<ProvedorCep> provedores;

    @Autowired
    EnderecoGatewayComFallback(ViaCepClient viaCep, BrasilApiCepClient brasilApi) {
        this(List.of(viaCep, brasilApi));
    }

    EnderecoGatewayComFallback(List<ProvedorCep> provedores) {
        if (provedores.isEmpty()) {
            throw new IllegalArgumentException("Informe ao menos um provedor de CEP.");
        }
        this.provedores = List.copyOf(provedores);
    }

    @Override
    @Cacheable(cacheNames = "cep", key = "T(br.com.fretai.endereco.domain.EnderecoGateway).normalizarCep(#cep)")
    public Endereco buscarPorCep(String cep) {
        String cepNormalizado = EnderecoGateway.normalizarCep(cep);

        // Passa para o próximo tanto se o provedor cair quanto se não achar o CEP:
        // CEPs novos às vezes demoram a entrar no ViaCEP, e a BrasilAPI consulta outras bases.
        ServicoCepIndisponivelException indisponivel = null;
        CepNaoEncontradoException naoEncontrado = null;
        for (ProvedorCep provedor : provedores) {
            try {
                return provedor.buscar(cepNormalizado);
            } catch (ServicoCepIndisponivelException e) {
                log.warn("{} indisponível para o CEP {}; tentando o próximo provedor.", provedor.nome(), cepNormalizado);
                indisponivel = e;
            } catch (CepNaoEncontradoException e) {
                log.info("{} não encontrou o CEP {}; tentando o próximo provedor.", provedor.nome(), cepNormalizado);
                naoEncontrado = e;
            }
        }
        // Se algum provedor não respondeu, não dá para afirmar que o CEP não existe: 503, não 422.
        throw (indisponivel != null) ? indisponivel : naoEncontrado;
    }
}
