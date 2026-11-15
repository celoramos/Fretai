package br.com.fretai.auth.domain;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface TokenSenhaRepository extends JpaRepository<TokenSenha, UUID> {

    Optional<TokenSenha> findByHash(String hash);

    /** Pedido novo: os links abertos de antes deixam de valer. */
    @Modifying
    @Query("UPDATE TokenSenha t SET t.usadoEm = :agora WHERE t.usuarioId = :usuarioId AND t.usadoEm IS NULL")
    int invalidarAbertos(UUID usuarioId, Instant agora);

    /** Link vencido não troca a senha de ninguém, usado ou não: já pode sair do banco. */
    @Modifying
    @Query("DELETE FROM TokenSenha t WHERE t.expiraEm < :agora")
    int apagarVencidos(Instant agora);
}
