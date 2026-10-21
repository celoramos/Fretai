package br.com.fretai.reputacao.application;

import br.com.fretai.empresa.domain.Empresa;
import br.com.fretai.empresa.domain.EmpresaRepository;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.FreteRepository;
import br.com.fretai.frete.domain.StatusFrete;
import br.com.fretai.reputacao.application.dto.AvaliacaoRequest;
import br.com.fretai.reputacao.application.dto.AvaliacaoResponse;
import br.com.fretai.reputacao.application.dto.PerfilEmpresaResponse;
import br.com.fretai.reputacao.application.dto.PerfilMotoristaResponse;
import br.com.fretai.reputacao.domain.Avaliacao;
import br.com.fretai.reputacao.domain.AvaliacaoRepository;
import br.com.fretai.reputacao.domain.DocumentosVerificados;
import br.com.fretai.reputacao.domain.MediaNotas;
import br.com.fretai.reputacao.domain.PontualidadePagamentos;
import br.com.fretai.shared.exception.ConflitoException;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.MotoristaRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Avaliações e os perfis públicos que elas alimentam. */
@Service
public class ReputacaoService {

    private static final Set<StatusFrete> CONCLUIDOS = Set.of(StatusFrete.ENTREGUE, StatusFrete.PAGO);

    private final AvaliacaoRepository avaliacaoRepository;
    private final FreteRepository freteRepository;
    private final EmpresaRepository empresaRepository;
    private final MotoristaRepository motoristaRepository;
    private final ObjectProvider<PontualidadePagamentos> pontualidade;
    private final ObjectProvider<DocumentosVerificados> documentos;

    public ReputacaoService(AvaliacaoRepository avaliacaoRepository, FreteRepository freteRepository,
                            EmpresaRepository empresaRepository, MotoristaRepository motoristaRepository,
                            ObjectProvider<PontualidadePagamentos> pontualidade,
                            ObjectProvider<DocumentosVerificados> documentos) {
        this.avaliacaoRepository = avaliacaoRepository;
        this.freteRepository = freteRepository;
        this.empresaRepository = empresaRepository;
        this.motoristaRepository = motoristaRepository;
        this.pontualidade = pontualidade;
        this.documentos = documentos;
    }

    @Transactional
    public AvaliacaoResponse avaliar(UUID freteId, AvaliacaoRequest request, UsuarioLogado quem) {
        Frete frete = freteRepository.findById(freteId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Frete não encontrado."));
        Avaliacao avaliacao = Avaliacao.registrar(frete, quem, request.nota(), request.comentario());
        if (avaliacaoRepository.existsByFreteIdAndLado(freteId, avaliacao.getLado())) {
            throw new ConflitoException("Este frete já foi avaliado por você.");
        }
        return AvaliacaoResponse.de(avaliacaoRepository.save(avaliacao));
    }

    @Transactional(readOnly = true)
    public List<AvaliacaoResponse> doFrete(UUID freteId) {
        return avaliacaoRepository.findByFreteId(freteId).stream().map(AvaliacaoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public Page<AvaliacaoResponse> recebidas(Avaliacao.TipoAvaliado tipo, UUID id, Pageable pageable) {
        return avaliacaoRepository.findByAvaliadoTipoAndAvaliadoId(tipo, id, pageable).map(AvaliacaoResponse::de);
    }

    @Transactional(readOnly = true)
    public PerfilEmpresaResponse perfilEmpresa(UUID empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Empresa não encontrada."));
        MediaNotas notas = avaliacaoRepository.media(Avaliacao.TipoAvaliado.EMPRESA, empresaId);
        PontualidadePagamentos.Pontualidade emDia = pontualidade
                .getIfAvailable(() -> id -> new PontualidadePagamentos.Pontualidade(0, 0))
                .daEmpresa(empresaId);
        return new PerfilEmpresaResponse(empresa.getId(), empresa.getRazaoSocial(), empresa.getNomeFantasia(),
                empresa.getTipo(), empresa.getCriadoEm(), arredondar(notas.media()), notas.quantidade(),
                freteRepository.countByEmpresaId(empresaId),
                freteRepository.countByEmpresaIdAndStatusIn(empresaId, CONCLUIDOS),
                emDia.percentual(), emDia.vencidas());
    }

    @Transactional(readOnly = true)
    public PerfilMotoristaResponse perfilMotorista(UUID motoristaId) {
        Motorista motorista = motoristaRepository.findById(motoristaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Motorista não encontrado."));
        MediaNotas notas = avaliacaoRepository.media(Avaliacao.TipoAvaliado.MOTORISTA, motoristaId);
        List<String> verificados = documentos.getIfAvailable(() -> id -> List.of()).doMotorista(motoristaId);
        return new PerfilMotoristaResponse(motorista.getId(), motorista.getNome(), motorista.getCriadoEm(),
                arredondar(notas.media()), notas.quantidade(),
                freteRepository.countByMotoristaIdAndStatusIn(motoristaId, CONCLUIDOS), verificados);
    }

    private static Double arredondar(Double media) {
        return media == null ? null : BigDecimal.valueOf(media).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }
}
