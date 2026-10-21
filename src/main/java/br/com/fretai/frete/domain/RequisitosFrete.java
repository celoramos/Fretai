package br.com.fretai.frete.domain;

import br.com.fretai.veiculo.domain.TipoCarroceria;
import br.com.fretai.veiculo.domain.TipoVeiculo;
import java.util.Set;

/**
 * Que tipo de caminhão serve para o frete.
 *
 * @param veiculosAceitos     vazio = qualquer tipo
 * @param carroceriasAceitas  vazio = qualquer carroceria
 * @param complemento         a carga não ocupa o caminhão inteiro; o motorista pode completar com outra
 */
public record RequisitosFrete(Set<TipoVeiculo> veiculosAceitos, Set<TipoCarroceria> carroceriasAceitas,
                              boolean exigeRastreador, boolean complemento) {

    public RequisitosFrete {
        veiculosAceitos = veiculosAceitos == null ? Set.of() : Set.copyOf(veiculosAceitos);
        carroceriasAceitas = carroceriasAceitas == null ? Set.of() : Set.copyOf(carroceriasAceitas);
    }
}
