package br.com.fretai.shared.infra;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Liga os jobs agendados (liberação de saldo). Separado do Application pelo mesmo motivo do CacheConfig. */
@Configuration
@EnableScheduling
class AgendamentoConfig {
}
