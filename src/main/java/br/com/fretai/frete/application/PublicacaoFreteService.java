package br.com.fretai.frete.application;

import br.com.fretai.empresa.domain.Empresa;
import br.com.fretai.empresa.domain.EmpresaRepository;
import br.com.fretai.frete.application.dto.FreteResponse;
import br.com.fretai.frete.application.dto.PublicarFreteRequest;
import br.com.fretai.frete.domain.Autor;
import br.com.fretai.frete.domain.EventosFrete;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.FreteRepository;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Fretes que empresas publicam no marketplace. */
@Service
public class PublicacaoFreteService {

    private final FreteRepository freteRepository;
    private final EmpresaRepository empresaRepository;
    private final PreparacaoFrete preparacao;
    private final ApplicationEventPublisher eventos;

    public PublicacaoFreteService(FreteRepository freteRepository, EmpresaRepository empresaRepository,
                                  PreparacaoFrete preparacao, ApplicationEventPublisher eventos) {
        this.freteRepository = freteRepository;
        this.empresaRepository = empresaRepository;
        this.preparacao = preparacao;
        this.eventos = eventos;
    }

    @Transactional
    public FreteResponse publicar(UUID empresaId, PublicarFreteRequest request, UsuarioLogado quem) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Empresa não encontrada."));

        Frete frete = Frete.publicar(empresa,
                preparacao.montarEndereco(request.coleta()), preparacao.montarEndereco(request.entrega()),
                request.carga(), request.valor(), request.dataColeta(), request.requisitos(), Autor.de(quem));
        preparacao.completar(frete, request.dataColeta());
        Frete salvo = freteRepository.save(frete);
        eventos.publishEvent(new EventosFrete.FretePublicado(salvo.getId()));
        return FreteResponse.de(salvo);
    }

    @Transactional
    public FreteResponse revisar(UUID freteId, PublicarFreteRequest request, UsuarioLogado quem) {
        Frete frete = freteRepository.findById(freteId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Frete não encontrado."));
        FreteService.exigir(quem.isAdmin() || frete.ehContratante(quem), "Só a empresa que publicou edita o frete.");

        frete.revisar(preparacao.montarEndereco(request.coleta()), preparacao.montarEndereco(request.entrega()),
                request.carga(), request.valor(), request.dataColeta(), request.requisitos());
        preparacao.completar(frete, request.dataColeta());
        return FreteResponse.de(freteRepository.saveAndFlush(frete));
    }

    @Transactional(readOnly = true)
    public Page<FreteResponse> listarDaEmpresa(UUID empresaId, Pageable pageable) {
        if (!empresaRepository.existsById(empresaId)) {
            throw new RecursoNaoEncontradoException("Empresa não encontrada.");
        }
        return freteRepository.findByEmpresaId(empresaId, pageable).map(FreteResponse::de);
    }
}
