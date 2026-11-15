package br.com.fretai.pagamento.domain;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PagamentoRepository extends JpaRepository<Pagamento, UUID> {

    /** O pagamento que vale para o frete: o último que não foi estornado. */
    Optional<Pagamento> findFirstByFreteIdAndStatusNotOrderByCriadoEmDesc(UUID freteId, StatusPagamento status);

    Optional<Pagamento> findByCobrancaId(String cobrancaId);

    /** Saldos com janela de contestação vencida e sem bloqueio: o job libera. */
    @Query("""
            SELECT p FROM Pagamento p
            WHERE p.status = br.com.fretai.pagamento.domain.StatusPagamento.ADIANTAMENTO_LIBERADO
              AND p.saldoBloqueado = false AND p.saldoLiberavelApos IS NOT NULL AND p.saldoLiberavelApos <= :agora""")
    List<Pagamento> saldosLiberaveis(Instant agora);

    /** Carga já saiu, mas o adiantamento não foi (PSP fora do ar na hora): o job tenta de novo. */
    @Query("""
            SELECT p FROM Pagamento p
            WHERE p.status = br.com.fretai.pagamento.domain.StatusPagamento.RETIDO
              AND p.frete.status IN (br.com.fretai.frete.domain.StatusFrete.EM_TRANSITO,
                                     br.com.fretai.frete.domain.StatusFrete.ENTREGUE)""")
    List<Pagamento> adiantamentosAtrasados();

    /** Frete cancelado, mas a cobrança segue aberta ou paga (PSP fora do ar na hora): o job tenta o estorno de novo. */
    @Query("""
            SELECT p FROM Pagamento p
            WHERE p.status IN (br.com.fretai.pagamento.domain.StatusPagamento.PENDENTE,
                               br.com.fretai.pagamento.domain.StatusPagamento.RETIDO)
              AND p.frete.status = br.com.fretai.frete.domain.StatusFrete.CANCELADO""")
    List<Pagamento> estornosAtrasados();

    /** Base do "% em dia": cobranças da empresa que já venceram (pagas ou não), menos as canceladas. */
    @Query("""
            SELECT p FROM Pagamento p
            WHERE p.contratanteEmpresa.id = :empresaId AND p.vencimento < :agora
              AND (p.status <> br.com.fretai.pagamento.domain.StatusPagamento.ESTORNADO OR p.pagoEm IS NOT NULL)""")
    List<Pagamento> vencidosDaEmpresa(UUID empresaId, Instant agora);
}
