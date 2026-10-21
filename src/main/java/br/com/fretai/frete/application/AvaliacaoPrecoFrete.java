package br.com.fretai.frete.application;

import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.FreteRepository;
import br.com.fretai.frete.domain.MediaPrecoRota;
import br.com.fretai.precificacao.application.PrecificacaoService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * Junta o que o frete sabe (valor, distância, UFs, tipo de carga, eixos) com a
 * média de fretes parecidos e pede ao módulo de precificação o piso e os alertas.
 */
@Component
public class AvaliacaoPrecoFrete {

    private final FreteRepository freteRepository;
    private final PrecificacaoService precificacao;

    public AvaliacaoPrecoFrete(FreteRepository freteRepository, PrecificacaoService precificacao) {
        this.freteRepository = freteRepository;
        this.precificacao = precificacao;
    }

    public void avaliar(Frete frete) {
        BigDecimal km = frete.getDistanciaKm();
        MediaPrecoRota media = mediaDaRota(frete, km);
        frete.registrarAvaliacaoPreco(precificacao.avaliar(frete.valorEmAvaliacao(), frete.getTipoCargaAntt(),
                frete.eixosParaPiso(), km, media == null ? null : media.mediaPorKm(),
                media == null ? 0 : Objects.requireNonNullElse(media.amostras(), 0L)));
    }

    private MediaPrecoRota mediaDaRota(Frete frete, BigDecimal km) {
        String ufOrigem = frete.getPontoColeta().getUf();
        String ufDestino = frete.getPontoEntrega().getUf();
        if (km == null || km.signum() <= 0 || ufOrigem == null || ufDestino == null) {
            return null;
        }
        BigDecimal tolerancia = BigDecimal.valueOf(precificacao.toleranciaDistancia());
        BigDecimal minimo = km.multiply(BigDecimal.ONE.subtract(tolerancia));
        BigDecimal maximo = km.multiply(BigDecimal.ONE.add(tolerancia));
        // Frete ainda não salvo não tem id; um id que não existe faz o filtro não excluir ninguém.
        UUID ignorar = frete.getId() != null ? frete.getId() : UUID.randomUUID();
        return freteRepository.mediaDaRota(ufOrigem, ufDestino, minimo, maximo,
                Instant.now().minus(precificacao.janelaMedia()), ignorar);
    }
}
