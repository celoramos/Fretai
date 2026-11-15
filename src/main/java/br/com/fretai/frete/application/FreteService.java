package br.com.fretai.frete.application;

import br.com.fretai.empresa.domain.Empresa;
import br.com.fretai.frete.application.dto.ContatoResponse;
import br.com.fretai.frete.application.dto.EventoFreteResponse;
import br.com.fretai.frete.application.dto.FreteResponse;
import br.com.fretai.frete.application.dto.SolicitarFreteRequest;
import br.com.fretai.frete.domain.Autor;
import br.com.fretai.frete.domain.EnderecoFrete;
import br.com.fretai.frete.domain.EventosFrete;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.FreteRepository;
import br.com.fretai.frete.domain.GarantiaDoFrete;
import br.com.fretai.frete.domain.PropostaRepository;
import br.com.fretai.frete.domain.StatusFrete;
import br.com.fretai.shared.exception.AcessoNegadoException;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import br.com.fretai.usuario.domain.Cliente;
import br.com.fretai.usuario.domain.ClienteRepository;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.MotoristaRepository;
import br.com.fretai.veiculo.domain.Veiculo;
import br.com.fretai.veiculo.domain.VeiculoRepository;
import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Orquestra os casos de uso de frete: carrega o que precisa, delega a regra
 * para a entidade {@link Frete} e devolve um DTO. As regras de transição de
 * status moram na entidade, não aqui.
 */
@Service
public class FreteService {

    private final FreteRepository freteRepository;
    private final ClienteRepository clienteRepository;
    private final MotoristaRepository motoristaRepository;
    private final VeiculoRepository veiculoRepository;
    private final PropostaRepository propostaRepository;
    private final PreparacaoFrete preparacao;
    private final GarantiaDoFrete garantia;
    private final ApplicationEventPublisher eventos;

    public FreteService(FreteRepository freteRepository, ClienteRepository clienteRepository,
                        MotoristaRepository motoristaRepository, VeiculoRepository veiculoRepository,
                        PropostaRepository propostaRepository, PreparacaoFrete preparacao,
                        GarantiaDoFrete garantia, ApplicationEventPublisher eventos) {
        this.freteRepository = freteRepository;
        this.clienteRepository = clienteRepository;
        this.motoristaRepository = motoristaRepository;
        this.veiculoRepository = veiculoRepository;
        this.propostaRepository = propostaRepository;
        this.preparacao = preparacao;
        this.garantia = garantia;
        this.eventos = eventos;
    }

    @Transactional
    public FreteResponse solicitar(SolicitarFreteRequest request) {
        Cliente cliente = clienteRepository.findById(request.clienteId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente não encontrado."));

        EnderecoFrete coleta = preparacao.montarEndereco(request.coleta());
        EnderecoFrete entrega = preparacao.montarEndereco(request.entrega());

        Frete frete = new Frete(cliente, coleta, entrega,
                request.nomeDestinatario(), request.telefoneDestinatario(),
                request.descricaoCarga(), request.pesoKg(), request.valor(), request.dataColeta(),
                request.categoriaVeiculo(), request.tipoCarga());
        preparacao.completar(frete, request.dataColeta());
        Frete salvo = freteRepository.save(frete);
        eventos.publishEvent(new EventosFrete.FretePublicado(salvo.getId()));
        return FreteResponse.de(salvo);
    }

    @Transactional(readOnly = true)
    public FreteResponse buscar(UUID freteId, UsuarioLogado quem) {
        return FreteResponse.de(carregar(freteId), quem);
    }

    /** Os fretes que um cliente pediu; quem pode ver a lista o controller já conferiu. */
    @Transactional(readOnly = true)
    public Page<FreteResponse> listarDoCliente(UUID clienteId, Pageable pageable) {
        return freteRepository.findByClienteId(clienteId, pageable).map(FreteResponse::de);
    }

    @Transactional(readOnly = true)
    public Page<FreteResponse> listarPorStatus(StatusFrete status, Pageable pageable, UsuarioLogado quem) {
        return freteRepository.findByStatus(status, pageable).map(f -> FreteResponse.de(f, quem));
    }

    /** Trilha de auditoria: só quem participa do frete (ou um administrador) vê. */
    @Transactional(readOnly = true)
    public List<EventoFreteResponse> historico(UUID freteId, UsuarioLogado quem) {
        Frete frete = carregar(freteId);
        exigir(quem.isAdmin() || frete.ehContratante(quem) || frete.ehMotoristaDoFrete(quem),
                "Só quem participa do frete vê o histórico.");
        return frete.getEventos().stream().map(EventoFreteResponse::de).toList();
    }

    /**
     * O outro lado do frete, para o WhatsApp: o motorista recebe quem contratou (o cliente ou a empresa) e
     * quem contratou recebe o motorista. Só depois de fechar e enquanto o frete anda; antes do aceite o
     * telefone não sai, para ninguém fechar por fora.
     */
    @Transactional(readOnly = true)
    public ContatoResponse contato(UUID freteId, UsuarioLogado quem) {
        Frete frete = carregar(freteId);
        boolean ehMotorista = frete.ehMotoristaDoFrete(quem);
        exigir(ehMotorista || frete.ehContratante(quem), "Só quem participa do frete vê o contato.");
        switch (frete.getStatus()) {
            case PUBLICADO, PROPOSTA_ENVIADA -> throw new RegraNegocioException("O contato aparece depois que o frete fecha.");
            case PAGO, CANCELADO -> throw new RegraNegocioException("Este frete já terminou.");
            default -> {
            }
        }
        if (!ehMotorista) {
            Motorista motorista = frete.getMotorista();
            return new ContatoResponse(motorista.getNome(), motorista.getTelefone());
        }
        Empresa empresa = frete.getEmpresa();
        if (empresa != null) {
            String nome = empresa.getNomeFantasia() != null ? empresa.getNomeFantasia() : empresa.getRazaoSocial();
            return new ContatoResponse(nome, empresa.getTelefone());
        }
        return new ContatoResponse(frete.getCliente().getNome(), frete.getCliente().getTelefone());
    }

    /** Aceite pelo valor anunciado: vira uma proposta do motorista, já aceita. */
    @Transactional
    public FreteResponse aceitar(UUID freteId, UUID motoristaId, UUID veiculoId) {
        Motorista motorista = motoristaRepository.findById(motoristaId)
                .filter(Motorista::isAtivo)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Motorista não encontrado."));
        Veiculo veiculo = veiculoId == null ? null : veiculoRepository.findById(veiculoId)
                .filter(v -> v.pertenceA(motoristaId))
                .orElseThrow(() -> new RecursoNaoEncontradoException("Veículo não encontrado."));
        Autor autor = new Autor(motoristaId, motorista.getPapel());
        FreteResponse aceito = transicionar(freteId, frete -> {
            propostaRepository.save(frete.aceitarPeloValorAnunciado(motorista, veiculo, autor));
            preparacao.reavaliarPreco(frete);
        });
        eventos.publishEvent(new EventosFrete.FreteAceito(freteId));
        return aceito;
    }

    @Transactional
    public FreteResponse iniciarTransporte(UUID freteId, UsuarioLogado quem) {
        return transicionar(freteId, frete -> {
            exigir(quem.isAdmin() || frete.ehMotoristaDoFrete(quem), "Só o motorista do frete inicia o transporte.");
            frete.iniciarTransporte(Autor.de(quem));
            eventos.publishEvent(new EventosFrete.TransporteIniciado(freteId));
        });
    }

    @Transactional
    public FreteResponse concluirEntrega(UUID freteId, UsuarioLogado quem) {
        return transicionar(freteId, frete -> {
            exigir(quem.isAdmin() || frete.ehMotoristaDoFrete(quem), "Só o motorista do frete conclui a entrega.");
            // Fora de EM_TRANSITO quem responde é a máquina de estados, logo abaixo.
            if (frete.getStatus() == StatusFrete.EM_TRANSITO && garantia.dependeDoCanhoto(freteId)) {
                throw new RegraNegocioException("Este frete tem pagamento com garantia: confirme a entrega pelo "
                        + "canhoto digital, que libera o saldo.");
            }
            frete.concluir(Autor.de(quem));
            eventos.publishEvent(new EventosFrete.FreteEntregue(freteId));
        });
    }

    @Transactional
    public FreteResponse cancelar(UUID freteId, String motivo, UsuarioLogado quem) {
        return transicionar(freteId, frete -> {
            exigir(quem.isAdmin() || frete.ehContratante(quem) || frete.ehMotoristaDoFrete(quem),
                    "Só quem contratou ou o motorista do frete pode cancelar.");
            frete.cancelar(motivo, Autor.de(quem));
            eventos.publishEvent(new EventosFrete.FreteCancelado(freteId));
        });
    }

    private FreteResponse transicionar(UUID freteId, Consumer<Frete> transicao) {
        Frete frete = carregar(freteId);
        transicao.accept(frete);
        // saveAndFlush força o UPDATE agora: se outro request alterou o frete
        // no meio do caminho, o @Version estoura aqui e vira 409.
        return FreteResponse.de(freteRepository.saveAndFlush(frete));
    }

    static void exigir(boolean permitido, String mensagem) {
        if (!permitido) {
            throw new AcessoNegadoException(mensagem);
        }
    }

    private Frete carregar(UUID freteId) {
        return freteRepository.findById(freteId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Frete não encontrado."));
    }
}
