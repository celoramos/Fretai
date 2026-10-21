package br.com.fretai.support;

import br.com.fretai.empresa.domain.Empresa;
import br.com.fretai.empresa.domain.TipoEmpresa;
import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.frete.domain.Autor;
import br.com.fretai.frete.domain.DadosCarga;
import br.com.fretai.shared.seguranca.Papel;
import br.com.fretai.frete.domain.EnderecoFrete;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.RequisitosFrete;
import br.com.fretai.precificacao.domain.TipoCargaAntt;
import br.com.fretai.usuario.domain.Cliente;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.CategoriaVeiculo;
import br.com.fretai.veiculo.domain.TipoCarroceria;
import br.com.fretai.veiculo.domain.TipoVeiculo;
import br.com.fretai.veiculo.domain.Veiculo;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

/** Objetos de domínio prontos para os testes, com dados válidos. */
public final class Fixtures {

    private Fixtures() {
    }

    public static Cliente cliente() {
        return new Cliente("52998224725", "Carlos Silva", "carlos@email.com", "hash", "11999998888");
    }

    public static Motorista motorista(CategoriaVeiculo tipoVeiculo) {
        return new Motorista("11144477735", "Marcos Souza", "marcos@email.com", "hash",
                "11988887777", tipoVeiculo, "ABC1D23");
    }

    public static Endereco enderecoSaoPaulo() {
        return new Endereco("01001-000", "Praça da Sé", "Sé", "São Paulo", "SP");
    }

    public static Endereco enderecoRioDeJaneiro() {
        return new Endereco("20040-002", "Rua da Assembleia", "Centro", "Rio de Janeiro", "RJ");
    }

    /** Uma quarta-feira comum: nem feriado nem domingo. */
    public static final LocalDate DIA_COMUM = LocalDate.of(2026, 11, 4);

    /** Frete PUBLICADO de cliente, de SP para o RJ, 12 kg, R$ 180,00, coleta num dia comum. */
    public static Frete fretePendente() {
        return fretePendente(DIA_COMUM, new BigDecimal("180.00"));
    }

    public static Frete fretePendente(LocalDate dataColeta, BigDecimal valor) {
        EnderecoFrete coleta = new EnderecoFrete(enderecoSaoPaulo(), "100", "Sala 3", "Próximo à Catedral");
        EnderecoFrete entrega = new EnderecoFrete(enderecoRioDeJaneiro(), "50", null, null);
        return new Frete(cliente(), coleta, entrega, "Ana Pereira", "21977776666",
                "Caixa de peças automotivas", new BigDecimal("12.00"), valor, dataColeta);
    }

    // ---------- Marketplace B2B ----------

    /** CNPJ de exemplo com dígitos verificadores válidos. */
    public static final String CNPJ_VALIDO = "11222333000181";

    public static Empresa embarcador() {
        return new Empresa(CNPJ_VALIDO, "Cerâmica Paulista Ltda", "Cerâmica SP", TipoEmpresa.EMBARCADOR, "1133334444");
    }

    public static Empresa agenciador() {
        return new Empresa("19131243000197", "Agência de Cargas Ltda", null, TipoEmpresa.AGENCIADOR, "1133335555");
    }

    public static Veiculo carretaSider(Motorista motorista) {
        return new Veiculo(motorista, "XYZ1A23", "12345678", TipoVeiculo.CARRETA, TipoCarroceria.SIDER, 5, true);
    }

    public static DadosCarga cargaCeramica() {
        return new DadosCarga("22 paletes de piso cerâmico", "Cerâmica", TipoCargaAntt.CARGA_GERAL,
                new BigDecimal("28000"));
    }

    /** Carreta ou bitrem, sider ou baú, com rastreador. */
    public static RequisitosFrete requisitosCarretaSider() {
        return new RequisitosFrete(Set.of(TipoVeiculo.CARRETA, TipoVeiculo.BITREM),
                Set.of(TipoCarroceria.SIDER, TipoCarroceria.BAU), true, false);
    }

    /** Frete de empresa de SP para o RJ, R$ 6.500,00. */
    public static Frete fretePublicado(Empresa empresa) {
        return fretePublicado(empresa, new BigDecimal("6500.00"));
    }

    public static Frete fretePublicado(Empresa empresa, BigDecimal valor) {
        EnderecoFrete coleta = new EnderecoFrete(enderecoSaoPaulo(), "100", null, null,
                new Coordenadas(-23.5503898, -46.633081));
        EnderecoFrete entrega = new EnderecoFrete(enderecoRioDeJaneiro(), "50", null, null,
                new Coordenadas(-22.9035, -43.1757));
        return Frete.publicar(empresa, coleta, entrega, cargaCeramica(), valor, DIA_COMUM, requisitosCarretaSider(),
                new Autor(null, Papel.EMPRESA));
    }
}
