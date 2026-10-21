package br.com.fretai.veiculo.domain;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VeiculoRepository extends JpaRepository<Veiculo, UUID> {

    boolean existsByPlaca(String placa);

    List<Veiculo> findByMotoristaIdAndAtivoTrueOrderByCriadoEm(UUID motoristaId);
}
