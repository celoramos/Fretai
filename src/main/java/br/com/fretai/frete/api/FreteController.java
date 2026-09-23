package br.com.fretai.frete.api;

import br.com.fretai.frete.application.FreteService;
import br.com.fretai.frete.application.dto.AceiteRequest;
import br.com.fretai.frete.application.dto.CancelamentoRequest;
import br.com.fretai.frete.application.dto.FreteResponse;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/fretes")
public class FreteController {

    private final FreteService freteService;

    public FreteController(FreteService freteService) {
        this.freteService = freteService;
    }

    @PostMapping
    public ResponseEntity<FreteResponse> solicitar(@Valid @RequestBody SolicitarFreteRequest request) {
        FreteResponse frete = freteService.solicitar(request);
        return ResponseEntity.created(URI.create("/api/fretes/" + frete.id())).body(frete);
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
