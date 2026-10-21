package br.com.fretai.frete.application;

import br.com.fretai.calendario.application.CalendarioService;
import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.EnderecoGateway;
import br.com.fretai.endereco.domain.GeocodificacaoGateway;
import br.com.fretai.frete.application.dto.EnderecoRequest;
import br.com.fretai.frete.application.dto.FreteResponse;
import br.com.fretai.frete.application.dto.SolicitarFreteRequest;
import br.com.fretai.frete.domain.EnderecoFrete;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.FreteRepository;
import br.com.fretai.frete.domain.StatusFrete;
import br.com.fretai.rota.domain.Rota;
import br.com.fretai.rota.domain.RotaGateway;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.usuario.domain.Cliente;
import br.com.fretai.usuario.domain.ClienteRepository;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.MotoristaRepository;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;
import org.springframework.beans.factory.annotation.Value;
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
    private final EnderecoGateway enderecoGateway;
    private final GeocodificacaoGateway geocodificacaoGateway;
    private final RotaGateway rotaGateway;
    private final CalendarioService calendarioService;
    private final BigDecimal adicionalFeriadoPercentual;

    public FreteService(FreteRepository freteRepository, ClienteRepository clienteRepository,
                        MotoristaRepository motoristaRepository, EnderecoGateway enderecoGateway,
                        GeocodificacaoGateway geocodificacaoGateway, RotaGateway rotaGateway,
                        CalendarioService calendarioService,
                        @Value("${fretai.frete.adicional-feriado-percentual}") BigDecimal adicionalFeriadoPercentual) {
        this.freteRepository = freteRepository;
        this.clienteRepository = clienteRepository;
        this.motoristaRepository = motoristaRepository;
        this.enderecoGateway = enderecoGateway;
        this.geocodificacaoGateway = geocodificacaoGateway;
        this.rotaGateway = rotaGateway;
        this.calendarioService = calendarioService;
        this.adicionalFeriadoPercentual = adicionalFeriadoPercentual;
    }

    @Transactional
    public FreteResponse solicitar(SolicitarFreteRequest request) {
        Cliente cliente = clienteRepository.findById(request.clienteId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente não encontrado."));

        EnderecoFrete coleta = montarEndereco(request.coleta());
        EnderecoFrete entrega = montarEndereco(request.entrega());

        Frete frete = new Frete(cliente, coleta, entrega,
                request.nomeDestinatario(), request.telefoneDestinatario(),
                request.descricaoCarga(), request.pesoKg(), request.valor(), request.dataColeta());
        calcularRota(coleta, entrega).ifPresent(frete::registrarRota);
        // Se o serviço de feriados cair, o pedido falha (503): melhor que publicar o frete com o preço errado.
        String nomeFeriado = calendarioService.verificar(request.dataColeta()).nomeFeriado();
        if (nomeFeriado != null) {
            frete.registrarFeriado(nomeFeriado, adicionalFeriadoPercentual);
        }
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

    private EnderecoFrete montarEndereco(EnderecoRequest request) {
        Endereco base = enderecoGateway.buscarPorCep(request.cep());
        Coordenadas coordenadas = geocodificacaoGateway.localizar(base, request.numero()).orElse(null);
        return new EnderecoFrete(base, request.numero(), request.complemento(), request.pontoReferencia(), coordenadas);
    }

    /** Sem as duas pontas no mapa não há distância; o frete é criado mesmo assim. */
    private Optional<Rota> calcularRota(EnderecoFrete coleta, EnderecoFrete entrega) {
        Optional<Coordenadas> origem = coleta.getCoordenadas();
        Optional<Coordenadas> destino = entrega.getCoordenadas();
        if (origem.isEmpty() || destino.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(rotaGateway.calcular(origem.get(), destino.get()));
    }
}
