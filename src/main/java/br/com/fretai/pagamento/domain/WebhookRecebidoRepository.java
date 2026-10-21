package br.com.fretai.pagamento.domain;

import org.springframework.data.jpa.repository.JpaRepository;

public interface WebhookRecebidoRepository extends JpaRepository<WebhookRecebido, String> {
}
