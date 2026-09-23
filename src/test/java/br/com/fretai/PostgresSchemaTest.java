package br.com.fretai;

import br.com.fretai.endereco.domain.EnderecoGateway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Sobe um PostgreSQL de verdade e confere que as migrations do Flyway rodam e
 * que o schema bate com as entidades (ddl-auto=validate). É pulado
 * automaticamente em máquinas sem Docker.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@DisplayName("Schema no PostgreSQL real")
class PostgresSchemaTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17-alpine");

    @MockitoBean
    private EnderecoGateway enderecoGateway;

    @Test
    void migrationsAplicamESchemaValida() {
        // Se o contexto subiu, o Flyway aplicou as migrations e o Hibernate validou o schema.
    }
}
