package br.com.fretai.usuario.application.dto;

import br.com.fretai.usuario.domain.Cliente;
import java.time.Instant;
import java.util.UUID;

public record ClienteResponse(UUID id, String nome, String email, String telefone, Instant criadoEm) {

    public static ClienteResponse de(Cliente cliente) {
        return new ClienteResponse(cliente.getId(), cliente.getNome(), cliente.getEmail(),
                cliente.getTelefone(), cliente.getCriadoEm());
    }
}
