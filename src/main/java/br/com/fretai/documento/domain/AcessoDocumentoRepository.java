package br.com.fretai.documento.domain;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AcessoDocumentoRepository extends JpaRepository<AcessoDocumento, UUID> {

    List<AcessoDocumento> findByDocumentoIdOrderByAcessadoEmDesc(UUID documentoId);
}
