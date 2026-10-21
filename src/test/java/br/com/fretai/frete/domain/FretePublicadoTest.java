package br.com.fretai.frete.domain;

import br.com.fretai.empresa.domain.Empresa;
import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.support.Fixtures;
import br.com.fretai.usuario.domain.CategoriaVeiculo;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.veiculo.domain.TipoCarroceria;
import br.com.fretai.veiculo.domain.TipoVeiculo;
import br.com.fretai.veiculo.domain.Veiculo;
import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Frete publicado por empresa")
class FretePublicadoTest {

    private final Motorista motorista = Fixtures.motorista(CategoriaVeiculo.CAMINHAO);

    @Test
    @DisplayName("Frete de embarcador guarda carga, requisitos e valor")
    void embarcador() {
        Frete frete = Fixtures.fretePublicado(Fixtures.embarcador());

        assertNull(frete.getCliente());
        assertNotNull(frete.getEmpresa());
        assertEquals(TipoCargaAntt.CARGA_GERAL, frete.getTipoCargaAntt());
        assertEquals(new BigDecimal("6500.00"), frete.getValorTotal());
        assertFalse(frete.isValorACombinar());
        assertFalse(frete.isPublicadoPorAgenciador());
        assertTrue(frete.isExigeRastreador());
    }

    @Test
    @DisplayName("Frete de agenciador sai marcado como tal")
    void agenciador() {
        assertTrue(Fixtures.fretePublicado(Fixtures.agenciador()).isPublicadoPorAgenciador());
    }

    @Test
    @DisplayName("Sem valor = a combinar; feriado não gera adicional sobre valor inexistente")
    void aCombinar() {
        Frete frete = Fixtures.fretePublicado(Fixtures.embarcador(), null);
        frete.registrarFeriado("Natal", new BigDecimal("20"));

        assertTrue(frete.isValorACombinar());
        assertNull(frete.getValorTotal());
        assertEquals(BigDecimal.ZERO, frete.getAdicionalFeriado());
    }

    @Test
    @DisplayName("Empresa desativada não publica")
    void empresaDesativada() {
        Empresa empresa = Fixtures.embarcador();
        empresa.desativar();

        assertThrows(RegraNegocioException.class, () -> Fixtures.fretePublicado(empresa));
    }

    @Test
    @DisplayName("Confere tipo, carroceria e rastreador do caminhão")
    void aceitaVeiculo() {
        Frete frete = Fixtures.fretePublicado(Fixtures.embarcador());

        assertTrue(frete.aceitaVeiculo(Fixtures.carretaSider(motorista)));
        assertFalse(frete.aceitaVeiculo(new Veiculo(motorista, "AAA1111", "12345678",
                TipoVeiculo.TRUCK, TipoCarroceria.SIDER, 3, true)), "tipo não aceito");
        assertFalse(frete.aceitaVeiculo(new Veiculo(motorista, "AAA1111", "12345678",
                TipoVeiculo.CARRETA, TipoCarroceria.GRANELEIRO, 5, true)), "carroceria não aceita");
        assertFalse(frete.aceitaVeiculo(new Veiculo(motorista, "AAA1111", "12345678",
                TipoVeiculo.CARRETA, TipoCarroceria.SIDER, 5, false)), "sem rastreador");
    }
}
