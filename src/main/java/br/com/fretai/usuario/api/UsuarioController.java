package br.com.fretai.usuario.api;

import br.com.fretai.usuario.application.UsuarioService;
import br.com.fretai.usuario.application.dto.CadastroClienteRequest;
import br.com.fretai.usuario.application.dto.CadastroMotoristaRequest;
import br.com.fretai.usuario.application.dto.ClienteResponse;
import br.com.fretai.usuario.application.dto.MotoristaResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
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

    @PostMapping("/api/motoristas")
    @ResponseStatus(HttpStatus.CREATED)
    public MotoristaResponse cadastrarMotorista(@Valid @RequestBody CadastroMotoristaRequest request) {
        return usuarioService.cadastrarMotorista(request);
    }
}
