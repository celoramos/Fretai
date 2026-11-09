package br.com.fretai.veiculo.application.dto;

import br.com.fretai.usuario.domain.CategoriaVeiculo;
import br.com.fretai.veiculo.domain.TipoCarroceria;
import br.com.fretai.veiculo.domain.TipoVeiculo;
import br.com.fretai.veiculo.domain.Veiculo;
import java.time.Instant;
import java.util.UUID;

/** Os dados de caminhão (rntrc, tipo, carroceria, eixos) vêm nulos no veículo de frete avulso. */
public record VeiculoResponse(UUID id, UUID motoristaId, String placa, CategoriaVeiculo categoria, String modelo,
                              String rntrc, TipoVeiculo tipo, TipoCarroceria carroceria, Integer numeroEixos,
                              boolean rastreador, Instant criadoEm) {

    public static VeiculoResponse de(Veiculo v) {
        return new VeiculoResponse(v.getId(), v.getMotorista().getId(), v.getPlaca(), v.getCategoria(), v.getModelo(),
                v.getRntrc(), v.getTipo(), v.getCarroceria(), v.getNumeroEixos(), v.isRastreador(), v.getCriadoEm());
    }
}
