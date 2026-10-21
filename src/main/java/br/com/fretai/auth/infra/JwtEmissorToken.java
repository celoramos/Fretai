package br.com.fretai.auth.infra;

import br.com.fretai.auth.domain.EmissorToken;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import java.time.Duration;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Component;

@Component
class JwtEmissorToken implements EmissorToken {

    static final String EMISSOR = "fretai";
    static final String CLAIM_PAPEL = "papel";
    static final String CLAIM_EMPRESA = "empresa";

    private final JwtEncoder encoder;
    private final Duration validade;

    JwtEmissorToken(JwtEncoder encoder, @Value("${fretai.jwt.validade-acesso:15m}") Duration validade) {
        this.encoder = encoder;
        this.validade = validade;
    }

    @Override
    public String emitir(UsuarioLogado usuario) {
        Instant agora = Instant.now();
        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .issuer(EMISSOR)
                .subject(usuario.id().toString())
                .issuedAt(agora)
                .expiresAt(agora.plus(validade))
                .claim(CLAIM_PAPEL, usuario.papel().name());
        if (usuario.empresaId() != null) {
            claims.claim(CLAIM_EMPRESA, usuario.empresaId().toString());
        }
        JwsHeader cabecalho = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(cabecalho, claims.build())).getTokenValue();
    }

    @Override
    public Duration validade() {
        return validade;
    }
}
