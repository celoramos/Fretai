package br.com.fretai.auth.api;

import br.com.fretai.auth.application.AuthService;
import br.com.fretai.auth.application.SenhaService;
import br.com.fretai.auth.application.dto.PedidoLinkSenhaRequest;
import br.com.fretai.auth.application.dto.SenhaNovaRequest;
import br.com.fretai.auth.application.dto.EuResponse;
import br.com.fretai.auth.application.dto.GoogleLoginRequest;
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
    private final SenhaService senhaService;

    public AuthController(AuthService authService, SenhaService senhaService) {
        this.authService = authService;
        this.senhaService = senhaService;
    }

    /** Esqueci a senha. Sempre 204, exista a conta ou não: a resposta não entrega quem tem cadastro. */
    @PostMapping("/senha/link")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void pedirLinkSenha(@Valid @RequestBody PedidoLinkSenhaRequest request) {
        senhaService.pedirLink(request.email());
    }

    /** Grava a senha nova com o token do link. Link usado, vencido ou desconhecido: 422. */
    @PostMapping("/senha/nova")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void definirSenha(@Valid @RequestBody SenhaNovaRequest request) {
        senhaService.definirSenha(request.token(), request.senha());
    }

    /** IP direto da conexão. Atrás de proxy, configurar server.forward-headers-strategy. */
    @PostMapping("/login")
    public TokensResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        return authService.login(request, http.getRemoteAddr());
    }

    /** Entrar com Google. 404 com e-mail e nome quando a pessoa ainda não tem conta. */
    @PostMapping("/google")
    public TokensResponse entrarComGoogle(@Valid @RequestBody GoogleLoginRequest request) {
        return authService.entrarComGoogle(request.credencial());
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
    /** Quem está logado, com nome e e-mail para o menu da conta. */
    public EuResponse eu(@AuthenticationPrincipal UsuarioLogado usuario) {
        return authService.eu(usuario);
    }
}
