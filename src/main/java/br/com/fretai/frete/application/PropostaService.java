package br.com.fretai.frete.application;

import br.com.fretai.frete.application.dto.PropostaRequest;
import br.com.fretai.frete.application.dto.PropostaResponse;
import br.com.fretai.frete.domain.Autor;
import br.com.fretai.frete.domain.EventosFrete;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.FreteRepository;
import br.com.fretai.frete.domain.Proposta;
import br.com.fretai.frete.domain.PropostaRepository;
import br.com.fretai.frete.domain.StatusFrete;
import br.com.fretai.frete.domain.StatusProposta;
import br.com.fretai.shared.exception.ConflitoException;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.shared.seguranca.Papel;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.MotoristaRepository;
import br.com.fretai.veiculo.domain.Veiculo;
import br.com.fretai.veiculo.domain.VeiculoRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static br.com.fretai.frete.application.FreteService.exigir;

/**
 * Negociação de um frete. Regras de quem pode o quê:
 * <ul>
 *   <li>motorista propõe com um dos seus caminhões; contratante propõe a um motorista;</li>
 *   <li>só a outra parte aceita ou recusa; só quem enviou retira;</li>
 *   <li>um motorista tem no máximo uma proposta aberta por frete.</li>
 * </ul>
 */
@Service
public class PropostaService {

    private final PropostaRepository propostaRepository;
    private final FreteRepository freteRepository;
    private final MotoristaRepository motoristaRepository;
    private final VeiculoRepository veiculoRepository;
    private final PreparacaoFrete preparacao;
    private final ApplicationEventPublisher eventos;

    public PropostaService(PropostaRepository propostaRepository, FreteRepository freteRepository,
                           MotoristaRepository motoristaRepository, VeiculoRepository veiculoRepository,
                           PreparacaoFrete preparacao, ApplicationEventPublisher eventos) {
        this.propostaRepository = propostaRepository;
        this.freteRepository = freteRepository;
        this.motoristaRepository = motoristaRepository;
        this.veiculoRepository = veiculoRepository;
        this.preparacao = preparacao;
        this.eventos = eventos;
    }

    @Transactional
    public PropostaResponse enviar(UUID freteId, PropostaRequest request, UsuarioLogado quem) {
        Frete frete = carregarFrete(freteId);
        Motorista motorista;
        Veiculo veiculo = null;

        if (quem.papel() == Papel.MOTORISTA) {
            motorista = carregarMotorista(quem.id());
            if (request.veiculoId() != null) {
                veiculo = carregarVeiculo(request.veiculoId(), motorista.getId());
            } else if (frete.getEmpresa() != null) {
                throw new RegraNegocioException("Informe com qual veículo você fará o frete.");
            }
            frete.exigirVeiculoDoTamanho(motorista);
            if (veiculo != null && !frete.aceitaVeiculo(veiculo)) {
                throw new RegraNegocioException("O veículo " + veiculo.getPlaca()
                        + " não atende ao tipo, carroceria ou rastreador exigidos pelo frete.");
            }
        } else {
            exigir(frete.ehContratante(quem), "Só quem publicou o frete propõe a um motorista.");
            if (request.motoristaId() == null) {
                throw new RegraNegocioException("Informe o motorista que vai receber a proposta.");
            }
            motorista = carregarMotorista(request.motoristaId());
        }
        if (propostaRepository.existsByFreteIdAndMotoristaIdAndStatus(freteId, motorista.getId(),
                StatusProposta.ENVIADA)) {
            throw new ConflitoException("Já existe uma proposta em aberto entre este motorista e este frete.");
        }

        Autor autor = Autor.de(quem);
        frete.receberProposta(autor);
        Proposta proposta = propostaRepository.save(new Proposta(frete, motorista, veiculo, autor, request.valor(),
                request.adiantamentoPercentual(), request.prazoEntrega(), request.observacao()));
        freteRepository.saveAndFlush(frete);
        eventos.publishEvent(new EventosFrete.PropostaRecebida(proposta.getId()));
        return PropostaResponse.de(proposta);
    }

    /** Contratante vê todas; motorista vê só as dele. */
    @Transactional(readOnly = true)
    public List<PropostaResponse> listarDoFrete(UUID freteId, UsuarioLogado quem) {
        Frete frete = carregarFrete(freteId);
        boolean veTudo = quem.isAdmin() || frete.ehContratante(quem);
        exigir(veTudo || quem.papel() == Papel.MOTORISTA, "Só quem participa da negociação vê as propostas.");
        return propostaRepository.findByFreteIdOrderByCriadaEm(freteId).stream()
                .filter(p -> veTudo || p.getMotorista().getId().equals(quem.id()))
                .map(PropostaResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<PropostaResponse> listarDoMotorista(UsuarioLogado quem, Pageable pageable) {
        return propostaRepository.findByMotoristaId(quem.id(), pageable).map(PropostaResponse::de);
    }

    @Transactional
    public PropostaResponse aceitar(UUID propostaId, UUID veiculoId, UsuarioLogado quem) {
        Proposta proposta = carregar(propostaId);
        exigirOutraParte(proposta, quem);
        Frete frete = proposta.getFrete();
        Veiculo veiculo = veiculoId == null ? null : carregarVeiculo(veiculoId, proposta.getMotorista().getId());

        frete.aceitarProposta(proposta, veiculo, Autor.de(quem));
        preparacao.reavaliarPreco(frete);
        propostaRepository.findByFreteIdAndStatus(frete.getId(), StatusProposta.ENVIADA)
                .forEach(Proposta::encerrarPorOutraAceita);
        freteRepository.saveAndFlush(frete);
        eventos.publishEvent(new EventosFrete.FreteAceito(frete.getId()));
        return PropostaResponse.de(proposta);
    }

    @Transactional
    public PropostaResponse recusar(UUID propostaId, UsuarioLogado quem) {
        Proposta proposta = carregar(propostaId);
        exigirOutraParte(proposta, quem);
        proposta.recusar();
        reabrirSeNaoSobrouNenhuma(proposta.getFrete(), quem);
        return PropostaResponse.de(proposta);
    }

    @Transactional
    public PropostaResponse retirar(UUID propostaId, UsuarioLogado quem) {
        Proposta proposta = carregar(propostaId);
        boolean autor = proposta.feitaPeloMotorista()
                ? proposta.getMotorista().getId().equals(quem.id())
                : proposta.getFrete().ehContratante(quem);
        exigir(autor, "Só quem enviou a proposta pode retirá-la.");
        proposta.retirar();
        reabrirSeNaoSobrouNenhuma(proposta.getFrete(), quem);
        return PropostaResponse.de(proposta);
    }

    /** Proposta do motorista é respondida pelo contratante, e vice-versa. */
    private static void exigirOutraParte(Proposta proposta, UsuarioLogado quem) {
        boolean outraParte = proposta.feitaPeloMotorista()
                ? proposta.getFrete().ehContratante(quem)
                : proposta.getMotorista().getId().equals(quem.id());
        exigir(outraParte, "Só a outra parte da negociação responde a esta proposta.");
    }

    private void reabrirSeNaoSobrouNenhuma(Frete frete, UsuarioLogado quem) {
        // A proposta respondida ainda pode não ter ido ao banco: confere em memória também.
        boolean sobrouAberta = propostaRepository.findByFreteIdAndStatus(frete.getId(), StatusProposta.ENVIADA)
                .stream().anyMatch(Proposta::isAberta);
        if (!sobrouAberta && frete.getStatus() == StatusFrete.PROPOSTA_ENVIADA) {
            frete.reabrir(Autor.de(quem));
            freteRepository.saveAndFlush(frete);
        }
    }

    private Proposta carregar(UUID propostaId) {
        return propostaRepository.findById(propostaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Proposta não encontrada."));
    }

    private Frete carregarFrete(UUID freteId) {
        return freteRepository.findById(freteId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Frete não encontrado."));
    }

    private Motorista carregarMotorista(UUID motoristaId) {
        return motoristaRepository.findById(motoristaId)
                .filter(Motorista::isAtivo)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Motorista não encontrado."));
    }

    private Veiculo carregarVeiculo(UUID veiculoId, UUID motoristaId) {
        return veiculoRepository.findById(veiculoId)
                .filter(v -> v.pertenceA(motoristaId) && v.isAtivo())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Veículo não encontrado."));
    }
}
