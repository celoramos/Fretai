package br.com.fretai.frete.domain;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static br.com.fretai.frete.domain.StatusFrete.*;
import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Confere a tabela inteira: para cada status, exatamente estas saídas são
 * permitidas e todas as outras não. Se alguém mexer na máquina sem querer,
 * este teste quebra.
 */
@DisplayName("Máquina de estados do frete (tabela completa)")
class MaquinaEstadosFreteTest {

    private static final Map<StatusFrete, Set<StatusFrete>> ESPERADO = Map.of(
            PUBLICADO, EnumSet.of(PROPOSTA_ENVIADA, CANCELADO),
            PROPOSTA_ENVIADA, EnumSet.of(PUBLICADO, ACEITO, CANCELADO),
            ACEITO, EnumSet.of(EM_TRANSITO, CANCELADO),
            EM_TRANSITO, EnumSet.of(ENTREGUE),
            ENTREGUE, EnumSet.of(PAGO),
            PAGO, EnumSet.noneOf(StatusFrete.class),
            CANCELADO, EnumSet.noneOf(StatusFrete.class));

    @ParameterizedTest(name = "saídas de {0}")
    @EnumSource(StatusFrete.class)
    void transicoes(StatusFrete de) {
        for (StatusFrete para : StatusFrete.values()) {
            assertEquals(ESPERADO.get(de).contains(para), MaquinaEstadosFrete.permite(de, para), de + " → " + para);
        }
        assertEquals(ESPERADO.get(de), MaquinaEstadosFrete.proximos(de));
    }

    @Test
    @DisplayName("O nome antigo PENDENTE ainda é aceito na entrada e vira PUBLICADO")
    void statusAntigo() {
        assertEquals(PUBLICADO, StatusFrete.de("PENDENTE"));
        assertEquals(PUBLICADO, StatusFrete.de("pendente"));
        assertEquals(ACEITO, StatusFrete.de("aceito"));
    }
}
