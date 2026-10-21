package br.com.fretai.frete.application;

import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.frete.application.dto.BuscaFreteRequest;
import br.com.fretai.frete.application.dto.FreteEncontradoResponse;
import br.com.fretai.frete.application.dto.FreteResponse;
import br.com.fretai.frete.domain.BuscaFretes;
import br.com.fretai.frete.domain.FiltroBusca;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.FreteRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
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

    public BuscaFreteService(BuscaFretes buscaFretes, FreteRepository freteRepository, PreparacaoFrete preparacao) {
        this.buscaFretes = buscaFretes;
        this.freteRepository = freteRepository;
        this.preparacao = preparacao;
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
                FreteResponse.de(fretes.get(e.freteId()))));
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
