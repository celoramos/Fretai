package br.com.fretai.shared.infra;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DisplayName("Cache das consultas externas: validade e teto de tamanho")
class CacheConfigTest {

    /** Relógio que o teste avança na mão. */
    private final AtomicLong nanos = new AtomicLong();
    private final CacheManager caches = CacheConfig.montar(nanos::get);

    @Test
    @DisplayName("CNPJ vale um dia: depois disso a situação cadastral é consultada de novo")
    void cnpjVenceEmUmDia() {
        cache("cnpj").put("11222333000181", "ATIVA");

        avancar(Duration.ofHours(23));
        assertNotNull(cache("cnpj").get("11222333000181"));

        avancar(Duration.ofHours(2));
        assertNull(cache("cnpj").get("11222333000181"));
    }

    @Test
    @DisplayName("CEP e ponto no mapa valem 30 dias; feriados, 7")
    void cadaCacheTemASuaValidade() {
        cache("cep").put("01001000", "Praça da Sé");
        cache("geocodificacao").put("01001000", "-23.55,-46.63");
        cache("feriados").put(2026, "lista");

        avancar(Duration.ofDays(8));
        assertNotNull(cache("cep").get("01001000"));
        assertNotNull(cache("geocodificacao").get("01001000"));
        assertNull(cache("feriados").get(2026));

        avancar(Duration.ofDays(23));
        assertNull(cache("cep").get("01001000"));
        assertNull(cache("geocodificacao").get("01001000"));
    }

    @Test
    @DisplayName("O cache não passa do teto, por mais chaves diferentes que cheguem")
    void naoPassaDoTeto() {
        for (int i = 0; i < 12_000; i++) {
            cache("cnpj").put("cnpj-" + i, "dados");
        }

        assertTrue(tamanho("cnpj") <= 10_000, "tamanho: " + tamanho("cnpj"));
    }

    @Test
    @DisplayName("Cache criado sem regra própria também vence e também tem teto")
    void cacheSemRegraTambemTemLimite() {
        for (int i = 0; i < 1_500; i++) {
            cache("novo").put(i, "valor");
        }
        assertTrue(tamanho("novo") <= 1_000, "tamanho: " + tamanho("novo"));

        avancar(Duration.ofHours(2));
        cache("novo").put("x", "valor");
        assertTrue(tamanho("novo") <= 1, "tamanho: " + tamanho("novo"));
    }

    private Cache cache(String nome) {
        return caches.getCache(nome);
    }

    /** A limpeza do Caffeine roda em segundo plano; cleanUp() faz o que estiver pendente agora. */
    @SuppressWarnings("unchecked")
    private long tamanho(String nome) {
        var nativo = (com.github.benmanes.caffeine.cache.Cache<Object, Object>) cache(nome).getNativeCache();
        nativo.cleanUp();
        return nativo.estimatedSize();
    }

    private void avancar(Duration tempo) {
        nanos.addAndGet(tempo.toNanos());
    }
}
