package br.com.fretai.auth.infra;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * API sem sessão: cada requisição traz o access token. O que é público está
 * listado aqui; todo o resto exige login. Regras de "quem pode mexer em quê"
 * ficam nos controllers ({@code @PreAuthorize}) e nos services (dono do recurso).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
class SecurityConfig {

    @Bean
    SecurityFilterChain filtroSeguranca(HttpSecurity http) throws Exception {
        http
                // Sem cookie de sessão não há CSRF a proteger: o token vai no cabeçalho.
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(rotas -> rotas
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/refresh").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/clientes", "/api/motoristas", "/api/empresas").permitAll()
                        // Consulta de CNPJ (formulário de cadastro), feriados e calendário: dados públicos.
                        .requestMatchers(HttpMethod.GET, "/api/empresas/{cnpj:[0-9A-Za-z.\\-]{14,18}}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/feriados/**", "/api/calendario/**").permitAll()
                        // Link assinado de arquivo: a permissão foi conferida quando o link foi gerado.
                        .requestMatchers(HttpMethod.GET, "/api/arquivos/*").permitAll()
                        // Webhook do PSP: autenticado pelo token/assinatura que o gateway confere.
                        .requestMatchers(HttpMethod.POST, "/api/webhooks/pagamentos").permitAll()
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers("/error").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(rs -> rs
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(new UsuarioLogadoConverter()))
                        .authenticationEntryPoint(RespostaErroSeguranca.naoAutenticado()))
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(RespostaErroSeguranca.naoAutenticado())
                        .accessDeniedHandler(RespostaErroSeguranca.acessoNegado()));
        return http.build();
    }
}
