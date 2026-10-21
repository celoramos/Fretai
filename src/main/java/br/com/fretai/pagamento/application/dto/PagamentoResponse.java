package br.com.fretai.pagamento.application.dto;

import br.com.fretai.pagamento.domain.Pagamento;
import br.com.fretai.pagamento.domain.StatusPagamento;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * @param pixCopiaECola e {@code pixQrCodeBase64}: o que o contratante usa para pagar (só enquanto PENDENTE)
 * @param cobrancaId id da cobrança no PSP (aparece nos webhooks e no painel do PSP)
 * @param saldoLiberavelApos depois do canhoto, quando o saldo sai se ninguém contestar
 */
public record PagamentoResponse(UUID id, UUID freteId, StatusPagamento status, BigDecimal valorTotal,
                                BigDecimal valorAdiantamento, BigDecimal valorSaldo, String gateway, String cobrancaId,
                                String pixCopiaECola, String pixQrCodeBase64, Instant vencimento, Instant pagoEm,
                                Instant adiantamentoLiberadoEm, Instant saldoLiberavelApos, boolean saldoBloqueado,
                                Instant saldoLiberadoEm, Instant estornadoEm) {

    public static PagamentoResponse de(Pagamento p) {
        boolean pendente = p.getStatus() == StatusPagamento.PENDENTE;
        return new PagamentoResponse(p.getId(), p.getFrete().getId(), p.getStatus(), p.getValorTotal(),
                p.getValorAdiantamento(), p.getValorSaldo(), p.getGateway(), p.getCobrancaId(),
                pendente ? p.getPixCopiaECola() : null, pendente ? p.getPixQrCode() : null,
                p.getVencimento(), p.getPagoEm(), p.getAdiantamentoLiberadoEm(), p.getSaldoLiberavelApos(),
                p.isSaldoBloqueado(), p.getSaldoLiberadoEm(), p.getEstornadoEm());
    }
}
