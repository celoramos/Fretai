package br.com.fretai.frete.application;

import br.com.fretai.calendario.application.CalendarioService;
import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.EnderecoGateway;
import br.com.fretai.endereco.domain.GeocodificacaoGateway;
import br.com.fretai.frete.application.dto.EnderecoRequest;
import br.com.fretai.frete.domain.EnderecoFrete;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.rota.domain.RotaGateway;
import br.com.fretai.shared.exception.RegraNegocioException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * O que todo frete novo precisa antes de ser gravado, venha de cliente ou de
 * empresa: endereço pelo CEP, ponto no mapa, distância e feriado na data da coleta.
 */
@Component
public class PreparacaoFrete {

    private final EnderecoGateway enderecoGateway;
    private final GeocodificacaoGateway geocodificacaoGateway;
    private final RotaGateway rotaGateway;
    private final CalendarioService calendarioService;
    private final BigDecimal adicionalFeriadoPercentual;
    private final AvaliacaoPrecoFrete avaliacaoPreco;

    public PreparacaoFrete(EnderecoGateway enderecoGateway, GeocodificacaoGateway geocodificacaoGateway,
                           RotaGateway rotaGateway, CalendarioService calendarioService,
                           @Value("${fretai.frete.adicional-feriado-percentual}") BigDecimal adicionalFeriadoPercentual,
                           AvaliacaoPrecoFrete avaliacaoPreco) {
        this.enderecoGateway = enderecoGateway;
        this.geocodificacaoGateway = geocodificacaoGateway;
        this.rotaGateway = rotaGateway;
        this.calendarioService = calendarioService;
        this.adicionalFeriadoPercentual = adicionalFeriadoPercentual;
        this.avaliacaoPreco = avaliacaoPreco;
    }

    public EnderecoFrete montarEndereco(EnderecoRequest request) {
        Endereco base = enderecoGateway.buscarPorCep(request.cep());
        Coordenadas coordenadas = request.temCoordenadas()
                ? new Coordenadas(request.latitude(), request.longitude())
                : geocodificacaoGateway.localizar(base, request.numero()).orElse(null);
        return new EnderecoFrete(base, request.numero(), request.complemento(), request.pontoReferencia(), coordenadas);
    }

    /**
     * Ponto no mapa de um CEP, para buscas. Aqui a coordenada é obrigatória: sem
     * ela não há como medir raio.
     */
    public Coordenadas localizarCep(String cep) {
        Endereco endereco = enderecoGateway.buscarPorCep(cep);
        return geocodificacaoGateway.localizar(endereco, null)
                .orElseThrow(() -> new RegraNegocioException("Não foi possível localizar o CEP " + cep
                        + " no mapa. Informe latitude e longitude."));
    }

    /** Refaz piso e alertas com o caminhão e o valor do aceite. */
    public void reavaliarPreco(Frete frete) {
        avaliacaoPreco.avaliar(frete);
    }

    /** Distância (se as duas pontas estão no mapa), adicional de feriado e avaliação do preço. */
    public void completar(Frete frete, LocalDate dataColeta) {
        Optional<Coordenadas> origem = frete.getPontoColeta().getCoordenadas();
        Optional<Coordenadas> destino = frete.getPontoEntrega().getCoordenadas();
        if (origem.isPresent() && destino.isPresent()) {
            frete.registrarRota(rotaGateway.calcular(origem.get(), destino.get()));
        }
        // Se o serviço de feriados cair, o pedido falha (503): melhor que publicar o frete com o preço errado.
        String nomeFeriado = calendarioService.verificar(dataColeta).nomeFeriado();
        if (nomeFeriado != null) {
            frete.registrarFeriado(nomeFeriado, adicionalFeriadoPercentual);
        }
        avaliacaoPreco.avaliar(frete);
    }
}
