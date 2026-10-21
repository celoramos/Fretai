package br.com.fretai.auth.infra;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

/**
 * Access tokens são JWT assinados com HMAC-SHA256. O segredo vem de
 * FRETAI_JWT_SEGREDO; sem ele, a aplicação gera um aleatório a cada subida
 * (bom para desenvolvimento: ninguém comita segredo; ruim para produção:
 * todo mundo é deslogado a cada deploy).
 */
@Configuration
class JwtConfig {

    private static final Logger log = LoggerFactory.getLogger(JwtConfig.class);
    private static final int TAMANHO_MINIMO_BYTES = 32;

    @Bean
    SecretKey chaveJwt(@Value("${fretai.jwt.segredo:}") String segredo) {
        byte[] bytes;
        if (segredo.isBlank()) {
            log.warn("FRETAI_JWT_SEGREDO não definido: usando segredo aleatório. Tokens não sobrevivem a reinício.");
            bytes = new byte[TAMANHO_MINIMO_BYTES];
            new SecureRandom().nextBytes(bytes);
        } else {
            bytes = segredo.getBytes(StandardCharsets.UTF_8);
            if (bytes.length < TAMANHO_MINIMO_BYTES) {
                throw new IllegalStateException("FRETAI_JWT_SEGREDO precisa ter pelo menos 32 bytes. Gere um com: "
                        + "openssl rand -base64 48");
            }
        }
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey chaveJwt) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(chaveJwt));
    }

    @Bean
    JwtDecoder jwtDecoder(SecretKey chaveJwt) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(chaveJwt).macAlgorithm(MacAlgorithm.HS256).build();
        // Além de assinatura e validade, confere que o token foi emitido por nós.
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(JwtEmissorToken.EMISSOR));
        return decoder;
    }
}
