package br.com.fretai.documento.domain;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface DocumentoRepository extends JpaRepository<Documento, UUID> {

    List<Documento> findByFreteIdOrderByCriadoEm(UUID freteId);

    @Query("SELECT DISTINCT d.tipo FROM Documento d WHERE d.motorista.id = :motoristaId AND d.verificado = true")
    List<TipoDocumento> tiposVerificados(UUID motoristaId);
}
