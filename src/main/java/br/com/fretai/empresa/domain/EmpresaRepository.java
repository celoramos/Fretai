package br.com.fretai.empresa.domain;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmpresaRepository extends JpaRepository<Empresa, UUID> {

    boolean existsByCnpj(String cnpj);

    Page<Empresa> findByAtivaTrue(Pageable pageable);
}
