package br.com.fretai.veiculo.application.dto;

import br.com.fretai.veiculo.domain.TipoCarroceria;
import br.com.fretai.veiculo.domain.TipoVeiculo;
import br.com.fretai.veiculo.domain.Veiculo;
import java.time.Instant;
import java.util.UUID;

public record VeiculoResponse(UUID id, UUID motoristaId, String placa, String rntrc, TipoVeiculo tipo,
                              TipoCarroceria carroceria, int numeroEixos, boolean rastreador, Instant criadoEm) {

    public static VeiculoResponse de(Veiculo v) {
        return new VeiculoResponse(v.getId(), v.getMotorista().getId(), v.getPlaca(), v.getRntrc(), v.getTipo(),
                v.getCarroceria(), v.getNumeroEixos(), v.isRastreador(), v.getCriadoEm());
    }
}
