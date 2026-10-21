package br.com.fretai.veiculo.api;

import br.com.fretai.veiculo.application.VeiculoService;
import br.com.fretai.veiculo.application.dto.VeiculoRequest;
import br.com.fretai.veiculo.application.dto.VeiculoResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/motoristas/{motoristaId}/veiculos")
public class VeiculoController {

    private final VeiculoService veiculoService;

    public VeiculoController(VeiculoService veiculoService) {
        this.veiculoService = veiculoService;
    }

    @PostMapping
    public ResponseEntity<VeiculoResponse> cadastrar(@PathVariable UUID motoristaId,
                                                     @Valid @RequestBody VeiculoRequest request) {
        VeiculoResponse veiculo = veiculoService.cadastrar(motoristaId, request);
        return ResponseEntity.created(URI.create("/api/motoristas/" + motoristaId + "/veiculos/" + veiculo.id()))
                .body(veiculo);
    }

    /** Frota pequena (poucos caminhões por motorista): lista sem paginação. */
    @GetMapping
    public List<VeiculoResponse> listar(@PathVariable UUID motoristaId) {
        return veiculoService.listar(motoristaId);
    }

    @GetMapping("/{id}")
    public VeiculoResponse buscar(@PathVariable UUID motoristaId, @PathVariable UUID id) {
        return veiculoService.buscar(motoristaId, id);
    }

    @PutMapping("/{id}")
    public VeiculoResponse atualizar(@PathVariable UUID motoristaId, @PathVariable UUID id,
                                     @Valid @RequestBody VeiculoRequest request) {
        return veiculoService.atualizar(motoristaId, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void desativar(@PathVariable UUID motoristaId, @PathVariable UUID id) {
        veiculoService.desativar(motoristaId, id);
    }
}
