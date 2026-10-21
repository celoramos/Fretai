package br.com.fretai.precificacao.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CoeficientePisoRepository extends JpaRepository<CoeficientePiso, CoeficientePiso.Chave> {

    List<CoeficientePiso> findAllByOrderByChaveTipoCargaAscChaveNumeroEixosAsc();
}
