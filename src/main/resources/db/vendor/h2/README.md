Migrations específicas do H2 (usado só nos testes). Hoje não há nenhuma:
as colunas geography e a busca por raio existem só no PostgreSQL/PostGIS
(veja `db/vendor/postgresql`) e são testadas com Testcontainers.
