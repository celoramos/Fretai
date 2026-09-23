package br.com.fretai.usuario.domain;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    boolean existsByCpf(String cpf);

    boolean existsByEmailIgnoreCase(String email);
}
