package br.com.fretai.auth.application;

import br.com.fretai.auth.application.dto.LoginRequest;
import br.com.fretai.auth.application.dto.TokensResponse;
import br.com.fretai.auth.domain.EmissorToken;
import br.com.fretai.auth.domain.RefreshTokenRepository;
import br.com.fretai.shared.exception.CadastroNecessarioException;
import br.com.fretai.shared.exception.CredenciaisInvalidasException;
import br.com.fretai.shared.seguranca.IdentidadeGoogle;
import br.com.fretai.shared.seguranca.VerificadorGoogle;
import br.com.fretai.usuario.domain.CategoriaVeiculo;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.UsuarioRepository;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Entrar com Google")
class EntrarComGoogleTest {

    private static final IdentidadeGoogle JOAO = new IdentidadeGoogle("sub-123", "joao@gmail.com", "João Souza");

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private EmissorToken emissorToken;
    @Mock private LimitadorTentativas limitador;
    @Mock private VerificadorGoogle verificadorGoogle;

    private AuthService service;

    @BeforeEach
    void setUp() {
        service = new AuthService(usuarioRepository, refreshTokenRepository, NoOpPasswordEncoder.getInstance(),
                emissorToken, limitador, verificadorGoogle, Duration.ofDays(30));
        when(emissorToken.emitir(any())).thenReturn("access");
        when(emissorToken.validade()).thenReturn(Duration.ofMinutes(15));
        when(verificadorGoogle.verificar("credencial")).thenReturn(JOAO);
    }

    /** Com id, como se tivesse vindo do banco: o refresh token guarda o id do usuário. */
    private static Motorista motorista(String senhaHash) {
        Motorista m = new Motorista("11144477735", "João", "joao@gmail.com", senhaHash, "11988887777",
                CategoriaVeiculo.CAMINHAO, "ABC1D23");
        ReflectionTestUtils.setField(m, "id", UUID.randomUUID());
        return m;
    }

    @Test
    @DisplayName("Conta já ligada ao Google entra direto")
    void entraPeloSub() {
        when(usuarioRepository.findByGoogleSub("sub-123")).thenReturn(Optional.of(motorista(null)));

        TokensResponse tokens = service.entrarComGoogle("credencial");

        assertEquals("access", tokens.accessToken());
    }

    @Test
    @DisplayName("Na primeira vez, acha a conta pelo e-mail e liga o Google a ela")
    void ligaPeloEmail() {
        Motorista existente = motorista("senha");
        when(usuarioRepository.findByGoogleSub("sub-123")).thenReturn(Optional.empty());
        when(usuarioRepository.findByEmailIgnoreCase("joao@gmail.com")).thenReturn(Optional.of(existente));

        service.entrarComGoogle("credencial");

        assertThrows(IllegalStateException.class, () -> existente.vincularGoogle("outro-sub"),
                "depois de ligada, a conta não aceita outro Google");
    }

    @Test
    @DisplayName("Sem conta, pede o cadastro com o e-mail e o nome do Google")
    void pedeCadastro() {
        when(usuarioRepository.findByGoogleSub("sub-123")).thenReturn(Optional.empty());
        when(usuarioRepository.findByEmailIgnoreCase("joao@gmail.com")).thenReturn(Optional.empty());

        CadastroNecessarioException e = assertThrows(CadastroNecessarioException.class,
                () -> service.entrarComGoogle("credencial"));

        assertEquals("joao@gmail.com", e.getEmail());
        assertEquals("João Souza", e.getNome());
    }

    @Test
    @DisplayName("Conta criada só com Google não entra por senha")
    void contaSemSenhaNaoEntraPorSenha() {
        when(usuarioRepository.findByEmailIgnoreCase("joao@gmail.com")).thenReturn(Optional.of(motorista(null)));

        assertThrows(CredenciaisInvalidasException.class,
                () -> service.login(new LoginRequest("joao@gmail.com", "qualquer"), "127.0.0.1"));
    }
}
