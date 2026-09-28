package br.com.fretai.endereco.domain;

import java.util.Optional;

/**
 * Porta de saída para transformar um endereço em coordenadas. É um enriquecimento:
 * se o provedor não achar o endereço ou estiver fora do ar, devolve vazio em vez
 * de lançar exceção, e o frete é criado mesmo assim, só que sem distância.
 */
public interface GeocodificacaoGateway {

    Optional<Coordenadas> localizar(Endereco endereco, String numero);
}
