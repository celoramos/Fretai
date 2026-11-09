package br.com.fretai.frete.application;

import br.com.fretai.arquivo.domain.ArmazenamentoArquivos;
import br.com.fretai.arquivo.domain.TipoArquivo;
import br.com.fretai.frete.application.dto.FotoCargaResponse;
import br.com.fretai.frete.domain.FotoCarga;
import br.com.fretai.frete.domain.FotoCargaRepository;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.FreteRepository;
import br.com.fretai.frete.domain.StatusFrete;
import br.com.fretai.shared.exception.AcessoNegadoException;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Fotos do pedido de pessoa física. Só o cliente dono envia, até {@link FotoCarga#MAXIMO_POR_FRETE},
 * enquanto o frete está aberto. Quem pode abrir o frete vê as fotos: o motorista decide com elas.
 */
@Service
public class FotoCargaService {

    private final FreteRepository freteRepository;
    private final FotoCargaRepository fotoCargaRepository;
    private final ArmazenamentoArquivos armazenamento;
    private final Duration validadeLink;

    public FotoCargaService(FreteRepository freteRepository, FotoCargaRepository fotoCargaRepository,
                            ArmazenamentoArquivos armazenamento,
                            @Value("${fretai.arquivos.validade-link}") Duration validadeLink) {
        this.freteRepository = freteRepository;
        this.fotoCargaRepository = fotoCargaRepository;
        this.armazenamento = armazenamento;
        this.validadeLink = validadeLink;
    }

    @Transactional
    public FotoCargaResponse enviar(UUID freteId, byte[] conteudo, UsuarioLogado quem) {
        Frete frete = freteRepository.findById(freteId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Frete não encontrado."));
        if (frete.getCliente() == null || !frete.getCliente().getId().equals(quem.id())) {
            throw new AcessoNegadoException("Só quem pediu o frete envia fotos.");
        }
        if (frete.getStatus() != StatusFrete.PUBLICADO && frete.getStatus() != StatusFrete.PROPOSTA_ENVIADA) {
            throw new RegraNegocioException("As fotos entram antes de o frete fechar.");
        }
        if (fotoCargaRepository.countByFreteId(freteId) >= FotoCarga.MAXIMO_POR_FRETE) {
            throw new RegraNegocioException("Até " + FotoCarga.MAXIMO_POR_FRETE + " fotos por pedido.");
        }
        TipoArquivo formato = TipoArquivo.detectar(conteudo)
                .filter(t -> t != TipoArquivo.PDF)
                .orElseThrow(() -> new RegraNegocioException("A foto da carga deve ser JPEG ou PNG."));

        String chave = "fotos-carga/%s/%s.%s".formatted(freteId, UUID.randomUUID(), formato.getExtensao());
        armazenamento.salvar(chave, conteudo, formato.getContentType());
        return resposta(fotoCargaRepository.save(new FotoCarga(frete, chave)));
    }

    @Transactional(readOnly = true)
    public List<FotoCargaResponse> listar(UUID freteId) {
        if (!freteRepository.existsById(freteId)) {
            throw new RecursoNaoEncontradoException("Frete não encontrado.");
        }
        return fotoCargaRepository.findByFreteIdOrderByCriadoEm(freteId).stream().map(this::resposta).toList();
    }

    private FotoCargaResponse resposta(FotoCarga foto) {
        return new FotoCargaResponse(foto.getId(), armazenamento.urlAssinada(foto.getChave(), validadeLink).toString());
    }
}
