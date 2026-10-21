package br.com.fretai.auth.infra;

import br.com.fretai.shared.seguranca.Papel;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import java.util.List;
import java.util.UUID;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Transforma o JWT validado em {@link UsuarioLogado}, que é o que os controllers
 * recebem em {@code @AuthenticationPrincipal}. Ninguém fora daqui lida com JWT.
 */
class UsuarioLogadoConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        String empresa = jwt.getClaimAsString(JwtEmissorToken.CLAIM_EMPRESA);
        UsuarioLogado usuario = new UsuarioLogado(UUID.fromString(jwt.getSubject()),
                Papel.valueOf(jwt.getClaimAsString(JwtEmissorToken.CLAIM_PAPEL)),
                empresa == null ? null : UUID.fromString(empresa));
        return new Autenticado(usuario, jwt);
    }

    static final class Autenticado extends AbstractAuthenticationToken {

        private final UsuarioLogado usuario;
        private final Jwt jwt;

        Autenticado(UsuarioLogado usuario, Jwt jwt) {
            super(List.of(new SimpleGrantedAuthority("ROLE_" + usuario.papel().name())));
            this.usuario = usuario;
            this.jwt = jwt;
            setAuthenticated(true);
        }

        @Override
        public Object getCredentials() {
            return jwt;
        }

        @Override
        public Object getPrincipal() {
            return usuario;
        }

        @Override
        public String getName() {
            return usuario.id().toString();
        }
    }
}
