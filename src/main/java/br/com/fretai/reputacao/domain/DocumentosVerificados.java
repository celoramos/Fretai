package br.com.fretai.reputacao.domain;

import java.util.List;
import java.util.UUID;

/** Quais documentos do motorista já foram conferidos. Respondido pelo módulo de documentos. */
public interface DocumentosVerificados {

    /** @return tipos de documento verificados (ex.: CNH, CRLV) */
    List<String> doMotorista(UUID motoristaId);
}
