package br.com.fretai.auth.infra;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;

/**
 * 401 e 403 gerados pelo filtro de segurança (antes de chegar a um controller)
 * no mesmo formato ProblemDetail do resto da API.
 */
final class RespostaErroSeguranca {

    private RespostaErroSeguranca() {
    }

    static AuthenticationEntryPoint naoAutenticado() {
        return (request, response, e) -> escrever(response, HttpStatus.UNAUTHORIZED, "Não autenticado",
                "Envie um access token válido no cabeçalho Authorization: Bearer <token>.");
    }

    static AccessDeniedHandler acessoNegado() {
        return (request, response, e) -> escrever(response, HttpStatus.FORBIDDEN, "Acesso negado",
                "Seu usuário não tem permissão para este recurso.");
    }

    private static void escrever(HttpServletResponse response, HttpStatus status, String titulo, String detalhe)
            throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        if (status == HttpStatus.UNAUTHORIZED) {
            response.setHeader("WWW-Authenticate", "Bearer");
        }
        response.getWriter().write("""
                {"type":"about:blank","title":"%s","status":%d,"detail":"%s"}""".formatted(titulo, status.value(), detalhe));
    }
}
