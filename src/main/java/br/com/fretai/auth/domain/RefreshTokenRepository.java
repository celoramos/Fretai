package br.com.fretai.auth.domain;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByHash(String hash);

    /** Usado quando um token já revogado volta: alguém copiou a sessão, então todas caem. */
    @Modifying
    @Query("UPDATE RefreshToken r SET r.revogado = true WHERE r.usuarioId = :usuarioId")
    int revogarTodos(UUID usuarioId);
}
