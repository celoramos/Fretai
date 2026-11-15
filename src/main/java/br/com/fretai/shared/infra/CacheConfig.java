package br.com.fretai.shared.infra;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.Ticker;
import java.time.Duration;
import java.util.List;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Liga o cache das consultas externas (CEP, geocodificação, CNPJ, feriados). Fica
 * numa @Configuration separada (e não na classe Application) para que testes de
 * fatia, como @WebMvcTest, não exijam um CacheManager.
 *
 * Toda resposta guardada vence e todo cache tem teto de tamanho. Sem isso, uma empresa baixada
 * na Receita continuaria "ativa" até a API reiniciar, e a consulta de CNPJ, que é pública,
 * encheria a memória com um CNPJ diferente por requisição.
 *
 * Fica em memória: com mais de uma instância, cada uma guarda as suas respostas. Para dividir
 * entre instâncias, trocar por Redis.
 */
@Configuration
@EnableCaching
class CacheConfig {

    private record Regra(String nome, Duration validade, long maximo) {
    }

    private static final List<Regra> REGRAS = List.of(
            // Endereço de um CEP e o ponto dele no mapa quase nunca mudam.
            new Regra("cep", Duration.ofDays(30), 50_000),
            new Regra("geocodificacao", Duration.ofDays(30), 50_000),
            // A situação cadastral muda (baixada, inapta) e é ela que decide se a empresa entra.
            new Regra("cnpj", Duration.ofDays(1), 10_000),
            // Uma entrada por ano. Feriado nacional novo pode ser criado com o ano em curso.
            new Regra("feriados", Duration.ofDays(7), 200));

    /** O que vale para um cache que alguém criar sem regra própria: curto e pequeno, nunca sem limite. */
    private static final Regra PADRAO = new Regra("padrão", Duration.ofHours(1), 1_000);

    @Bean
    CacheManager cacheManager() {
        return montar(Ticker.systemTicker());
    }

    /** @param relogio o do sistema; no teste, um que avança na mão */
    static CacheManager montar(Ticker relogio) {
        CaffeineCacheManager caches = new CaffeineCacheManager();
        caches.setCaffeine(construtor(PADRAO, relogio));
        for (Regra regra : REGRAS) {
            caches.registerCustomCache(regra.nome(), construtor(regra, relogio).build());
        }
        return caches;
    }

    private static Caffeine<Object, Object> construtor(Regra regra, Ticker relogio) {
        return Caffeine.newBuilder().ticker(relogio).expireAfterWrite(regra.validade()).maximumSize(regra.maximo())
                // Acertos e erros de cada cache saem nas métricas do Actuator.
                .recordStats();
    }
}
