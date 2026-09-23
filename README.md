# Fretai

Plataforma para solicitar e acompanhar fretes. O cliente informa de onde sai e para onde vai a carga, um motorista aceita, e o frete passa por coleta, transporte e entrega (ou cancelamento).

Hoje o projeto é uma API REST em Java com Spring Boot e PostgreSQL. A interface web vem depois.

## Tecnologias

- Java 21 e Spring Boot 4.1
- PostgreSQL 17, com migrations pelo Flyway
- Spring Data JPA (Hibernate)
- Bean Validation, incluindo `@CPF` do Hibernate Validator
- ViaCEP para consulta de endereço por CEP
- springdoc-openapi (Swagger UI)
- JUnit 5, Mockito, ArchUnit, H2 e Testcontainers nos testes

## Como rodar

Requisitos: JDK 21 ou superior e Docker.

```bash
git clone https://github.com/celoramos/Fretai.git
cd Fretai

# banco local
docker compose up -d

# aplicação (Windows)
.\mvnw.cmd spring-boot:run
```

A API sobe em `http://localhost:8080`. A documentação interativa fica em `http://localhost:8080/swagger-ui.html` e o health check em `/actuator/health`.

As credenciais do banco vêm de `DB_URL`, `DB_USER` e `DB_PASSWORD`. Sem essas variáveis, a aplicação usa os valores do `docker-compose.yml`.

## Testes

```bash
.\mvnw.cmd test
```

Os testes de integração rodam contra um H2 em modo PostgreSQL e aplicam as mesmas migrations do Flyway, então funcionam sem Docker. O `PostgresSchemaTest` sobe um PostgreSQL de verdade pelo Testcontainers e é pulado quando não há Docker na máquina.

## Endpoints

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/api/clientes` | cadastra cliente |
| POST | `/api/motoristas` | cadastra motorista e veículo |
| POST | `/api/fretes` | solicita frete |
| GET | `/api/fretes/{id}` | detalhe do frete |
| GET | `/api/fretes?status=PENDENTE` | lista fretes por status, paginado |
| POST | `/api/fretes/{id}/aceite` | motorista aceita o frete |
| POST | `/api/fretes/{id}/inicio` | inicia o transporte |
| POST | `/api/fretes/{id}/conclusao` | conclui a entrega |
| POST | `/api/fretes/{id}/cancelamento` | cancela, com motivo |

Os erros seguem o formato ProblemDetail (RFC 9457):

| Status | Quando |
|---|---|
| 400 | campo inválido; a resposta traz `erros` com a mensagem de cada campo |
| 404 | cliente, motorista ou frete não existe |
| 409 | CPF, e-mail ou placa já cadastrados; transição de status inválida; frete alterado por outra pessoa ao mesmo tempo |
| 422 | CEP inexistente; veículo não suporta o peso da carga |
| 503 | ViaCEP fora do ar ou lento |

## Ciclo de vida do frete

```
PENDENTE ──aceitar──▶ ACEITO ──iniciar──▶ EM_TRANSITO ──concluir──▶ ENTREGUE
    └────────────────────┴────────cancelar─────────┴──────────────▶ CANCELADO
```

As transições ficam na própria entidade `Frete`. Não existe `setStatus` público, então nenhum código consegue pular uma etapa.

O `Frete` tem um campo `@Version`. Se dois motoristas aceitarem o mesmo frete ao mesmo tempo, só o primeiro grava; o segundo recebe 409.

## Arquitetura

Um único serviço Spring Boot, dividido em módulos por assunto. Todos os módulos usam as mesmas quatro camadas:

```
api  ──▶  application  ──▶  domain  ◀──  infra
```

| Camada | Contém | Pode depender de |
|---|---|---|
| `domain` | entidades, regras de negócio, interfaces de repositório e de serviços externos | só de outro `domain` e de `shared` |
| `application` | casos de uso (services) e DTOs de entrada e saída | `domain` |
| `api` | controllers REST | `application` e `domain` |
| `infra` | integrações externas e configuração técnica | `domain` |

O `ArquiteturaTest` confere essas regras a cada build. Se uma delas quebrar, mova a classe para a camada certa em vez de mudar o teste.

```
src/main/java/br/com/fretai/
├── Application.java
├── frete/
│   ├── api/            FreteController
│   ├── application/    FreteService, dto/
│   └── domain/         Frete, StatusFrete, EnderecoFrete, FreteRepository
├── usuario/
│   ├── api/            UsuarioController
│   ├── application/    UsuarioService, dto/
│   ├── domain/         Usuario, Cliente, Motorista, TipoVeiculo, repositórios
│   └── infra/          SenhaConfig (BCrypt)
├── endereco/
│   ├── domain/         Endereco, EnderecoGateway, exceções de CEP
│   └── infra/          ViaCepClient, CacheConfig
└── shared/
    ├── api/            GlobalExceptionHandler
    └── exception/      exceções usadas por todos os módulos

src/main/resources/
├── application.yml
└── db/migration/       V1__schema_inicial.sql

src/test/java/br/com/fretai/
├── ArquiteturaTest, FluxoFreteIntegrationTest, PostgresSchemaTest
├── frete/              testes de domínio, service e controller
├── usuario/            validação dos dados de cadastro
└── support/            Fixtures (objetos de teste prontos)
```

O `EnderecoGateway` é uma interface do domínio, e o `ViaCepClient` é só uma implementação dela. Trocar de provedor de CEP, ou colocar um segundo como reserva, não mexe em nenhum service.

## Convenções

- Toda mudança no banco é um novo arquivo `V2__...`, `V3__...` em `db/migration`. Arquivos que já rodaram não são editados.
- Dinheiro e peso são `BigDecimal`, nunca `double`.
- Entidades não são devolvidas pela API. A resposta sempre passa por um DTO, e nenhum DTO de resposta tem senha ou CPF.
- CPF, telefone e placa são guardados só com dígitos e letras, sem máscara.

## Próximos passos

1. Login com Spring Security e JWT, com papéis de cliente, motorista e administrador. Aprovação de motorista (CNH e documento do veículo) e LGPD.
2. Preço calculado pela plataforma a partir de distância, peso e tipo de veículo, com lances e contrapropostas entre cliente e motorista.
3. Pagamento por Pix ou cartão, com a comissão da plataforma separada do valor do motorista.
4. Aplicativo web responsivo para clientes e motoristas.
5. Integração contínua, deploy e monitoramento.

## Pendente

`TipoVeiculo.suporta(pesoKg)` ainda aceita qualquer peso. Falta definir a capacidade de cada tipo de veículo.
