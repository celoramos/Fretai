package br.com.fretai.endereco.infra;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

/**
 * Liga o cache usado na consulta de CEP. Fica numa @Configuration separada (e não
 * na classe Application) para que testes de fatia, como @WebMvcTest, não exijam
 * um CacheManager.
 *
 * Hoje é um cache em memória simples; ao rodar mais de uma instância, trocar por Redis.
 */
@Configuration
@EnableCaching
class CacheConfig {
}
