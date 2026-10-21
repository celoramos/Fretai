package br.com.fretai.arquivo.infra;

import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Links assinados do armazenamento local")
class AssinadorUrlTest {

    private static final class RelogioFalso extends Clock {
        Instant agora = Instant.parse("2026-10-21T12:00:00Z");

        @Override public Instant instant() {return agora;}
        @Override public ZoneId getZone() {return ZoneOffset.UTC;}
        @Override public Clock withZone(ZoneId zone) {return this;}
    }

    private final RelogioFalso relogio = new RelogioFalso();
    private final AssinadorUrl assinador = new AssinadorUrl("segredo-de-teste-com-tamanho-ok", relogio);

    @Test
    @DisplayName("Token válido devolve a chave; depois de expirar, não")
    void expira() {
        String token = assinador.assinar("documentos/a/b/c.pdf", Duration.ofMinutes(10));

        assertEquals("documentos/a/b/c.pdf", assinador.validar(token).orElseThrow());
        relogio.agora = relogio.agora.plus(Duration.ofMinutes(11));
        assertTrue(assinador.validar(token).isEmpty());
    }

    @Test
    @DisplayName("Qualquer alteração no token, ou outro segredo, invalida")
    void adulteracao() {
        String token = assinador.assinar("documentos/a.pdf", Duration.ofMinutes(10));
        char[] letras = token.toCharArray();
        letras[3] = letras[3] == 'A' ? 'B' : 'A';

        assertTrue(assinador.validar(new String(letras)).isEmpty());
        assertTrue(assinador.validar("sem-ponto").isEmpty());
        assertTrue(new AssinadorUrl("outro-segredo-qualquer-de-teste", relogio).validar(token).isEmpty());
    }

    @Test
    @DisplayName("Chave com ../ não sai da pasta raiz")
    void caminhoForaDaRaiz(@TempDir Path raiz) {
        LocalArmazenamentoArquivos local = new LocalArmazenamentoArquivos(raiz, "http://x", assinador);

        assertThrows(IllegalArgumentException.class, () -> local.salvar("../fora.txt", new byte[]{1}, "text/plain"));
    }
}
