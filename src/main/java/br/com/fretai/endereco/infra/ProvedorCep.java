package br.com.fretai.endereco.infra;

import br.com.fretai.endereco.domain.CepNaoEncontradoException;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.ServicoCepIndisponivelException;

/**
 * Um provedor de CEP concreto (ViaCEP, BrasilAPI...). Não é um {@code EnderecoGateway}
 * de propósito: o resto do sistema só enxerga o {@link EnderecoGatewayComFallback},
 * que decide a ordem e quando passar para o próximo.
 */
interface ProvedorCep {

    String nome();

    /**
     * @param cepNormalizado 8 dígitos, sem máscara
     * @throws CepNaoEncontradoException se o provedor responder que o CEP não existe
     * @throws ServicoCepIndisponivelException se o provedor não responder
     */
    Endereco buscar(String cepNormalizado);
}
