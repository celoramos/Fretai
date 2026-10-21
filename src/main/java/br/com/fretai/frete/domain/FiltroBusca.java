package br.com.fretai.frete.domain;

import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.veiculo.domain.TipoCarroceria;
import br.com.fretai.veiculo.domain.TipoVeiculo;
import java.util.Objects;
import java.util.Set;

/**
 * O que o motorista procura. Tipo de veículo e carroceria são "o que eu tenho":
 * aparecem os fretes que aceitam esse tipo ou que aceitam qualquer um.
 *
 * @param destino nulo = qualquer destino
 */
public record FiltroBusca(Coordenadas origem, double raioKm, Coordenadas destino, double raioDestinoKm,
                          Set<TipoVeiculo> tiposVeiculo, Set<TipoCarroceria> carrocerias,
                          OpcaoFiltro exigeRastreador, OpcaoFiltro agenciador, OpcaoFiltro comPreco,
                          OpcaoFiltro complemento) {

    /** Só aparece o que ainda está aberto para negociação. */
    public static final Set<StatusFrete> STATUS_VISIVEIS = Set.of(StatusFrete.PENDENTE);

    public FiltroBusca {
        Objects.requireNonNull(origem, "A origem é obrigatória.");
        if (raioKm <= 0) {
            throw new IllegalArgumentException("O raio deve ser maior que zero.");
        }
        tiposVeiculo = tiposVeiculo == null ? Set.of() : Set.copyOf(tiposVeiculo);
        carrocerias = carrocerias == null ? Set.of() : Set.copyOf(carrocerias);
        exigeRastreador = Objects.requireNonNullElse(exigeRastreador, OpcaoFiltro.AMBOS);
        agenciador = Objects.requireNonNullElse(agenciador, OpcaoFiltro.AMBOS);
        comPreco = Objects.requireNonNullElse(comPreco, OpcaoFiltro.AMBOS);
        complemento = Objects.requireNonNullElse(complemento, OpcaoFiltro.AMBOS);
    }
}
