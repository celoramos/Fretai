package br.com.fretai.auth.application;

import br.com.fretai.auth.domain.RefreshTokenRepository;
import br.com.fretai.auth.domain.TokenSenhaRepository;
import java.time.Instant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cada login e cada renovação gravam um refresh token, e cada "esqueci a senha" grava um link. Sem
 * esta limpeza as duas tabelas só crescem.
 *
 * Só sai o que já venceu. O refresh token revogado e ainda dentro da validade fica: é ele que
 * denuncia o reuso de uma sessão copiada. Vencido, é recusado de qualquer jeito, exista a linha ou não.
 */
@Service
public class LimpezaTokens {

    private final RefreshTokenRepository refreshTokenRepository;
    private final TokenSenhaRepository tokenSenhaRepository;

    public LimpezaTokens(RefreshTokenRepository refreshTokenRepository, TokenSenhaRepository tokenSenhaRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.tokenSenhaRepository = tokenSenhaRepository;
    }

    /** @return quantos registros saíram */
    @Transactional
    public int apagarVencidos() {
        Instant agora = Instant.now();
        return refreshTokenRepository.apagarVencidos(agora) + tokenSenhaRepository.apagarVencidos(agora);
    }
}
