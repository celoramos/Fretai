package br.com.fretai.frete.api;

import br.com.fretai.frete.application.PropostaService;
import br.com.fretai.frete.application.dto.PropostaRequest;
import br.com.fretai.frete.application.dto.PropostaResponse;
import br.com.fretai.frete.application.dto.RespostaPropostaRequest;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Negociação: propostas de motorista para contratante e de contratante para motorista. */
@RestController
public class PropostaController {

    private final PropostaService propostaService;

    public PropostaController(PropostaService propostaService) {
        this.propostaService = propostaService;
    }

    @PostMapping("/api/fretes/{freteId}/propostas")
    @PreAuthorize("hasAnyRole('MOTORISTA', 'EMPRESA', 'CLIENTE')")
    @ResponseStatus(HttpStatus.CREATED)
    public PropostaResponse enviar(@PathVariable UUID freteId, @Valid @RequestBody PropostaRequest request,
                                   @AuthenticationPrincipal UsuarioLogado quem) {
        return propostaService.enviar(freteId, request, quem);
    }

    @GetMapping("/api/fretes/{freteId}/propostas")
    public List<PropostaResponse> listarDoFrete(@PathVariable UUID freteId,
                                                @AuthenticationPrincipal UsuarioLogado quem) {
        return propostaService.listarDoFrete(freteId, quem);
    }

    /** As propostas do motorista logado, em todos os fretes. */
    @GetMapping("/api/propostas/minhas")
    @PreAuthorize("hasRole('MOTORISTA')")
    public Page<PropostaResponse> minhas(
            @AuthenticationPrincipal UsuarioLogado quem,
            @PageableDefault(size = 20, sort = "criadaEm", direction = Sort.Direction.DESC) Pageable pageable) {
        return propostaService.listarDoMotorista(quem, pageable);
    }

    @PostMapping("/api/propostas/{id}/aceite")
    public PropostaResponse aceitar(@PathVariable UUID id,
                                    @RequestBody(required = false) RespostaPropostaRequest request,
                                    @AuthenticationPrincipal UsuarioLogado quem) {
        return propostaService.aceitar(id, request == null ? null : request.veiculoId(), quem);
    }

    @PostMapping("/api/propostas/{id}/recusa")
    public PropostaResponse recusar(@PathVariable UUID id, @AuthenticationPrincipal UsuarioLogado quem) {
        return propostaService.recusar(id, quem);
    }

    @PostMapping("/api/propostas/{id}/retirada")
    public PropostaResponse retirar(@PathVariable UUID id, @AuthenticationPrincipal UsuarioLogado quem) {
        return propostaService.retirar(id, quem);
    }
}
