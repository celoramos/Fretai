package br.com.fretai.usuario.application.dto;

import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.CategoriaVeiculo;
import java.time.Instant;
import java.util.UUID;

/** @param temChavePix a chave em si não aparece: só o motorista e o PSP precisam dela */
public record MotoristaResponse(UUID id, String nome, String email, String telefone,
                                CategoriaVeiculo tipoVeiculo, String placa, boolean aceitaFeriado,
                                boolean temChavePix, Instant criadoEm) {

    public static MotoristaResponse de(Motorista motorista) {
        return new MotoristaResponse(motorista.getId(), motorista.getNome(), motorista.getEmail(),
                motorista.getTelefone(), motorista.getTipoVeiculo(), motorista.getPlaca(),
                motorista.isAceitaFeriado(), motorista.getChavePix() != null, motorista.getCriadoEm());
    }
}
