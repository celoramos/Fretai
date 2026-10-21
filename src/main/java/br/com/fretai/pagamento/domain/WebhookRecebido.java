package br.com.fretai.pagamento.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import java.time.Instant;

/** Evento de webhook já processado. A chave primária é o id do evento no PSP: reenvio não processa duas vezes. */
@Entity
public class WebhookRecebido {

    @Id
    @Column(length = 120)
    private String idEvento;

    @Column(nullable = false, length = 20)
    private String gateway;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private GatewayPagamento.TipoNotificacao tipo;

    @Column(length = 100)
    private String cobrancaId;

    @Column(nullable = false)
    private Instant recebidoEm;

    protected WebhookRecebido() {
    }

    public WebhookRecebido(String gateway, GatewayPagamento.NotificacaoPagamento notificacao) {
        this.idEvento = notificacao.idEvento();
        this.gateway = gateway;
        this.tipo = notificacao.tipo();
        this.cobrancaId = notificacao.cobrancaId();
        this.recebidoEm = Instant.now();
    }
}
