package br.com.fretai.endereco.domain;

/**
 * Porta de saída para consulta de endereço por CEP. O resto do sistema depende
 * desta interface, não do ViaCEP — trocar de provedor (ou ter um fallback) não
 * mexe em nenhum service.
 */
public interface EnderecoGateway {

    /**
     * @param cep com ou sem máscara
     * @throws IllegalArgumentException se o CEP não tiver 8 dígitos
     * @throws CepNaoEncontradoException se o CEP não existir
     * @throws ServicoCepIndisponivelException se o provedor não responder
     */
    Endereco buscarPorCep(String cep);

    static String normalizarCep(String cep) {
        String digitos = (cep != null) ? cep.replaceAll("\\D", "") : "";
        if (digitos.length() != 8) {
            throw new IllegalArgumentException("CEP inválido. Deve conter 8 dígitos numéricos.");
        }
        return digitos;
    }
}
