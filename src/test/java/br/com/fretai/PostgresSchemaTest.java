package br.com.fretai;

import br.com.fretai.endereco.domain.EnderecoGateway;
import br.com.fretai.support.Postgis;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Sobe um PostgreSQL/PostGIS de verdade e confere que as migrations do Flyway
 * (inclusive as de db/vendor/postgresql) rodam e que o schema bate com as
 * entidades (ddl-auto=validate). É pulado automaticamente em máquinas sem Docker.
 */
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
@DisplayName("Schema no PostgreSQL/PostGIS real")
class PostgresSchemaTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = Postgis.container();

    @MockitoBean
    private EnderecoGateway enderecoGateway;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void migrationsAplicamESchemaValida() {
        // Se o contexto subiu, o Flyway aplicou as migrations e o Hibernate validou o schema.
    }

    @Test
    @DisplayName("Colunas geography são geradas a partir de latitude e longitude")
    void colunasGeography() {
        Integer colunas = jdbc.queryForObject("""
                SELECT count(*) FROM information_schema.columns
                WHERE table_name = 'frete' AND udt_name = 'geography'
                  AND column_name IN ('ponto_coleta_geo', 'ponto_entrega_geo')""", Integer.class);
        assertEquals(2, colunas);
    }
}
