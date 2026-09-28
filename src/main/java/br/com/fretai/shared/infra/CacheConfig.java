package br.com.fretai.shared.infra;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

/**
 * Liga o cache das consultas externas (CEP, geocodificação, CNPJ, feriados). Fica
 * numa @Configuration separada (e não na classe Application) para que testes de
 * fatia, como @WebMvcTest, não exijam um CacheManager.
 *
 * Hoje é um cache em memória simples, sem expiração; ao rodar mais de uma
 * instância, trocar por Redis (ou Caffeine com TTL).
 */
@Configuration
@EnableCaching
class CacheConfig {
}
