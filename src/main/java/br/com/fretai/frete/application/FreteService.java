package br.com.fretai.frete.application;

import br.com.fretai.frete.application.dto.FreteResponse;
import br.com.fretai.frete.application.dto.SolicitarFreteRequest;
import br.com.fretai.frete.domain.EnderecoFrete;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.FreteRepository;
import br.com.fretai.frete.domain.StatusFrete;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.usuario.domain.Cliente;
import br.com.fretai.usuario.domain.ClienteRepository;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.MotoristaRepository;
import java.util.UUID;
import java.util.function.Consumer;
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
    private final PreparacaoFrete preparacao;

    public FreteService(FreteRepository freteRepository, ClienteRepository clienteRepository,
                        MotoristaRepository motoristaRepository, PreparacaoFrete preparacao) {
        this.freteRepository = freteRepository;
        this.clienteRepository = clienteRepository;
        this.motoristaRepository = motoristaRepository;
        this.preparacao = preparacao;
    }

    @Transactional
    public FreteResponse solicitar(SolicitarFreteRequest request) {
        Cliente cliente = clienteRepository.findById(request.clienteId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente não encontrado."));

        EnderecoFrete coleta = preparacao.montarEndereco(request.coleta());
        EnderecoFrete entrega = preparacao.montarEndereco(request.entrega());

        Frete frete = new Frete(cliente, coleta, entrega,
                request.nomeDestinatario(), request.telefoneDestinatario(),
                request.descricaoCarga(), request.pesoKg(), request.valor(), request.dataColeta());
        preparacao.completar(frete, request.dataColeta());
        return FreteResponse.de(freteRepository.save(frete));
    }

    @Transactional(readOnly = true)
    public FreteResponse buscar(UUID freteId) {
        return FreteResponse.de(carregar(freteId));
    }

    @Transactional(readOnly = true)
    public Page<FreteResponse> listarPorStatus(StatusFrete status, Pageable pageable) {
        return freteRepository.findByStatus(status, pageable).map(FreteResponse::de);
    }

    @Transactional
    public FreteResponse aceitar(UUID freteId, UUID motoristaId) {
        Motorista motorista = motoristaRepository.findById(motoristaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Motorista não encontrado."));
        return transicionar(freteId, frete -> frete.aceitar(motorista));
    }

    @Transactional
    public FreteResponse iniciarTransporte(UUID freteId) {
        return transicionar(freteId, Frete::iniciarTransporte);
    }

    @Transactional
    public FreteResponse concluirEntrega(UUID freteId) {
        return transicionar(freteId, Frete::concluir);
    }

    @Transactional
    public FreteResponse cancelar(UUID freteId, String motivo) {
        return transicionar(freteId, frete -> frete.cancelar(motivo));
    }

    private FreteResponse transicionar(UUID freteId, Consumer<Frete> transicao) {
        Frete frete = carregar(freteId);
        transicao.accept(frete);
        // saveAndFlush força o UPDATE agora: se outro request alterou o frete
        // no meio do caminho, o @Version estoura aqui e vira 409.
        return FreteResponse.de(freteRepository.saveAndFlush(frete));
    }

    private Frete carregar(UUID freteId) {
        return freteRepository.findById(freteId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Frete não encontrado."));
    }
}
