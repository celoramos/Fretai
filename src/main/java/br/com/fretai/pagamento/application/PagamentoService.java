package br.com.fretai.pagamento.application;

import br.com.fretai.frete.domain.Autor;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.FreteRepository;
import br.com.fretai.frete.domain.StatusFrete;
import br.com.fretai.pagamento.application.dto.PagamentoResponse;
import br.com.fretai.pagamento.domain.EventosPagamento;
import br.com.fretai.pagamento.domain.GatewayPagamento;
import br.com.fretai.pagamento.domain.Pagamento;
import br.com.fretai.pagamento.domain.PagamentoRepository;
import br.com.fretai.pagamento.domain.StatusPagamento;
import br.com.fretai.pagamento.domain.WebhookRecebido;
import br.com.fretai.pagamento.domain.WebhookRecebidoRepository;
import br.com.fretai.shared.exception.AcessoNegadoException;
import br.com.fretai.shared.exception.ConflitoException;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Orquestra o PSP ao longo do frete. O dinheiro nunca passa pelo Fretaí:
 * <ol>
 *   <li>no aceite, o contratante gera a cobrança Pix;</li>
 *   <li>o webhook do PSP confirma o pagamento → RETIDO;</li>
 *   <li>a carga sai → o PSP transfere o adiantamento ao motorista;</li>
 *   <li>o canhoto chega e a janela de contestação passa → o PSP transfere o saldo; o frete vira PAGO.</li>
 * </ol>
 * Cancelado antes da saída, a cobrança é cancelada ou o valor devolvido.
 */
@Service
public class PagamentoService {

    private static final Logger log = LoggerFactory.getLogger(PagamentoService.class);
    private static final ZoneId BRASILIA = ZoneId.of("America/Sao_Paulo");

    private final PagamentoRepository pagamentoRepository;
    private final WebhookRecebidoRepository webhookRepository;
    private final FreteRepository freteRepository;
    private final GatewayPagamento gateway;
    private final ApplicationEventPublisher eventos;
    private final Duration prazoCobranca;

    public PagamentoService(PagamentoRepository pagamentoRepository, WebhookRecebidoRepository webhookRepository,
                            FreteRepository freteRepository, GatewayPagamento gateway,
                            ApplicationEventPublisher eventos,
                            @Value("${fretai.pagamento.prazo-cobranca}") Duration prazoCobranca) {
        this.pagamentoRepository = pagamentoRepository;
        this.webhookRepository = webhookRepository;
        this.freteRepository = freteRepository;
        this.gateway = gateway;
        this.eventos = eventos;
        this.prazoCobranca = prazoCobranca;
    }

    @Transactional
    public PagamentoResponse gerarCobranca(UUID freteId, UsuarioLogado quem) {
        Frete frete = carregarFrete(freteId);
        if (!quem.isAdmin() && !frete.ehContratante(quem)) {
            throw new AcessoNegadoException("Só quem contratou o frete gera a cobrança.");
        }
        if (frete.getStatus() != StatusFrete.ACEITO) {
            throw new IllegalStateException("A cobrança é gerada depois do aceite e antes da saída da carga.");
        }
        if (vigente(freteId).isPresent()) {
            throw new ConflitoException("Este frete já tem uma cobrança.");
        }
        if (frete.getMotorista().getChavePix() == null) {
            throw new RegraNegocioException("O motorista ainda não cadastrou a chave Pix para receber.");
        }
        BigDecimal valor = Objects.requireNonNull(frete.getValorAcordado(), "Frete aceito sem valor acordado.");
        Instant vencimento = Instant.now().plus(prazoCobranca);

        GatewayPagamento.CobrancaPix cobranca = gateway.criarCobrancaPix(new GatewayPagamento.NovaCobranca(
                freteId.toString(), valor, LocalDate.ofInstant(vencimento, BRASILIA),
                "Frete Fretaí " + freteId, nomePagador(frete), documentoPagador(frete), emailPagador(frete)));
        Pagamento pagamento = new Pagamento(frete, valor,
                Objects.requireNonNullElse(frete.getAdiantamentoPercentual(), BigDecimal.ZERO), vencimento,
                gateway.nome(), cobranca);
        return PagamentoResponse.de(pagamentoRepository.save(pagamento));
    }

    @Transactional(readOnly = true)
    public PagamentoResponse buscar(UUID freteId, UsuarioLogado quem) {
        Frete frete = carregarFrete(freteId);
        if (!quem.isAdmin() && !frete.ehContratante(quem) && !frete.ehMotoristaDoFrete(quem)) {
            throw new AcessoNegadoException("Só quem participa do frete vê o pagamento.");
        }
        return vigente(freteId).map(PagamentoResponse::de)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Este frete ainda não tem cobrança."));
    }

    /**
     * Webhook do PSP. Idempotente: o id do evento é gravado antes de qualquer
     * efeito, e um reenvio é reconhecido e ignorado.
     */
    @Transactional
    public void processarWebhook(String corpo, Map<String, String> cabecalhos) {
        Optional<GatewayPagamento.NotificacaoPagamento> lida = gateway.lerWebhook(corpo, cabecalhos);
        if (lida.isEmpty()) {
            return;
        }
        GatewayPagamento.NotificacaoPagamento notificacao = lida.get();
        if (webhookRepository.existsById(notificacao.idEvento())) {
            log.info("Webhook {} repetido; ignorado.", notificacao.idEvento());
            return;
        }
        // saveAndFlush: dois reenvios simultâneos esbarram na chave primária aqui, antes de qualquer efeito.
        webhookRepository.saveAndFlush(new WebhookRecebido(gateway.nome(), notificacao));

        Optional<Pagamento> encontrado = pagamentoRepository.findByCobrancaId(notificacao.cobrancaId());
        if (encontrado.isEmpty()) {
            log.warn("Webhook {} de cobrança desconhecida {}", notificacao.idEvento(), notificacao.cobrancaId());
            return;
        }
        Pagamento pagamento = encontrado.get();
        if (notificacao.tipo() == GatewayPagamento.TipoNotificacao.PAGAMENTO_CONFIRMADO) {
            if (pagamento.getStatus() == StatusPagamento.PENDENTE) {
                pagamento.confirmarRecebimento(Instant.now());
                if (pagamento.getFrete().getStatus() == StatusFrete.CANCELADO) {
                    // A cobrança não pôde ser cancelada no PSP e foi paga depois: ninguém é avisado para
                    // carregar, e o job devolve o valor.
                    log.warn("Pix do frete cancelado {} recebido; o valor será devolvido.", pagamento.getFrete().getId());
                } else {
                    eventos.publishEvent(new EventosPagamento.PagamentoRetido(pagamento.getFrete().getId(),
                            pagamento.getValorTotal()));
                }
            } else if (pagamento.getStatus() == StatusPagamento.ESTORNADO) {
                // Pagou depois de cancelado: devolve.
                gateway.estornar(pagamento.getCobrancaId());
            }
        }
    }

    /** A carga saiu: o adiantamento vai para o motorista. */
    @Transactional
    public void liberarAdiantamentoDoFrete(UUID freteId) {
        vigente(freteId).ifPresent(this::liberarAdiantamento);
    }

    /** Cancelado antes da saída: cancela a cobrança (ou devolve, se já foi paga). */
    @Transactional
    public void estornarDoFrete(UUID freteId) {
        vigente(freteId).ifPresent(this::estornar);
    }

    /**
     * Só chama o PSP se ainda há o que desfazer: depois que o adiantamento saiu, pedir o estorno
     * devolveria ao pagador um dinheiro que já está com o motorista.
     */
    private void estornar(Pagamento pagamento) {
        if (pagamento.getStatus() != StatusPagamento.PENDENTE && pagamento.getStatus() != StatusPagamento.RETIDO) {
            return;
        }
        gateway.estornar(pagamento.getCobrancaId());
        pagamento.estornar();
    }

    void liberarAdiantamento(Pagamento pagamento) {
        if (pagamento.getStatus() == StatusPagamento.PENDENTE) {
            log.warn("Frete {} saiu sem o pagamento confirmado.", pagamento.getFrete().getId());
            return;
        }
        if (pagamento.getStatus() != StatusPagamento.RETIDO) {
            return;
        }
        String transferencia = null;
        if (pagamento.getValorAdiantamento().signum() > 0) {
            transferencia = gateway.transferirPix(new GatewayPagamento.Transferencia(pagamento.getId().toString(),
                    pagamento.getValorAdiantamento(), pagamento.getMotorista().getChavePix(),
                    "Adiantamento do frete " + pagamento.getFrete().getId()));
        }
        pagamento.registrarAdiantamento(transferencia);
        eventos.publishEvent(new EventosPagamento.AdiantamentoLiberado(pagamento.getFrete().getId(),
                pagamento.getValorAdiantamento()));
    }

    /** O canhoto chegou: o saldo sai em {@code aPartirDe}, se ninguém contestar até lá. */
    @Transactional
    public void agendarSaldo(UUID freteId, Instant aPartirDe) {
        vigente(freteId).ifPresent(p -> {
            // Saída sem adiantamento liberado (PSP fora do ar na hora): libera agora, antes de agendar.
            if (p.getStatus() == StatusPagamento.RETIDO) {
                liberarAdiantamento(p);
            }
            if (p.getStatus() == StatusPagamento.ADIANTAMENTO_LIBERADO) {
                p.agendarLiberacaoSaldo(aPartirDe);
            }
        });
    }

    @Transactional
    public void bloquearSaldo(UUID freteId) {
        vigente(freteId).ifPresent(Pagamento::bloquearSaldo);
    }

    @Transactional
    public void desbloquearSaldo(UUID freteId) {
        vigente(freteId).ifPresent(Pagamento::desbloquearSaldo);
    }

    /**
     * Libera um saldo pronto: transfere, marca LIBERADO e fecha o frete como PAGO.
     *
     * @return false se ainda não era hora (bloqueado ou janela aberta)
     */
    @Transactional
    public boolean liberarSaldo(UUID pagamentoId) {
        Pagamento pagamento = pagamentoRepository.findById(pagamentoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pagamento não encontrado."));
        if (!pagamento.saldoPodeSair(Instant.now())) {
            return false;
        }
        String transferencia = gateway.transferirPix(new GatewayPagamento.Transferencia(pagamento.getId().toString(),
                pagamento.getValorSaldo(), pagamento.getMotorista().getChavePix(),
                "Saldo do frete " + pagamento.getFrete().getId()));
        pagamento.registrarSaldo(transferencia);
        Frete frete = pagamento.getFrete();
        frete.registrarPagamento(Autor.SISTEMA);
        freteRepository.saveAndFlush(frete);
        eventos.publishEvent(new EventosPagamento.SaldoLiberado(frete.getId(), pagamento.getValorSaldo()));
        return true;
    }

    @Transactional(readOnly = true)
    public List<UUID> adiantamentosPendentes() {
        return pagamentoRepository.adiantamentosAtrasados().stream().map(Pagamento::getId).toList();
    }

    @Transactional
    public void retentarAdiantamento(UUID pagamentoId) {
        pagamentoRepository.findById(pagamentoId).ifPresent(this::liberarAdiantamento);
    }

    /** Fretes cancelados com o PSP fora do ar: o valor continua preso até o estorno passar. */
    @Transactional(readOnly = true)
    public List<UUID> estornosPendentes() {
        return pagamentoRepository.estornosAtrasados().stream().map(Pagamento::getId).toList();
    }

    @Transactional
    public void retentarEstorno(UUID pagamentoId) {
        pagamentoRepository.findById(pagamentoId)
                .filter(p -> p.getFrete().getStatus() == StatusFrete.CANCELADO)
                .ifPresent(this::estornar);
    }

    @Transactional(readOnly = true)
    public List<UUID> saldosProntos() {
        return pagamentoRepository.saldosLiberaveis(Instant.now()).stream().map(Pagamento::getId).toList();
    }

    private Optional<Pagamento> vigente(UUID freteId) {
        return pagamentoRepository.findFirstByFreteIdAndStatusNotOrderByCriadoEmDesc(freteId, StatusPagamento.ESTORNADO);
    }

    private Frete carregarFrete(UUID freteId) {
        return freteRepository.findById(freteId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Frete não encontrado."));
    }

    private static String nomePagador(Frete f) {
        return f.getEmpresa() != null ? f.getEmpresa().getRazaoSocial() : f.getCliente().getNome();
    }

    private static String documentoPagador(Frete f) {
        return f.getEmpresa() != null ? f.getEmpresa().getCnpj() : f.getCliente().getCpf();
    }

    private static String emailPagador(Frete f) {
        return f.getCliente() != null ? f.getCliente().getEmail() : null;
    }
}
