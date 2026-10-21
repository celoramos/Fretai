package br.com.fretai.empresa.domain;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioEmpresaRepository extends JpaRepository<UsuarioEmpresa, UUID> {
}
