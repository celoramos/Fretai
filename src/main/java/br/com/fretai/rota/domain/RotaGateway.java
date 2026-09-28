package br.com.fretai.rota.domain;

import br.com.fretai.endereco.domain.Coordenadas;

/**
 * Porta de saída para calcular a distância de estrada. Nunca falha: se o roteador
 * estiver fora do ar ou não configurado, devolve uma {@link Rota#estimada() estimativa}.
 */
public interface RotaGateway {

    Rota calcular(Coordenadas origem, Coordenadas destino);
}
