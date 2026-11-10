package br.com.fretai.usuario.api;

import br.com.fretai.shared.seguranca.UsuarioLogado;
import br.com.fretai.usuario.application.UsuarioService;
import br.com.fretai.usuario.application.dto.AtualizarContatoRequest;
import br.com.fretai.usuario.application.dto.BaseMotoristaRequest;
import br.com.fretai.usuario.application.dto.CadastroClienteRequest;
import br.com.fretai.usuario.application.dto.CadastroMotoristaRequest;
import br.com.fretai.usuario.application.dto.ChavePixRequest;
import br.com.fretai.usuario.application.dto.ClienteResponse;
import br.com.fretai.usuario.application.dto.MotoristaResponse;
import br.com.fretai.usuario.application.dto.PreferenciasMotoristaRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping("/api/clientes")
    @ResponseStatus(HttpStatus.CREATED)
    public ClienteResponse cadastrarCliente(@Valid @RequestBody CadastroClienteRequest request) {
        return usuarioService.cadastrarCliente(request);
    }

    /** O cadastro do cliente, para ele mesmo: é o que a tela "Meus dados" mostra. */
    @GetMapping("/api/clientes/{id}")
    @PreAuthorize("principal.ehOuAdmin(#id)")
    public ClienteResponse buscarCliente(@PathVariable UUID id) {
        return usuarioService.buscarCliente(id);
    }

    @PutMapping("/api/clientes/{id}")
    @PreAuthorize("principal.ehOuAdmin(#id)")
    public ClienteResponse atualizarCliente(@PathVariable UUID id,
                                            @Valid @RequestBody AtualizarContatoRequest request) {
        return usuarioService.atualizarCliente(id, request);
    }

    @PostMapping("/api/motoristas")
    @ResponseStatus(HttpStatus.CREATED)
    public MotoristaResponse cadastrarMotorista(@Valid @RequestBody CadastroMotoristaRequest request) {
        return usuarioService.cadastrarMotorista(request);
    }

    /** A empresa vê quem está na plataforma, sem telefone nem e-mail: o contato sai pelo frete, depois do aceite. */
    @GetMapping("/api/motoristas")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPRESA')")
    public Page<MotoristaResponse> listarMotoristas(
            @PageableDefault(size = 20, sort = "nome", direction = Sort.Direction.ASC) Pageable pageable,
            @AuthenticationPrincipal UsuarioLogado usuario) {
        return usuarioService.listarMotoristas(pageable, usuario);
    }

    /** O cadastro traz telefone e e-mail, então só abre para o próprio motorista e para o administrador. */
    @GetMapping("/api/motoristas/{id}")
    @PreAuthorize("principal.ehOuAdmin(#id)")
    public MotoristaResponse buscarMotorista(@PathVariable UUID id) {
        return usuarioService.buscarMotorista(id);
    }

    @PutMapping("/api/motoristas/{id}")
    @PreAuthorize("principal.ehOuAdmin(#id)")
    public MotoristaResponse atualizarMotorista(@PathVariable UUID id,
                                                @Valid @RequestBody AtualizarContatoRequest request) {
        return usuarioService.atualizarMotorista(id, request);
    }

    @DeleteMapping("/api/motoristas/{id}")
    @PreAuthorize("principal.ehOuAdmin(#id)")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void desativarMotorista(@PathVariable UUID id) {
        usuarioService.desativarMotorista(id);
    }

    /** Para onde o PSP transfere adiantamento e saldo. */
    @PutMapping("/api/motoristas/{id}/chave-pix")
    @PreAuthorize("principal.ehOuAdmin(#id)")
    public MotoristaResponse definirChavePix(@PathVariable UUID id, @Valid @RequestBody ChavePixRequest request) {
        return usuarioService.definirChavePix(id, request);
    }

    /** Base e raio para os avisos de frete novo por perto. */
    @PutMapping("/api/motoristas/{id}/base")
    @PreAuthorize("principal.ehOuAdmin(#id)")
    public MotoristaResponse definirBase(@PathVariable UUID id, @Valid @RequestBody BaseMotoristaRequest request) {
        return usuarioService.definirBase(id, request);
    }

    @PatchMapping("/api/motoristas/{id}/preferencias")
    @PreAuthorize("principal.ehOuAdmin(#id)")
    public MotoristaResponse alterarPreferencias(@PathVariable UUID id,
                                                 @Valid @RequestBody PreferenciasMotoristaRequest request) {
        return usuarioService.alterarPreferencias(id, request);
    }
}
