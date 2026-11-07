package br.com.fretai.auth.infra;

import br.com.fretai.shared.exception.CredenciaisInvalidasException;
import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.shared.seguranca.IdentidadeGoogle;
import br.com.fretai.shared.seguranca.VerificadorGoogle;
import java.util.Locale;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

/**
 * Valida o ID token do Google com as chaves públicas dele: assinatura, validade, emissor e
 * público (o client ID deste app). Não é bean de JwtDecoder de propósito: o decoder do app
 * continua sendo só o dos nossos tokens.
 */
@Component
public class GoogleIdTokenVerificador implements VerificadorGoogle {

    private static final String CHAVES = "https://www.googleapis.com/oauth2/v3/certs";
    private static final Set<String> EMISSORES = Set.of("accounts.google.com", "https://accounts.google.com");
    private static final String NAO_CONFIRMOU = "Não deu para confirmar sua conta Google. Tente de novo.";

    private final NimbusJwtDecoder decoder;

    public GoogleIdTokenVerificador(@Value("${fretai.google.client-id:}") String clientId) {
        if (clientId == null || clientId.isBlank()) {
            this.decoder = null;
            return;
        }
        NimbusJwtDecoder d = NimbusJwtDecoder.withJwkSetUri(CHAVES).build();
        OAuth2TokenValidator<Jwt> emissor = jwt -> EMISSORES.contains(jwt.getClaimAsString("iss"))
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Emissor não é o Google.", null));
        OAuth2TokenValidator<Jwt> publico = jwt -> jwt.getAudience() != null && jwt.getAudience().contains(clientId)
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Token emitido para outro app.", null));
        d.setJwtValidator(new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefault(), emissor, publico));
        this.decoder = d;
    }

    @Override
    public IdentidadeGoogle verificar(String credencial) {
        if (decoder == null) {
            throw new RegraNegocioException("Login com Google não está configurado neste servidor.");
        }
        Jwt jwt;
        try {
            jwt = decoder.decode(credencial);
        } catch (JwtException e) {
            throw new CredenciaisInvalidasException(NAO_CONFIRMOU);
        }
        String email = jwt.getClaimAsString("email");
        if (email == null || !Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified"))) {
            throw new CredenciaisInvalidasException("O e-mail dessa conta Google não foi verificado.");
        }
        return new IdentidadeGoogle(jwt.getSubject(), email.trim().toLowerCase(Locale.ROOT), jwt.getClaimAsString("name"));
    }
}
