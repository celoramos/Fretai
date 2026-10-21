package br.com.fretai.auth.api;

import br.com.fretai.auth.application.AuthService;
import br.com.fretai.auth.application.dto.LoginRequest;
import br.com.fretai.auth.application.dto.RefreshRequest;
import br.com.fretai.auth.application.dto.TokensResponse;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** IP direto da conexão. Atrás de proxy, configurar server.forward-headers-strategy. */
    @PostMapping("/login")
    public TokensResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        return authService.login(request, http.getRemoteAddr());
    }

    @PostMapping("/refresh")
    public TokensResponse renovar(@Valid @RequestBody RefreshRequest request) {
        return authService.renovar(request.refreshToken());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void sair(@Valid @RequestBody RefreshRequest request) {
        authService.sair(request.refreshToken());
    }

    @GetMapping("/eu")
    public UsuarioLogado eu(@AuthenticationPrincipal UsuarioLogado usuario) {
        return usuario;
    }
}
