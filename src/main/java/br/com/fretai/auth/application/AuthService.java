package br.com.fretai.auth.application;

import br.com.fretai.auth.application.dto.LoginRequest;
import br.com.fretai.auth.application.dto.TokensResponse;
import br.com.fretai.auth.domain.EmissorToken;
import br.com.fretai.auth.domain.RefreshToken;
import br.com.fretai.auth.domain.RefreshTokenRepository;
import br.com.fretai.shared.exception.CredenciaisInvalidasException;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import br.com.fretai.usuario.domain.Usuario;
import br.com.fretai.usuario.domain.UsuarioRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Login, renovação e logout. O access token é curto (minutos) e não pode ser
 * revogado; o refresh token é longo, fica no banco e pode.
 */
@Service
public class AuthService {

    private static final String CREDENCIAIS_INVALIDAS = "E-mail ou senha incorretos.";
    private static final SecureRandom ALEATORIO = new SecureRandom();

    private final UsuarioRepository usuarioRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmissorToken emissorToken;
    private final LimitadorTentativas limitador;
    private final Duration validadeRefresh;
    /** Hash de mentira: e-mail inexistente também paga o custo do BCrypt, e o tempo de resposta não entrega quem tem conta. */
    private final String hashFalso;

    public AuthService(UsuarioRepository usuarioRepository, RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder, EmissorToken emissorToken, LimitadorTentativas limitador,
                       @Value("${fretai.jwt.validade-refresh:30d}") Duration validadeRefresh) {
        this.usuarioRepository = usuarioRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emissorToken = emissorToken;
        this.limitador = limitador;
        this.validadeRefresh = validadeRefresh;
        this.hashFalso = passwordEncoder.encode("senha-que-ninguem-usa");
    }

    /**
     * @param origem IP de quem chamou; entra na chave do limitador junto com o e-mail
     * @throws CredenciaisInvalidasException e-mail inexistente, senha errada ou conta desativada
     *         (sempre a mesma mensagem, para não revelar quais e-mails existem)
     */
    @Transactional
    public TokensResponse login(LoginRequest request, String origem) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String chave = origem + "|" + email;
        limitador.verificar(chave);

        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(email).orElse(null);
        // Exatamente um BCrypt em qualquer caminho: o tempo de resposta não diz se o e-mail existe.
        boolean senhaConfere;
        if (usuario != null) {
            senhaConfere = usuario.confereSenha(request.senha(), passwordEncoder);
        } else {
            passwordEncoder.matches(request.senha(), hashFalso);
            senhaConfere = false;
        }
        if (!senhaConfere || !usuario.isAtivo()) {
            limitador.registrarFalha(chave);
            throw new CredenciaisInvalidasException(CREDENCIAIS_INVALIDAS);
        }
        limitador.registrarSucesso(chave);
        return emitir(usuario.comoUsuarioLogado());
    }

    /**
     * Troca um refresh token válido por um par novo. Se o token apresentado já
     * tinha sido usado, é sinal de que vazou: todas as sessões do usuário caem.
     * A revogação em massa grava mesmo que a exceção desfaça o resto.
     */
    @Transactional(noRollbackFor = CredenciaisInvalidasException.class)
    public TokensResponse renovar(String refreshToken) {
        RefreshToken atual = refreshTokenRepository.findByHash(hash(refreshToken))
                .orElseThrow(() -> new CredenciaisInvalidasException("Sessão inválida. Faça login de novo."));
        if (atual.isRevogado()) {
            refreshTokenRepository.revogarTodos(atual.getUsuarioId());
            throw new CredenciaisInvalidasException("Sessão inválida. Faça login de novo.");
        }
        if (!atual.valido(Instant.now())) {
            throw new CredenciaisInvalidasException("Sessão expirada. Faça login de novo.");
        }
        Usuario usuario = usuarioRepository.findById(atual.getUsuarioId())
                .filter(Usuario::isAtivo)
                .orElseThrow(() -> new CredenciaisInvalidasException("Sessão inválida. Faça login de novo."));
        atual.revogar();
        return emitir(usuario.comoUsuarioLogado());
    }

    @Transactional
    public void sair(String refreshToken) {
        refreshTokenRepository.findByHash(hash(refreshToken)).ifPresent(RefreshToken::revogar);
    }

    private TokensResponse emitir(UsuarioLogado usuario) {
        byte[] bytes = new byte[32];
        ALEATORIO.nextBytes(bytes);
        String refresh = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        refreshTokenRepository.save(new RefreshToken(usuario.id(), hash(refresh), Instant.now().plus(validadeRefresh)));

        return new TokensResponse(emissorToken.emitir(usuario), refresh, "Bearer",
                emissorToken.validade().toSeconds(), usuario.id(), usuario.papel(), usuario.empresaId());
    }

    static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponível na JVM", e);
        }
    }
}
