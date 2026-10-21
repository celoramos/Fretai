package br.com.fretai.usuario.domain;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MotoristaRepository extends JpaRepository<Motorista, UUID> {

    boolean existsByPlaca(String placa);

    Page<Motorista> findByAtivoTrue(Pageable pageable);
}
