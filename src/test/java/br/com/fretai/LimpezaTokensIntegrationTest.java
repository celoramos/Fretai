package br.com.fretai;

import br.com.fretai.auth.application.LimpezaTokens;
import br.com.fretai.auth.domain.RefreshToken;
import br.com.fretai.auth.domain.RefreshTokenRepository;
import br.com.fretai.auth.domain.TokenSenha;
import br.com.fretai.auth.domain.TokenSenhaRepository;
import br.com.fretai.usuario.domain.Cliente;
import br.com.fretai.usuario.domain.ClienteRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Contra o H2 com as migrations de verdade; a transação do teste desfaz tudo no fim. */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("Limpeza de refresh tokens e links de senha vencidos")
class LimpezaTokensIntegrationTest {

    @Autowired private LimpezaTokens limpeza;
    @Autowired private RefreshTokenRepository refreshTokens;
    @Autowired private TokenSenhaRepository tokensSenha;
    @Autowired private ClienteRepository clientes;

    @Test
    @DisplayName("Sai o que venceu; fica o que ainda vale e o revogado que denuncia reuso")
    void apagaSoOsVencidos() {
        UUID usuario = clientes.saveAndFlush(new Cliente("90817263544", "Dona dos Tokens",
                "limpeza.tokens@email.com", "hash", "11999990000")).getId();
        Instant agora = Instant.now();
        Instant passou = agora.minus(Duration.ofMinutes(1));
        Instant aindaVale = agora.plus(Duration.ofDays(1));

        refreshTokens.saveAndFlush(new RefreshToken(usuario, "limpeza-refresh-vencido", passou));
        refreshTokens.saveAndFlush(revogado(new RefreshToken(usuario, "limpeza-refresh-revogado-vencido", passou)));
        refreshTokens.saveAndFlush(new RefreshToken(usuario, "limpeza-refresh-valido", aindaVale));
        refreshTokens.saveAndFlush(revogado(new RefreshToken(usuario, "limpeza-refresh-revogado", aindaVale)));
        tokensSenha.saveAndFlush(new TokenSenha(usuario, "limpeza-senha-vencido", passou));
        tokensSenha.saveAndFlush(new TokenSenha(usuario, "limpeza-senha-valido", aindaVale));

        int apagados = limpeza.apagarVencidos();

        // Outros testes deixam tokens vencidos no mesmo banco: pelo menos os três daqui saíram.
        assertTrue(apagados >= 3, "apagados: " + apagados);
        assertFalse(refreshTokens.findByHash("limpeza-refresh-vencido").isPresent());
        assertFalse(refreshTokens.findByHash("limpeza-refresh-revogado-vencido").isPresent());
        assertFalse(tokensSenha.findByHash("limpeza-senha-vencido").isPresent());
        assertTrue(refreshTokens.findByHash("limpeza-refresh-valido").isPresent());
        assertTrue(refreshTokens.findByHash("limpeza-refresh-revogado").isPresent(),
                "revogado e dentro da validade fica: é ele que denuncia a sessão copiada");
        assertTrue(tokensSenha.findByHash("limpeza-senha-valido").isPresent());
    }

    private static RefreshToken revogado(RefreshToken token) {
        token.revogar();
        return token;
    }
}
