package br.com.fretai.notificacao.application;

import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.entrega.domain.EventosEntrega;
import br.com.fretai.frete.application.BuscaFreteService;
import br.com.fretai.frete.domain.EventosFrete;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.FreteRepository;
import br.com.fretai.frete.domain.PropostaRepository;
import br.com.fretai.notificacao.domain.Notificador;
import br.com.fretai.notificacao.domain.TipoNotificacao;
import br.com.fretai.pagamento.domain.EventosPagamento;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.MotoristaRepository;
import br.com.fretai.usuario.domain.MotoristasProximos;
import br.com.fretai.veiculo.domain.VeiculoRepository;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Quem precisa saber do quê. Cada aviso roda depois do commit, numa transação
 * só de leitura, e qualquer falha (WhatsApp fora, PostGIS ausente) vira log:
 * aviso perdido não pode desfazer um aceite ou um pagamento.
 */
@Component
class AvisosDoFrete {

    private static final Logger log = LoggerFactory.getLogger(AvisosDoFrete.class);
    private static final DateTimeFormatter DATA_HORA = DateTimeFormatter.ofPattern("dd/MM 'às' HH:mm")
            .withZone(ZoneId.of("America/Sao_Paulo"));

    private final Notificador notificador;
    private final FreteRepository freteRepository;
    private final PropostaRepository propostaRepository;
    private final MotoristaRepository motoristaRepository;
    private final VeiculoRepository veiculoRepository;
    private final MotoristasProximos motoristasProximos;
    private final BuscaFreteService buscaFreteService;
    private final TransactionTemplate leitura;

    AvisosDoFrete(Notificador notificador, FreteRepository freteRepository, PropostaRepository propostaRepository,
                  MotoristaRepository motoristaRepository, VeiculoRepository veiculoRepository,
                  MotoristasProximos motoristasProximos, BuscaFreteService buscaFreteService,
                  PlatformTransactionManager transacoes) {
        this.notificador = notificador;
        this.freteRepository = freteRepository;
        this.propostaRepository = propostaRepository;
        this.motoristaRepository = motoristaRepository;
        this.veiculoRepository = veiculoRepository;
        this.motoristasProximos = motoristasProximos;
        this.buscaFreteService = buscaFreteService;
        // Transação própria e programática: assim nem um rollback interno escapa do try/catch de semDerrubar.
        this.leitura = new TransactionTemplate(transacoes);
        this.leitura.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.leitura.setReadOnly(true);
    }

    /** Frete novo: avisa motoristas cuja base está no raio deles e que têm caminhão que serve. */
    @TransactionalEventListener
    public void fretePublicado(EventosFrete.FretePublicado evento) {
        semDerrubar("frete perto", () -> frete(evento.freteId()).ifPresent(frete -> {
            Optional<Coordenadas> coleta = frete.getPontoColeta().getCoordenadas();
            if (coleta.isEmpty()) {
                return;
            }
            for (UUID motoristaId : motoristasProximos.interessadosEm(coleta.get())) {
                boolean temCaminhaoQueServe = veiculoRepository.findByMotoristaIdAndAtivoTrueOrderByCriadoEm(motoristaId)
                        .stream().anyMatch(frete::aceitaVeiculo);
                if (temCaminhaoQueServe || frete.getEmpresa() == null) {
                    motoristaRepository.findById(motoristaId).ifPresent(m -> enviar(m.getTelefone(),
                            TipoNotificacao.FRETE_PERTO, "Frete novo perto de você: " + rota(frete) + ", "
                                    + valor(frete.getValorTotal()) + ".", rota(frete), valor(frete.getValorTotal())));
                }
            }
        }));
    }

    /** Proposta do motorista avisa o contratante; proposta do contratante avisa o motorista. */
    @TransactionalEventListener
    public void propostaRecebida(EventosFrete.PropostaRecebida evento) {
        semDerrubar("proposta", () -> propostaRepository.findById(evento.propostaId()).ifPresent(p -> {
            String destino = p.feitaPeloMotorista() ? telefoneDoContratante(p.getFrete()) : p.getMotorista().getTelefone();
            String quem = p.feitaPeloMotorista() ? p.getMotorista().getNome() : nomeDoContratante(p.getFrete());
            enviar(destino, TipoNotificacao.PROPOSTA_RECEBIDA, "Proposta de " + quem + " para " + rota(p.getFrete())
                    + ": " + valor(p.getValor()) + ".", quem, rota(p.getFrete()), valor(p.getValor()));
        }));
    }

    /** Aceite: avisa o motorista e já sugere frete de volta. */
    @TransactionalEventListener
    public void freteAceito(EventosFrete.FreteAceito evento) {
        semDerrubar("aceite", () -> frete(evento.freteId()).ifPresent(frete -> {
            Motorista m = frete.getMotorista();
            enviar(m.getTelefone(), TipoNotificacao.FRETE_ACEITO, "Frete fechado: " + rota(frete) + " por "
                    + valor(frete.getValorAcordado()) + ".", rota(frete), valor(frete.getValorAcordado()));

            long retornos = buscaFreteService.filtroDeRetorno(frete)
                    .map(f -> buscaFreteService.buscar(f, PageRequest.of(0, 1)).getTotalElements())
                    .orElse(0L);
            if (retornos > 0) {
                enviar(m.getTelefone(), TipoNotificacao.FRETES_DE_RETORNO, retornos + " frete(s) de volta saindo perto de "
                        + frete.getPontoEntrega().getCidade() + ". Veja no app.", String.valueOf(retornos),
                        frete.getPontoEntrega().getCidade());
            }
        }));
    }

    @TransactionalEventListener
    public void pagamentoRetido(EventosPagamento.PagamentoRetido evento) {
        semDerrubar("pagamento retido", () -> frete(evento.freteId()).ifPresent(frete ->
                enviar(frete.getMotorista().getTelefone(), TipoNotificacao.PAGAMENTO_RETIDO, "Pagamento de "
                        + valor(evento.valor()) + " garantido para o frete " + rota(frete) + ". Pode carregar.",
                        valor(evento.valor()), rota(frete))));
    }

    @TransactionalEventListener
    public void saldoLiberado(EventosPagamento.SaldoLiberado evento) {
        semDerrubar("saldo liberado", () -> frete(evento.freteId()).ifPresent(frete ->
                enviar(frete.getMotorista().getTelefone(), TipoNotificacao.SALDO_LIBERADO, "Saldo de "
                        + valor(evento.valor()) + " do frete " + rota(frete) + " liberado na sua chave Pix.",
                        valor(evento.valor()), rota(frete))));
    }

    /** Quem recebeu a carga ganha o código para contestar, se algo estiver errado. */
    @TransactionalEventListener
    public void entregaRegistrada(EventosEntrega.CanhotoRegistrado evento) {
        semDerrubar("entrega registrada", () -> frete(evento.freteId()).ifPresent(frete -> {
            String telefone = frete.getTelefoneDestinatario() != null ? frete.getTelefoneDestinatario()
                    : telefoneDoContratante(frete);
            String prazo = DATA_HORA.format(evento.contestacaoAte());
            enviar(telefone, TipoNotificacao.ENTREGA_REGISTRADA, "Entrega do frete " + rota(frete)
                    + " registrada. Algo errado? Conteste até " + prazo + " com o código " + evento.codigoContestacao()
                    + ".", rota(frete), prazo, evento.codigoContestacao());
        }));
    }

    private void enviar(String telefone, TipoNotificacao tipo, String texto, String... parametros) {
        if (telefone == null || telefone.isBlank()) {
            return;
        }
        notificador.enviar(new Notificador.Mensagem(telefone, tipo, texto, List.of(parametros)));
    }

    private Optional<Frete> frete(UUID id) {
        return freteRepository.findById(id);
    }

    private static String telefoneDoContratante(Frete f) {
        return f.getEmpresa() != null ? f.getEmpresa().getTelefone() : f.getCliente().getTelefone();
    }

    private static String nomeDoContratante(Frete f) {
        return f.getEmpresa() != null
                ? (f.getEmpresa().getNomeFantasia() != null ? f.getEmpresa().getNomeFantasia() : f.getEmpresa().getRazaoSocial())
                : f.getCliente().getNome();
    }

    private static String rota(Frete f) {
        return f.getPontoColeta().getCidade() + "/" + f.getPontoColeta().getUf() + " → "
                + f.getPontoEntrega().getCidade() + "/" + f.getPontoEntrega().getUf();
    }

    private static String valor(BigDecimal v) {
        return v == null ? "valor a combinar" : NumberFormat.getCurrencyInstance(Locale.of("pt", "BR")).format(v);
    }

    private void semDerrubar(String aviso, Runnable acao) {
        try {
            leitura.executeWithoutResult(status -> acao.run());
        } catch (RuntimeException e) {
            log.warn("Aviso de {} não enviado: {}", aviso, e.getMessage());
        }
    }
}
