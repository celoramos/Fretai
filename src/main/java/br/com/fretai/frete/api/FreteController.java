package br.com.fretai.frete.api;

import br.com.fretai.frete.application.BuscaFreteService;
import br.com.fretai.frete.application.FreteService;
import br.com.fretai.frete.application.PublicacaoFreteService;
import br.com.fretai.frete.application.dto.AceiteRequest;
import br.com.fretai.frete.application.dto.BuscaFreteRequest;
import br.com.fretai.frete.application.dto.CancelamentoRequest;
import br.com.fretai.frete.application.dto.ContatoResponse;
import br.com.fretai.frete.application.dto.EventoFreteResponse;
import br.com.fretai.frete.application.dto.FreteEncontradoResponse;
import br.com.fretai.frete.application.dto.FreteResponse;
import br.com.fretai.frete.application.dto.PublicarFreteRequest;
import br.com.fretai.frete.application.dto.SolicitarFreteRequest;
import br.com.fretai.frete.domain.StatusFrete;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/fretes")
public class FreteController {

    private final FreteService freteService;
    private final PublicacaoFreteService publicacaoFreteService;
    private final BuscaFreteService buscaFreteService;

    public FreteController(FreteService freteService, PublicacaoFreteService publicacaoFreteService,
                           BuscaFreteService buscaFreteService) {
        this.freteService = freteService;
        this.publicacaoFreteService = publicacaoFreteService;
        this.buscaFreteService = buscaFreteService;
    }

    /** Frete pontual de cliente pessoa física. */
    @PostMapping
    @PreAuthorize("hasRole('CLIENTE') and #request.clienteId() == principal.id")
    public ResponseEntity<FreteResponse> solicitar(@Valid @RequestBody SolicitarFreteRequest request) {
        FreteResponse frete = freteService.solicitar(request);
        return ResponseEntity.created(URI.create("/api/fretes/" + frete.id())).body(frete);
    }

    /** Frete de empresa no marketplace. */
    @PostMapping("/empresa/{empresaId}")
    @PreAuthorize("principal.representaOuAdmin(#empresaId)")
    public ResponseEntity<FreteResponse> publicar(@PathVariable UUID empresaId,
                                                  @Valid @RequestBody PublicarFreteRequest request,
                                                  @AuthenticationPrincipal UsuarioLogado quem) {
        FreteResponse frete = publicacaoFreteService.publicar(empresaId, request, quem);
        return ResponseEntity.created(URI.create("/api/fretes/" + frete.id())).body(frete);
    }

    @GetMapping("/empresa/{empresaId}")
    @PreAuthorize("principal.representaOuAdmin(#empresaId)")
    public Page<FreteResponse> listarDaEmpresa(
            @PathVariable UUID empresaId,
            @PageableDefault(size = 20, sort = "criadoEm", direction = Sort.Direction.DESC) Pageable pageable) {
        return publicacaoFreteService.listarDaEmpresa(empresaId, pageable);
    }

    /** Os fretes do cliente pessoa física: só ele (ou um administrador) vê a lista. */
    @GetMapping("/cliente/{clienteId}")
    @PreAuthorize("hasAnyRole('CLIENTE', 'ADMIN') and principal.ehOuAdmin(#clienteId)")
    public Page<FreteResponse> listarDoCliente(
            @PathVariable UUID clienteId,
            @PageableDefault(size = 20, sort = "criadoEm", direction = Sort.Direction.DESC) Pageable pageable) {
        return freteService.listarDoCliente(clienteId, pageable);
    }

    @PutMapping("/{id}")
    public FreteResponse revisar(@PathVariable UUID id, @Valid @RequestBody PublicarFreteRequest request,
                                 @AuthenticationPrincipal UsuarioLogado quem) {
        return publicacaoFreteService.revisar(id, request, quem);
    }

    /**
     * Fretes abertos perto de um ponto, do mais perto para o mais longe.
     * Ex.: /api/fretes/busca?origemCep=13010-000&raioKm=200&tipoVeiculo=CARRETA&exigeRastreador=NAO
     */
    @GetMapping("/busca")
    public Page<FreteEncontradoResponse> buscarPorRaio(@Valid BuscaFreteRequest filtro,
                                                       @PageableDefault(size = 20) Pageable pageable) {
        return buscaFreteService.buscar(filtro, pageable);
    }

    /** Quem não participa do frete recebe sem endereço completo nem quem recebe. */
    @GetMapping("/{id}")
    public FreteResponse buscar(@PathVariable UUID id, @AuthenticationPrincipal UsuarioLogado quem) {
        return freteService.buscar(id, quem);
    }

    /** Para o motorista não voltar vazio: fretes que saem perto do destino deste, compatíveis com o caminhão dele. */
    @GetMapping("/{id}/retorno")
    public Page<FreteEncontradoResponse> retorno(@PathVariable UUID id, @AuthenticationPrincipal UsuarioLogado quem,
                                                 @PageableDefault(size = 20) Pageable pageable) {
        return buscaFreteService.sugerirRetorno(id, quem, pageable);
    }

    /** Nome e telefone do outro lado, para o WhatsApp. Só depois do aceite. */
    @GetMapping("/{id}/contato")
    public ContatoResponse contato(@PathVariable UUID id, @AuthenticationPrincipal UsuarioLogado quem) {
        return freteService.contato(id, quem);
    }

    /** Trilha de auditoria: cada mudança de status, quem fez e quando. */
    @GetMapping("/{id}/eventos")
    public List<EventoFreteResponse> historico(@PathVariable UUID id, @AuthenticationPrincipal UsuarioLogado quem) {
        return freteService.historico(id, quem);
    }

    @GetMapping
    public Page<FreteResponse> listar(
            @RequestParam(defaultValue = "PUBLICADO") String status,
            @PageableDefault(size = 20, sort = "criadoEm", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UsuarioLogado quem) {
        return freteService.listarPorStatus(StatusFrete.de(status), pageable, quem);
    }

    @PostMapping("/{id}/aceite")
    @PreAuthorize("hasRole('MOTORISTA') and #request.motoristaId() == principal.id")
    public FreteResponse aceitar(@PathVariable UUID id, @Valid @RequestBody AceiteRequest request) {
        return freteService.aceitar(id, request.motoristaId(), request.veiculoId());
    }

    @PostMapping("/{id}/inicio")
    public FreteResponse iniciarTransporte(@PathVariable UUID id, @AuthenticationPrincipal UsuarioLogado quem) {
        return freteService.iniciarTransporte(id, quem);
    }

    @PostMapping("/{id}/conclusao")
    public FreteResponse concluirEntrega(@PathVariable UUID id, @AuthenticationPrincipal UsuarioLogado quem) {
        return freteService.concluirEntrega(id, quem);
    }

    @PostMapping("/{id}/cancelamento")
    public FreteResponse cancelar(@PathVariable UUID id, @Valid @RequestBody CancelamentoRequest request,
                                  @AuthenticationPrincipal UsuarioLogado quem) {
        return freteService.cancelar(id, request.motivo(), quem);
    }
}
