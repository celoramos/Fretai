package br.com.fretai.usuario.application.dto;

import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.TipoVeiculo;
import java.time.Instant;
import java.util.UUID;

public record MotoristaResponse(UUID id, String nome, String email, String telefone,
                                TipoVeiculo tipoVeiculo, String placa, Instant criadoEm) {

    public static MotoristaResponse de(Motorista motorista) {
        return new MotoristaResponse(motorista.getId(), motorista.getNome(), motorista.getEmail(),
                motorista.getTelefone(), motorista.getTipoVeiculo(), motorista.getPlaca(),
                motorista.getCriadoEm());
    }
}
