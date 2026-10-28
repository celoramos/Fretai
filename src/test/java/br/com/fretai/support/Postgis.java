package br.com.fretai.support;

import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/** Mesma imagem do docker-compose: PostgreSQL 17 com PostGIS. */
public final class Postgis {

    private static final DockerImageName IMAGEM = DockerImageName.parse("postgis/postgis:17-3.6-alpine")
            .asCompatibleSubstituteFor("postgres");

    private Postgis() {
    }

    public static PostgreSQLContainer container() {
        return new PostgreSQLContainer(IMAGEM);
    }
}
