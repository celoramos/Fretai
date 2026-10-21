package br.com.fretai.reputacao.api;

import br.com.fretai.reputacao.application.ReputacaoService;
import br.com.fretai.reputacao.application.dto.AvaliacaoRequest;
import br.com.fretai.reputacao.application.dto.AvaliacaoResponse;
import br.com.fretai.reputacao.application.dto.PerfilEmpresaResponse;
import br.com.fretai.reputacao.application.dto.PerfilMotoristaResponse;
import br.com.fretai.reputacao.domain.Avaliacao;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ReputacaoController {

    private final ReputacaoService reputacaoService;

    public ReputacaoController(ReputacaoService reputacaoService) {
        this.reputacaoService = reputacaoService;
    }

    @PostMapping("/api/fretes/{freteId}/avaliacoes")
    @ResponseStatus(HttpStatus.CREATED)
    public AvaliacaoResponse avaliar(@PathVariable UUID freteId, @Valid @RequestBody AvaliacaoRequest request,
                                     @AuthenticationPrincipal UsuarioLogado quem) {
        return reputacaoService.avaliar(freteId, request, quem);
    }

    @GetMapping("/api/fretes/{freteId}/avaliacoes")
    public List<AvaliacaoResponse> doFrete(@PathVariable UUID freteId) {
        return reputacaoService.doFrete(freteId);
    }

    @GetMapping("/api/empresas/{id}/perfil")
    public PerfilEmpresaResponse perfilEmpresa(@PathVariable UUID id) {
        return reputacaoService.perfilEmpresa(id);
    }

    @GetMapping("/api/empresas/{id}/avaliacoes")
    public Page<AvaliacaoResponse> avaliacoesDaEmpresa(
            @PathVariable UUID id,
            @PageableDefault(size = 20, sort = "criadaEm", direction = Sort.Direction.DESC) Pageable pageable) {
        return reputacaoService.recebidas(Avaliacao.TipoAvaliado.EMPRESA, id, pageable);
    }

    @GetMapping("/api/motoristas/{id}/perfil")
    public PerfilMotoristaResponse perfilMotorista(@PathVariable UUID id) {
        return reputacaoService.perfilMotorista(id);
    }

    @GetMapping("/api/motoristas/{id}/avaliacoes")
    public Page<AvaliacaoResponse> avaliacoesDoMotorista(
            @PathVariable UUID id,
            @PageableDefault(size = 20, sort = "criadaEm", direction = Sort.Direction.DESC) Pageable pageable) {
        return reputacaoService.recebidas(Avaliacao.TipoAvaliado.MOTORISTA, id, pageable);
    }
}
