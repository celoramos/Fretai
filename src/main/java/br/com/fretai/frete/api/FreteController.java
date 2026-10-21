package br.com.fretai.frete.api;

import br.com.fretai.frete.application.FreteService;
import br.com.fretai.frete.application.PublicacaoFreteService;
import br.com.fretai.frete.application.dto.AceiteRequest;
import br.com.fretai.frete.application.dto.CancelamentoRequest;
import br.com.fretai.frete.application.dto.FreteResponse;
import br.com.fretai.frete.application.dto.PublicarFreteRequest;
import br.com.fretai.frete.application.dto.SolicitarFreteRequest;
import br.com.fretai.frete.domain.StatusFrete;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
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

    public FreteController(FreteService freteService, PublicacaoFreteService publicacaoFreteService) {
        this.freteService = freteService;
        this.publicacaoFreteService = publicacaoFreteService;
    }

    /** Frete pontual de cliente pessoa física. */
    @PostMapping
    public ResponseEntity<FreteResponse> solicitar(@Valid @RequestBody SolicitarFreteRequest request) {
        FreteResponse frete = freteService.solicitar(request);
        return ResponseEntity.created(URI.create("/api/fretes/" + frete.id())).body(frete);
    }

    /** Frete de empresa no marketplace. */
    @PostMapping("/empresa/{empresaId}")
    public ResponseEntity<FreteResponse> publicar(@PathVariable UUID empresaId,
                                                  @Valid @RequestBody PublicarFreteRequest request) {
        FreteResponse frete = publicacaoFreteService.publicar(empresaId, request);
        return ResponseEntity.created(URI.create("/api/fretes/" + frete.id())).body(frete);
    }

    @GetMapping("/empresa/{empresaId}")
    public Page<FreteResponse> listarDaEmpresa(
            @PathVariable UUID empresaId,
            @PageableDefault(size = 20, sort = "criadoEm", direction = Sort.Direction.DESC) Pageable pageable) {
        return publicacaoFreteService.listarDaEmpresa(empresaId, pageable);
    }

    @PutMapping("/{id}")
    public FreteResponse revisar(@PathVariable UUID id, @Valid @RequestBody PublicarFreteRequest request) {
        return publicacaoFreteService.revisar(id, request);
    }

    @GetMapping("/{id}")
    public FreteResponse buscar(@PathVariable UUID id) {
        return freteService.buscar(id);
    }

    @GetMapping
    public Page<FreteResponse> listar(
            @RequestParam(defaultValue = "PENDENTE") StatusFrete status,
            @PageableDefault(size = 20, sort = "criadoEm", direction = Sort.Direction.DESC) Pageable pageable) {
        return freteService.listarPorStatus(status, pageable);
    }

    @PostMapping("/{id}/aceite")
    public FreteResponse aceitar(@PathVariable UUID id, @Valid @RequestBody AceiteRequest request) {
        return freteService.aceitar(id, request.motoristaId());
    }

    @PostMapping("/{id}/inicio")
    public FreteResponse iniciarTransporte(@PathVariable UUID id) {
        return freteService.iniciarTransporte(id);
    }

    @PostMapping("/{id}/conclusao")
    public FreteResponse concluirEntrega(@PathVariable UUID id) {
        return freteService.concluirEntrega(id);
    }

    @PostMapping("/{id}/cancelamento")
    public FreteResponse cancelar(@PathVariable UUID id, @Valid @RequestBody CancelamentoRequest request) {
        return freteService.cancelar(id, request.motivo());
    }
}
