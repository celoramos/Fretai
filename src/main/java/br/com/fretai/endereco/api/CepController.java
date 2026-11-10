package br.com.fretai.endereco.api;

import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.EnderecoGateway;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/**
 * Consulta de CEP para o formulário: o pedido de frete mostra "bairro, cidade" logo depois que a pessoa
 * digita o CEP, antes de enviar. Passa pelo mesmo gateway (com fallback) que o pedido usa ao salvar.
 * Só para quem está logado, para o endpoint não virar um proxy aberto de consulta de CEP.
 */
@RestController
public class CepController {

    private final EnderecoGateway enderecoGateway;

    public CepController(EnderecoGateway enderecoGateway) {
        this.enderecoGateway = enderecoGateway;
    }

    public record CepResponse(String cep, String logradouro, String bairro, String cidade, String uf) {
        static CepResponse de(Endereco e) {
            return new CepResponse(e.cep(), e.logradouro(), e.bairro(), e.localidade(), e.uf());
        }
    }

    @GetMapping("/api/enderecos/cep/{cep}")
    public CepResponse consultar(@PathVariable String cep) {
        return CepResponse.de(enderecoGateway.buscarPorCep(cep));
    }
}
