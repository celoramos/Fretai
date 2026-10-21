package br.com.fretai.empresa.api;

import br.com.fretai.empresa.application.EmpresaService;
import br.com.fretai.empresa.application.dto.AtualizarEmpresaRequest;
import br.com.fretai.empresa.application.dto.CadastroEmpresaRequest;
import br.com.fretai.empresa.application.dto.EmpresaResponse;
import br.com.fretai.empresa.domain.DadosCnpj;
import br.com.fretai.empresa.domain.EmpresaGateway;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Cadastro de empresas do marketplace e consulta pública de CNPJ.
 * As duas rotas GET convivem pelo formato: UUID tem 36 caracteres com hífens
 * nas posições fixas; CNPJ tem 14 (ou até 18 com pontos e hífen).
 */
@RestController
public class EmpresaController {

    private static final String ROTA_ID = "{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}";

    private final EmpresaGateway empresaGateway;
    private final EmpresaService empresaService;

    public EmpresaController(EmpresaGateway empresaGateway, EmpresaService empresaService) {
        this.empresaGateway = empresaGateway;
        this.empresaService = empresaService;
    }

    /** Consulta à Receita para o formulário de cadastro preencher os dados sozinho. */
    @GetMapping("/api/empresas/{cnpj:[0-9A-Za-z.\\-]{14,18}}")
    public DadosCnpj buscarNaReceita(@PathVariable String cnpj) {
        return empresaGateway.buscarPorCnpj(cnpj);
    }

    @PostMapping("/api/empresas")
    public ResponseEntity<EmpresaResponse> cadastrar(@Valid @RequestBody CadastroEmpresaRequest request) {
        EmpresaResponse empresa = empresaService.cadastrar(request);
        return ResponseEntity.created(URI.create("/api/empresas/" + empresa.id())).body(empresa);
    }

    @GetMapping("/api/empresas")
    public Page<EmpresaResponse> listar(
            @PageableDefault(size = 20, sort = "razaoSocial", direction = Sort.Direction.ASC) Pageable pageable) {
        return empresaService.listar(pageable);
    }

    @GetMapping("/api/empresas/" + ROTA_ID)
    public EmpresaResponse buscar(@PathVariable UUID id) {
        return empresaService.buscar(id);
    }

    @PutMapping("/api/empresas/" + ROTA_ID)
    @PreAuthorize("principal.representaOuAdmin(#id)")
    public EmpresaResponse atualizar(@PathVariable UUID id, @Valid @RequestBody AtualizarEmpresaRequest request) {
        return empresaService.atualizar(id, request);
    }

    @DeleteMapping("/api/empresas/" + ROTA_ID)
    @PreAuthorize("principal.representaOuAdmin(#id)")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void desativar(@PathVariable UUID id) {
        empresaService.desativar(id);
    }
}
