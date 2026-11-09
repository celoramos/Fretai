package br.com.fretai.auth.application;

import br.com.fretai.auth.domain.CorreioSenha;
import br.com.fretai.auth.domain.RefreshTokenRepository;
import br.com.fretai.auth.domain.TokenSenha;
import br.com.fretai.auth.domain.TokenSenhaRepository;
import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.usuario.domain.Usuario;
import br.com.fretai.usuario.domain.UsuarioRepository;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Esqueci a senha. O pedido sempre parece igual por fora, exista a conta ou não; o link vale uma hora e
 * uma vez, e a troca derruba todas as sessões abertas, para quem estava com a senha antiga sair.
 * Serve também para quem entrou só com o Google criar uma senha.
 */
@Service
public class SenhaService {

    private static final Duration VALIDADE = Duration.ofHours(1);
    private static final String LINK_INVALIDO = "Este link não vale mais. Peça outro na tela de entrar.";
    private static final SecureRandom ALEATORIO = new SecureRandom();

    private final UsuarioRepository usuarioRepository;
    private final TokenSenhaRepository tokenSenhaRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final LimitadorTentativas limitador;
    private final CorreioSenha correio;
    private final String urlFront;

    public SenhaService(UsuarioRepository usuarioRepository, TokenSenhaRepository tokenSenhaRepository,
                        RefreshTokenRepository refreshTokenRepository, PasswordEncoder passwordEncoder,
                        LimitadorTentativas limitador, CorreioSenha correio,
                        @Value("${fretai.front.url}") String urlFront) {
        this.usuarioRepository = usuarioRepository;
        this.tokenSenhaRepository = tokenSenhaRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.limitador = limitador;
        this.correio = correio;
        this.urlFront = urlFront;
    }

    /** Cada pedido conta como tentativa: depois do limite, o mesmo 429 do login, para ninguém encher a caixa de alguém. */
    @Transactional
    public void pedirLink(String email) {
        String normalizado = email.trim().toLowerCase(Locale.ROOT);
        String chave = "senha:" + normalizado;
        limitador.verificar(chave);
        limitador.registrarFalha(chave);
        usuarioRepository.findByEmailIgnoreCase(normalizado).filter(Usuario::isAtivo).ifPresent(usuario -> {
            Instant agora = Instant.now();
            tokenSenhaRepository.invalidarAbertos(usuario.getId(), agora);
            byte[] bytes = new byte[32];
            ALEATORIO.nextBytes(bytes);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            tokenSenhaRepository.save(new TokenSenha(usuario.getId(), AuthService.hash(token), agora.plus(VALIDADE)));
            correio.enviarLink(usuario.getEmail(), usuario.getNome(), urlFront + "/nova-senha?token=" + token);
        });
    }

    @Transactional
    public void definirSenha(String token, String senha) {
        Instant agora = Instant.now();
        TokenSenha registro = tokenSenhaRepository.findByHash(AuthService.hash(token))
                .filter(t -> t.valido(agora))
                .orElseThrow(() -> new RegraNegocioException(LINK_INVALIDO));
        Usuario usuario = usuarioRepository.findById(registro.getUsuarioId())
                .filter(Usuario::isAtivo)
                .orElseThrow(() -> new RegraNegocioException(LINK_INVALIDO));
        usuario.definirSenha(passwordEncoder.encode(senha));
        registro.usar(agora);
        refreshTokenRepository.revogarTodos(usuario.getId());
    }
}
