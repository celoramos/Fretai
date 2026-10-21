package br.com.fretai.empresa.domain;

import br.com.fretai.support.Fixtures;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Empresa")
class EmpresaTest {

    @Test
    @DisplayName("Guarda o CNPJ sem máscara")
    void normalizaCnpj() {
        Empresa empresa = new Empresa("11.222.333/0001-81", "Cerâmica Paulista Ltda", null,
                TipoEmpresa.EMBARCADOR, "1133334444");

        assertEquals("11222333000181", empresa.getCnpj());
        assertTrue(empresa.isAtiva());
    }

    @Test
    @DisplayName("Recusa CNPJ com dígito verificador errado")
    void recusaCnpjInvalido() {
        assertThrows(IllegalArgumentException.class, () -> new Empresa("11.222.333/0001-82",
                "Cerâmica Paulista Ltda", null, TipoEmpresa.EMBARCADOR, "1133334444"));
    }

    @Test
    @DisplayName("Só o agenciador é marcado como agenciador")
    void agenciador() {
        assertTrue(Fixtures.agenciador().isAgenciador());
        assertFalse(Fixtures.embarcador().isAgenciador());
    }
}
