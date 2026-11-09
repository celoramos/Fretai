package br.com.fretai.frete.application;

import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.frete.application.dto.BuscaFreteRequest;
import br.com.fretai.frete.application.dto.FreteEncontradoResponse;
import br.com.fretai.frete.application.dto.FreteResponse;
import br.com.fretai.frete.domain.BuscaFretes;
import br.com.fretai.frete.domain.FiltroBusca;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.FreteRepository;
import br.com.fretai.frete.domain.OpcaoFiltro;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import br.com.fretai.veiculo.domain.TipoCarroceria;
import br.com.fretai.veiculo.domain.TipoVeiculo;
import br.com.fretai.veiculo.domain.Veiculo;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** "Fretes perto de mim": resolve a origem, busca por raio e monta a resposta na ordem da distância. */
@Service
public class BuscaFreteService {

    private final BuscaFretes buscaFretes;
    private final FreteRepository freteRepository;
    private final PreparacaoFrete preparacao;
    private final double raioRetornoKm;

    public BuscaFreteService(BuscaFretes buscaFretes, FreteRepository freteRepository, PreparacaoFrete preparacao,
                             @Value("${fretai.retorno.raio-km}") double raioRetornoKm) {
        this.buscaFretes = buscaFretes;
        this.freteRepository = freteRepository;
        this.preparacao = preparacao;
        this.raioRetornoKm = raioRetornoKm;
    }

    @Transactional(readOnly = true)
    public Page<FreteEncontradoResponse> buscar(BuscaFreteRequest request, Pageable pageable) {
        Coordenadas origem = resolver(request.origemLat(), request.origemLng(), request.origemCep());
        Coordenadas destino = resolver(request.destinoLat(), request.destinoLng(), request.destinoCep());
        FiltroBusca filtro = new FiltroBusca(origem, request.raioOuPadrao(), destino, request.raioDestinoOuPadrao(),
                request.tipoVeiculo(), request.carroceria(), request.exigeRastreador(), request.agenciador(),
                request.comPreco(), request.complemento());
        return buscar(filtro, pageable);
    }

    /** Também usado pela sugestão de frete de retorno. */
    @Transactional(readOnly = true)
    public Page<FreteEncontradoResponse> buscar(FiltroBusca filtro, Pageable pageable) {
        Page<BuscaFretes.Encontrado> encontrados = buscaFretes.buscar(filtro, pageable);
        Map<UUID, Frete> fretes = freteRepository.findAllById(
                        encontrados.map(BuscaFretes.Encontrado::freteId).getContent()).stream()
                .collect(Collectors.toMap(Frete::getId, Function.identity()));
        // findAllById não garante ordem: a da busca (por distância) é a que vale.
        return encontrados.map(e -> new FreteEncontradoResponse(arredondar(e.distanciaKm()),
                FreteResponse.publico(fretes.get(e.freteId()))));
    }

    /**
     * Frete de retorno: o motorista que vai levar esta carga provavelmente volta vazio.
     * Sugere fretes que saem perto do destino dele e que o caminhão dele pode fazer.
     */
    @Transactional(readOnly = true)
    public Page<FreteEncontradoResponse> sugerirRetorno(UUID freteId, UsuarioLogado quem, Pageable pageable) {
        Frete ida = freteRepository.findById(freteId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Frete não encontrado."));
        FreteService.exigir(quem.isAdmin() || ida.ehMotoristaDoFrete(quem), "Só o motorista do frete vê sugestões de retorno.");
        Optional<FiltroBusca> filtro = filtroDeRetorno(ida);
        return filtro.isEmpty() ? Page.empty(pageable) : buscar(filtro.get(), pageable);
    }

    /** Vazio quando o destino não tem coordenadas (não há onde centrar a busca). */
    public Optional<FiltroBusca> filtroDeRetorno(Frete ida) {
        Optional<Coordenadas> destino = ida.getPontoEntrega().getCoordenadas();
        if (destino.isEmpty()) {
            return Optional.empty();
        }
        Veiculo caminhao = ida.getVeiculo();
        Set<TipoVeiculo> tipos = caminhao == null ? Set.of() : Set.of(caminhao.getTipo());
        Set<TipoCarroceria> carrocerias = caminhao == null ? Set.of() : Set.of(caminhao.getCarroceria());
        // Sem rastreador, só fretes que não exigem; com rastreador, qualquer um.
        OpcaoFiltro rastreador = caminhao != null && !caminhao.isRastreador() ? OpcaoFiltro.NAO : OpcaoFiltro.AMBOS;
        return Optional.of(new FiltroBusca(destino.get(), raioRetornoKm, null, 0, tipos, carrocerias, rastreador,
                OpcaoFiltro.AMBOS, OpcaoFiltro.AMBOS, OpcaoFiltro.AMBOS));
    }

    /** Coordenada direta tem prioridade; senão, localiza o CEP; sem nenhum dos dois, não há ponto. */
    private Coordenadas resolver(Double lat, Double lng, String cep) {
        if (lat != null && lng != null) {
            return new Coordenadas(lat, lng);
        }
        return cep == null ? null : preparacao.localizarCep(cep);
    }

    private static double arredondar(double km) {
        return BigDecimal.valueOf(km).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }
}
