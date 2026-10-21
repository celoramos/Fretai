package br.com.fretai.documento.application;

import br.com.fretai.arquivo.domain.ArmazenamentoArquivos;
import br.com.fretai.arquivo.domain.TipoArquivo;
import br.com.fretai.documento.application.dto.AcessoDocumentoResponse;
import br.com.fretai.documento.application.dto.DocumentoResponse;
import br.com.fretai.documento.application.dto.LinkDocumentoResponse;
import br.com.fretai.documento.domain.AcessoDocumento;
import br.com.fretai.documento.domain.AcessoDocumentoRepository;
import br.com.fretai.documento.domain.Documento;
import br.com.fretai.documento.domain.DocumentoRepository;
import br.com.fretai.documento.domain.TipoDocumento;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.FreteRepository;
import br.com.fretai.frete.domain.PropostaRepository;
import br.com.fretai.frete.domain.StatusProposta;
import br.com.fretai.shared.exception.AcessoNegadoException;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.MotoristaRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Upload e acesso a documentos. Ninguém baixa direto: pede um link, a permissão
 * é conferida, o acesso é registrado e o link expira em minutos.
 */
@Service
public class DocumentoService {

    private final DocumentoRepository documentoRepository;
    private final AcessoDocumentoRepository acessoRepository;
    private final FreteRepository freteRepository;
    private final PropostaRepository propostaRepository;
    private final MotoristaRepository motoristaRepository;
    private final ArmazenamentoArquivos armazenamento;
    private final Duration validadeLink;
    private final long tamanhoMaximo;

    public DocumentoService(DocumentoRepository documentoRepository, AcessoDocumentoRepository acessoRepository,
                            FreteRepository freteRepository, PropostaRepository propostaRepository,
                            MotoristaRepository motoristaRepository, ArmazenamentoArquivos armazenamento,
                            @Value("${fretai.arquivos.validade-link}") Duration validadeLink,
                            @Value("${fretai.arquivos.tamanho-maximo-bytes}") long tamanhoMaximo) {
        this.documentoRepository = documentoRepository;
        this.acessoRepository = acessoRepository;
        this.freteRepository = freteRepository;
        this.propostaRepository = propostaRepository;
        this.motoristaRepository = motoristaRepository;
        this.armazenamento = armazenamento;
        this.validadeLink = validadeLink;
        this.tamanhoMaximo = tamanhoMaximo;
    }

    /** O motorista envia para um frete em que está negociando ou que já é dele. */
    @Transactional
    public DocumentoResponse enviar(UUID freteId, TipoDocumento tipo, byte[] conteudo, UsuarioLogado quem) {
        Frete frete = freteRepository.findById(freteId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Frete não encontrado."));
        Motorista motorista = motoristaRepository.findById(quem.id())
                .orElseThrow(() -> new AcessoNegadoException("Só motoristas enviam documentos."));
        boolean participa = frete.ehMotoristaDoFrete(quem)
                || propostaRepository.existsByFreteIdAndMotoristaIdAndStatus(freteId, quem.id(), StatusProposta.ENVIADA);
        if (!participa) {
            throw new AcessoNegadoException("Envie documentos só para fretes em que você tem proposta ou foi aceito.");
        }
        if (conteudo.length == 0 || conteudo.length > tamanhoMaximo) {
            throw new RegraNegocioException("O arquivo deve ter até " + tamanhoMaximo / (1024 * 1024) + " MB.");
        }
        TipoArquivo formato = TipoArquivo.detectar(conteudo)
                .orElseThrow(() -> new RegraNegocioException("Formato não aceito. Envie PDF, PNG ou JPEG."));

        // A chave não usa o nome do arquivo enviado: nada que venha do usuário vira caminho.
        String chave = "documentos/%s/%s/%s.%s".formatted(motorista.getId(), freteId, UUID.randomUUID(),
                formato.getExtensao());
        armazenamento.salvar(chave, conteudo, formato.getContentType());
        return DocumentoResponse.de(documentoRepository.save(new Documento(motorista, frete, tipo, chave,
                formato.getContentType(), conteudo.length)));
    }

    /** Cada um vê só o que pode ver: a lista já vem filtrada. */
    @Transactional(readOnly = true)
    public List<DocumentoResponse> doFrete(UUID freteId, UsuarioLogado quem) {
        return documentoRepository.findByFreteIdOrderByCriadoEm(freteId).stream()
                .filter(d -> d.podeSerVistoPor(quem))
                .map(DocumentoResponse::de)
                .toList();
    }

    /**
     * @param origem IP de quem pediu, para o registro de acesso
     */
    @Transactional
    public LinkDocumentoResponse gerarLink(UUID documentoId, UsuarioLogado quem, String origem) {
        Documento documento = carregar(documentoId);
        if (!documento.podeSerVistoPor(quem)) {
            throw new AcessoNegadoException("A empresa só vê os documentos do motorista depois de aceitar a proposta dele.");
        }
        acessoRepository.save(new AcessoDocumento(documentoId, quem, origem));
        return new LinkDocumentoResponse(armazenamento.urlAssinada(documento.getChave(), validadeLink),
                Instant.now().plus(validadeLink));
    }

    /** O dono do documento (e o administrador) pode ver quem já abriu. */
    @Transactional(readOnly = true)
    public List<AcessoDocumentoResponse> acessos(UUID documentoId, UsuarioLogado quem) {
        Documento documento = carregar(documentoId);
        if (!quem.isAdmin() && !documento.getMotorista().getId().equals(quem.id())) {
            throw new AcessoNegadoException("Só o dono do documento vê quem o acessou.");
        }
        return acessoRepository.findByDocumentoIdOrderByAcessadoEmDesc(documentoId).stream()
                .map(AcessoDocumentoResponse::de).toList();
    }

    @Transactional
    public DocumentoResponse verificar(UUID documentoId, UsuarioLogado admin) {
        Documento documento = carregar(documentoId);
        documento.verificar(admin.id());
        return DocumentoResponse.de(documento);
    }

    private Documento carregar(UUID documentoId) {
        return documentoRepository.findById(documentoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Documento não encontrado."));
    }
}
