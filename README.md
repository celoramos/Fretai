# Fretai

Fretai é um projeto Java em desenvolvimento para simular uma plataforma de logística e transporte de cargas, com foco em solicitação, gestão e acompanhamento de fretes. O sistema foi concebido como um protótipo para praticar conceitos de Java, Spring Boot, validação de dados, consumo de APIs externas e regras de negócio do ciclo de vida de entregas.

Atualmente, o projeto está centrado em lógica de domínio e testes automatizados, com ênfase em:
- cadastro de clientes e motoristas;
- validação de CPF e e-mail;
- consulta de endereços via CEP usando a API do ViaCEP;
- criação e acompanhamento de fretes;
- mudança de status do transporte até a entrega ou cancelamento.

## Visão geral do projeto

O projeto organiza a lógica em módulos por responsabilidade:

- `br.com.Fretai.Cep`: consulta de CEP, modelagem de endereço e geração de arquivos JSON;
- `br.com.Fretai.Frete`: regras do frete, status e resumo do pedido;
- `br.com.Fretai.Usuarios`: cadastro de cliente e motorista;
- `br.com.Fretai.Verificacoes`: validação de CPF e e-mail;
- `br.com.Fretai.Exception`: exceções personalizadas do sistema.

## Funcionalidades implementadas até o momento

### 1. Cadastro de cliente
A classe `CadastroCliente` representa um cliente da plataforma e armazena:
- CPF;
- nome;
- e-mail;
- senha;
- telefone;
- endereço de remetente;
- endereço de entrega.

Também possui validações com Bean Validation (`@CPF`, `@Email`, `@NotBlank`, `@Size`), que ajudam a garantir que os dados preenchidos respeitem regras mínimas de integridade.

### 2. Cadastro de motorista
A classe `CadastroMotorista` representa um motorista disponível para aceitar fretes e guarda:
- CPF;
- nome;
- e-mail;
- senha;
- telefone;
- tipo de veículo/carro.

Essa entidade é utilizada no fluxo de atribuição de motorista ao frete.

### 3. Validação de CPF
A classe `VerificarCPF` implementa validação matemática de CPF, incluindo:
- aceitação de CPF com ou sem máscara;
- rejeição de sequências repetidas (`00000000000`, `11111111111`, etc.);
- verificação dos dígitos verificadores;
- formatação para o padrão `XXX.XXX.XXX-XX`;
- suporte seguro a entradas nulas e inválidas.

Essa funcionalidade é coberta por testes automatizados em `VerificarCPFTest`.

### 4. Validação de e-mail
A classe `VerificarEmail` valida endereços de e-mail conforme regras básicas de integridade, como:
- presença de `@`;
- domínio com ponto;
- rejeição de valores vazios, nulos ou malformados;
- uso do validador do Hibernate Validator.

### 5. Consulta de CEP via API externa
A classe `ConsultaCep` consulta endereços por CEP usando a API do ViaCEP:
- recebe um CEP em qualquer formato com ou sem máscara;
- normaliza para 8 dígitos;
- faz requisição HTTP para `https://viacep.com.br/ws/{cep}/json/`;
- converte a resposta para a classe `Endereco`;
- dispara exceção caso o CEP seja inválido ou inexistente.

A classe `Endereco` representa o retorno da API e inclui atributos como:
- cep;
- logradouro;
- complemento;
- bairro;
- localidade;
- UF;
- estado;
- etc.

### 6. Geração de arquivo JSON de endereço
A classe `GeradorArquivo` salva o resultado da consulta de CEP em um arquivo `.json` com nome baseado no CEP informado.

Essa funcionalidade é útil para persistir uma cópia do endereço consultado em disco local.

### 7. Solicitação de frete
A classe `FreteService` contém a regra principal para criar um novo frete:

- `solicitarFrete(...)`

Esse método:
- valida se o cliente solicitante existe;
- consulta os endereços de origem e destino pelo CEP;
- monta o ponto de coleta e o ponto de entrega;
- cria uma nova instância de `Frete` com o cliente e dados da carga.

### 8. Acompanhamento do ciclo de vida do frete
A enumeração `StatusFrete` define os estados possíveis de um frete:
- `PENDENTE` — aguardando motorista;
- `ACEITO` — motorista aceitou a entrega;
- `EM_TRANSITO` — carga coletada e em transporte;
- `ENTREGUE` — entrega concluída;
- `CANCELADO` — frete cancelado.

### 9. Atribuição de motorista
O serviço oferece o método:

- `atribuirMotorista(Frete frete, CadastroMotorista motorista)`

Regras:
- frete não pode ser nulo;
- motorista não pode ser nulo;
- apenas fretes em status `PENDENTE` podem receber motorista;
- ao aceitar, o status do frete passa para `ACEITO`.

### 10. Início do transporte
O método:

- `iniciarTransporte(Frete frete)`

altera o frete para `EM_TRANSITO` apenas quando ele estiver em status `ACEITO`.

### 11. Conclusão da entrega
A operação:

- `concluirEntrega(Frete frete)`

exige que o frete esteja em `EM_TRANSITO` e então atualiza:
- status para `ENTREGUE`;
- `dataConclusao` com a data/hora atual.

### 12. Cancelamento de frete
O método:

- `cancelarFrete(Frete frete, String motivo)`

permite cancelar fretes que ainda não tenham sido entregues. Se o status já for `ENTREGUE` ou `CANCELADO`, a operação é bloqueada com exceção.

### 13. Endereço completo do frete
A classe `EnderecoFrete` formata o endereço completo do ponto de coleta ou entrega com:
- logradouro;
- número;
- complemento;
- bairro;
- cidade/UF;
- CEP;
- ponto de referência.

Ela também oferece o método `getEnderecoCompleto()`, muito útil para exibir os dados do endereço em console ou no resumo final do frete.

### 14. Resumo do frete
A classe `Frete` possui o método:

- `gerarResumoFrete()`

Esse método gera um texto organizado com:
- identificador do frete;
- status atual;
- cliente solicitante;
- motorista atribuído;
- valor da carga;
- descrição da carga;
- ponto de coleta;
- ponto de entrega;
- destinatário.

### 15. Fluxo de inicialização do projeto
A classe `Application` inicia a aplicação com Spring Boot e também apresenta um roteiro de console simples para simular a pergunta inicial:
- "Você já tem cadastro no Fretai?"
- a lógica ainda está em fase inicial e funciona como base para evolução da aplicação.

### 16. Consulta direta de CEP via programa console
A classe `Principal` em `br.com.Fretai.Cep` permite executar um experimento simples no console:
- digitar um CEP;
- consultar o banco de dados do ViaCEP;
- exibir dados do endereço;
- salvar o resultado em JSON.

## Estrutura do projeto

```text
Fretai-Java/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── br/com/Fretai/
│   │   │       ├── Application.java
│   │   │       ├── Cep/
│   │   │       │   ├── ConsultaCep.java
│   │   │       │   ├── Endereco.java
│   │   │       │   ├── GeradorArquivo.java
│   │   │       │   └── Principal.java
│   │   │       ├── Exception/
│   │   │       │   ├── CepNaoEncontradoException.java
│   │   │       │   ├── CpfInvalidoException.java
│   │   │       │   └── ExceptionErros.java
│   │   │       ├── Frete/
│   │   │       │   ├── EnderecoFrete.java
│   │   │       │   ├── Frete.java
│   │   │       │   ├── FreteService.java
│   │   │       │   └── StatusFrete.java
│   │   │       ├── Usuarios/
│   │   │       │   ├── CadastroCliente.java
│   │   │       │   └── CadastroMotorista.java
│   │   │       └── Verificacoes/
│   │   │           ├── VerificarCPF.java
│   │   │           └── VerificarEmail.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│       └── java/
│           └── br/com/Fretai/
│               ├── ApplicationTests.java
│               ├── Frete/
│               │   └── FreteServiceTest.java
│               └── Verificacoes/
│                   ├── VerificarCPFTest.java
│                   └── VerificarEmailTest.java
├── pom.xml
├── mvnw.cmd
├── .mvn/
└── README.md
```

## Tecnologias e dependências

- Java 21
- Spring Boot 4.1.1
- Maven
- Gson
- Jakarta Validation
- Hibernate Validator
- JUnit 5
- Mockito

## Requisitos para executar

- JDK 21 ou superior
- Maven instalado ou uso do wrapper (`mvnw.cmd`)
- Conexão com a internet para consultar o ViaCEP

## Como executar o projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/celoramos/Fretai.git
cd Fretai
```

### 2. Rodar os testes

```bash
mvn test
```

### 3. Executar a aplicação Spring Boot

```bash
mvn spring-boot:run
```

ou, se preferir, buildar o jar:

```bash
mvn clean package
java -jar target/demo-0.0.1-SNAPSHOT.jar
```

## Fluxo principal de uso

O fluxo principal do protótipo é:

1. criar um `CadastroCliente`;
2. validar CPF e e-mail;
3. consultar CEPs de origem e destino;
4. criar um `Frete` via `FreteService.solicitarFrete(...)`;
5. atribuir um `CadastroMotorista`;
6. iniciar o transporte;
7. concluir entrega ou cancelar o frete conforme a regra do negócio.

## Observações importantes

- O projeto ainda é um protótipo, sem persistência em banco de dados;
- a aplicação trabalha principalmente com objetos em memória e testes de regras de negócio;
- a parte de API web/REST e autenticação ainda não foi implementada;
- o sistema já possui uma estrutura sólida para evoluir para um backend mais completo.

## Status atual

O projeto já contempla:
- cadastro e validação de usuários;
- consulta de CEP e normalização de endereço;
- regras de negócio de fretes;
- ciclo de vida completo de entrega;
- testes automatizados para as principais regras.

Em resumo, o Fretai já tem uma base funcional de domínio e logística para continuar evoluindo para uma aplicação mais completa, com interface, banco de dados e camada de serviços REST.
