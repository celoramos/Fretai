package br.com.fretai.documento.application;

import br.com.fretai.documento.domain.DocumentoRepository;
import br.com.fretai.reputacao.domain.DocumentosVerificados;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Responde ao perfil do motorista quais tipos de documento já foram conferidos por um administrador. */
@Component
class DocumentosVerificadosDoMotorista implements DocumentosVerificados {

    private final DocumentoRepository documentoRepository;

    DocumentosVerificadosDoMotorista(DocumentoRepository documentoRepository) {
        this.documentoRepository = documentoRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> doMotorista(UUID motoristaId) {
        return documentoRepository.tiposVerificados(motoristaId).stream().map(Enum::name).sorted().toList();
    }
}
