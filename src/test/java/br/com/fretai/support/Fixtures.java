package br.com.fretai.support;

import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.frete.domain.EnderecoFrete;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.usuario.domain.Cliente;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.TipoVeiculo;
import java.math.BigDecimal;

/** Objetos de domínio prontos para os testes, com dados válidos. */
public final class Fixtures {

    private Fixtures() {
    }

    public static Cliente cliente() {
        return new Cliente("52998224725", "Carlos Silva", "carlos@email.com", "hash", "11999998888");
    }

    public static Motorista motorista(TipoVeiculo tipoVeiculo) {
        return new Motorista("11144477735", "Marcos Souza", "marcos@email.com", "hash",
                "11988887777", tipoVeiculo, "ABC1D23");
    }

    public static Endereco enderecoSaoPaulo() {
        return new Endereco("01001-000", "Praça da Sé", "Sé", "São Paulo", "SP");
    }

    public static Endereco enderecoRioDeJaneiro() {
        return new Endereco("20040-002", "Rua da Assembleia", "Centro", "Rio de Janeiro", "RJ");
    }

    /** Frete PENDENTE de SP para o RJ, 12 kg, R$ 180,00. */
    public static Frete fretePendente() {
        EnderecoFrete coleta = new EnderecoFrete(enderecoSaoPaulo(), "100", "Sala 3", "Próximo à Catedral");
        EnderecoFrete entrega = new EnderecoFrete(enderecoRioDeJaneiro(), "50", null, null);
        return new Frete(cliente(), coleta, entrega, "Ana Pereira", "21977776666",
                "Caixa de peças automotivas", new BigDecimal("12.00"), new BigDecimal("180.00"));
    }
}
