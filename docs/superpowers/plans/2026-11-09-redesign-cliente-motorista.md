# Redesign do cliente e do motorista Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar as telas do cliente pessoa física e do motorista iguais ao canvas, no celular e
no computador, com cada botão ligado à API.

**Architecture:** Primeiro a API ganha o que o canvas pede e ainda não existe: tamanho do
veículo e tipo de carga no pedido, veículo simples, fotos da carga, dados privados escondidos,
contato depois do aceite, senha nova por link e base por CEP. Depois vem o front: tipos e modo
demo, layouts e componentes comuns, e uma tarefa por página, na ordem da spec. O modo demo
emula cada endpoint novo, porque a busca real precisa de PostGIS e as telas são conferidas nele.

**Tech Stack:** Spring Boot / Java 21, Flyway (H2 nos testes), JUnit 5 + MockMvc, ArchUnit;
React 19, React Router 7, Vite 8, Motion, oxlint; Playwright para conferir as telas.

**Spec:** `docs/superpowers/specs/2026-11-09-redesign-cliente-motorista-design.md`. A seção
"Decisões" vale sobre o resto da spec. Canvas: `frontend/design/canvas/`.

## Global Constraints

- Nenhuma cor, raio ou sombra em hex fora de `styles/tokens.css`. Os valores do canvas viram os
  tokens da tabela "Tokens" da spec. Hover: o que o app já tem.
- O layout de computador começa em 900px. Celular conferido em 390×844, computador em 1440×900.
- Os textos são os do `.dc.html`. Os dados vêm da API: Juliana, Edvaldo, R$ 380 e Pituba são
  exemplo.
- Todo botão e link faz alguma coisa. Nenhum `href="#"`.
- Toda chamada à API tem carregando, vazio e erro (`useRecurso`, `Esqueleto`, `Vazio`,
  `ErroCarga`).
- O alvo de toque do motorista e do cliente é `--alvo-motorista` (48px).
- Carro de passeio e moto não fazem frete.
- Fica tudo o que o app já faz e o canvas não mostra: Extrato, `FretesDeVolta`, os documentos do
  frete, `/contestar`, os botões de preencher do modo demo e o botão de tema.
- As telas de empresa e de administrador não mudam. `DetalheFrete`, `CancelarFrete` e
  `PainelEntrega` continuam servindo a empresa como estão.
- Os atalhos "entrar como cliente / motorista" do canvas não entram.
- Sem emoji. Um commit por tarefa, em português, sem linha de coautoria.
- A máquina tem 3,8 GB: rodar o back-end uma classe de teste por vez, e manter um servidor e um
  navegador por vez, fechados no fim.
- Comandos do back-end na raiz do repositório: `.\mvnw.cmd -q -B test "-Dtest=Classe"`. O
  resultado fica em `target/surefire-reports`.

## Review Focus

1. **GPS negado ou sem resposta na busca.** A pessoa vê "Sem acesso à localização. Busque pelo
   CEP." e o campo de CEP. Nada fica em "Localizando…" para sempre: o pedido de posição desiste
   em 10 s. (Tarefa 16)
2. **Pix que demora.** A tela consulta o pagamento a cada 4 s só enquanto está aberta, e para ao
   sair. "Esperando o banco confirmar…" não some sozinho. (Tarefa 14)
3. **Foto que falha depois de o pedido existir.** A pessoa cai no frete com o aviso de quantas
   fotos não foram e um jeito de mandar de novo. (Tarefas 13 e 14)
4. **Telefone em qualquer formato no WhatsApp.** "(71) 98877-1234", "+55 71 98877-1234" e
   "71988771234" viram o mesmo `https://wa.me/5571988771234`. (Tarefa 8)
5. **Toque duplo.** Aceitar, Pagar com Pix, Enviar canhoto e Criar conta travam o botão até a
   resposta, e sai uma chamada só. (Tarefas 11, 14, 17 e 18)

## Como conferir uma tela (vale para as tarefas 10 a 21)

1. `cd frontend && npm run demo` em segundo plano (porta 5173).
2. Abrir a referência: `http://localhost:5173/design/canvas/<Tela>.dc.html?<prop>=<valor>`,
   que roda com o `support.js` da tarefa 0.
3. Abrir a página do app no modo demo, com movimento reduzido, em 390×844 e em 1440×900. O
   motorista também no tema escuro, que é o do canvas. Comparar as capturas com as do canvas.
4. Conferir no navegador:
   - nenhum erro no console;
   - nenhuma rolagem lateral (`scrollWidth <= innerWidth`);
   - cada botão da tarefa faz o que ela diz.
5. `npm run build` e `npm run lint` sem erro.
6. Nenhum hex novo fora de `tokens.css`:
   `grep -nE "#[0-9A-Fa-f]{3,8}\b" src/styles/*.css src/components src/pages -r | grep -v tokens.css`.
7. Fechar o navegador e o servidor.

---

### Task 0: Ramo, spec com as decisões, canvas no repositório e visor do canvas

**Files:**
- Create: `frontend/design/canvas/support.js`
- Modify: `frontend/design/canvas/LEIA-ME.md`
- Already modified: the "Decisões" section of the spec

**Interfaces:**
- Produces: `http://localhost:5173/design/canvas/<Tela>.dc.html?prop=valor`. Ele mostra a tela
  como no canvas, e é a referência das tarefas 10 a 21.

- [ ] **Step 1:** `git switch -c feat/redesign-cliente-motorista`
- [ ] **Step 2:** Commit da spec e do canvas como chegaram, com as decisões:
  `git add docs/superpowers frontend/design/canvas && git commit -m "docs: spec do redesign do cliente e do motorista, com as decisoes, o plano e o canvas"`
- [ ] **Step 3:** Escrever `support.js`, o runtime mínimo. Ele faz isto:
  - classe `DCLogic` com `state`, `props` e `setState` (que desenha de novo);
  - o conteúdo de `<helmet>` vai para o `<head>`;
  - `{{expr}}` em texto e em atributos;
  - `<sc-if value>` e `<sc-for list as>`;
  - `onClick`, `onChange`, `onInput`, `onKeyDown` e `onSubmit="{{fn}}"` viram listeners;
  - as props vêm do `default` de `data-props`, e `?prop=valor` na URL as troca.
- [ ] **Step 4:** Conferir no navegador `Cliente-Propostas.dc.html?cenario=propostas` e
  `Motorista-Frete-PC.dc.html?etapa=FECHADO`:
  - nenhum `{{` no texto;
  - a escolha de veículo do `Cliente-Veiculo` muda a borda do cartão.
- [ ] **Step 5:** Uma linha no `LEIA-ME.md` sobre o `support.js`. Commit:
  `chore(canvas): runtime minimo para abrir as telas do canvas no navegador`

### Task 1: Tamanho do veículo e tipo de carga no pedido (API)

**Files:**
- Modify: `usuario/domain/CategoriaVeiculo.java`, `frete/domain/Frete.java`,
  `frete/application/dto/SolicitarFreteRequest.java`,
  `frete/application/FreteService.java`, `frete/application/dto/FreteResponse.java`,
  `src/test/.../support/Fixtures.java`
- Create: `frete/domain/TipoCarga.java`,
  `db/migration/V15__categoria_e_tipo_de_carga.sql`
- Test: `FluxoFreteIntegrationTest`, `PropostaIntegrationTest`

**Interfaces:**
- Produces:
  - `CategoriaVeiculo { UTILITARIO("Utilitário"), VAN("Van ou furgão"), CAMINHAO("Caminhão") }`.
  - `boolean leva(CategoriaVeiculo exigida)`: verdadeiro se `exigida` é nula ou não é maior
    (ordem da declaração).
  - `String exigencia()`: "qualquer veículo", "van, furgão ou caminhão", "caminhão".
  - `suporta(BigDecimal)`, com o TODO do dono, fica como está.
  - `TipoCarga { MUDANCA("Mudança"), MOVEIS("Móveis e eletros"), CAIXAS("Caixas e volumes"),
    OBRA("Material de obra"), OUTRO("Outro") }`, com `getDescricao()`.
  - `SolicitarFreteRequest` ganha:
    - `@NotNull(message = "Escolha o tamanho do veículo.") CategoriaVeiculo categoriaVeiculo`;
    - `@NotNull(message = "Escolha o que vai levar.") TipoCarga tipoCarga`.
  - `FreteResponse` ganha `CategoriaVeiculo categoriaVeiculo` e `TipoCarga tipoCarga`, nulos em
    frete de empresa.

- [ ] **Step 1: Testes que falham**
  - `pedidoVazioDoFormulario`: os `erros` também trazem
    `categoriaVeiculo = "Escolha o tamanho do veículo."` e `tipoCarga = "Escolha o que vai levar."`.
  - `pedidoGuardaTamanhoETipo`: POST com `"categoriaVeiculo":"VAN","tipoCarga":"MUDANCA"` volta
    201, com `$.categoriaVeiculo == "VAN"` e `$.tipoCarga == "MUDANCA"`.
  - `motoNaoEhTamanho`: `"categoriaVeiculo":"MOTO"` volta 400.
  - `veiculoMenorNaoAceita`: num frete `CAMINHAO`:
    - o motorista `UTILITARIO` aceita pelo valor e recebe 422, com
      `$.detail == "Este frete precisa de caminhão."`;
    - o motorista `CAMINHAO` recebe 200.
  - `PropostaIntegrationTest.veiculoMenorNaoPropoe`: a proposta de um motorista `VAN` num frete
    `CAMINHAO` recebe 422, com o mesmo `detail`.
- [ ] **Step 2:** `.\mvnw.cmd -q -B test "-Dtest=FluxoFreteIntegrationTest"`: tem que FALHAR.
- [ ] **Step 3: Implementar**
  - O `Frete` ganha as colunas `categoria_veiculo` e `tipo_carga`, nulas, e o construtor do frete
    de cliente recebe os dois.
  - `exigirMotoristaApto` compara a categoria do veículo escolhido, ou, sem veículo, o
    `tipoVeiculo` do motorista. Se não levar, lança
    `RegraNegocioException("Este frete precisa de " + exigida.exigencia() + ".")`.
  - A mesma regra vale onde a proposta nasce.
  - V15:
    ```sql
    ALTER TABLE frete ADD COLUMN categoria_veiculo VARCHAR(20);
    ALTER TABLE frete ADD COLUMN tipo_carga VARCHAR(20);
    UPDATE motorista SET tipo_veiculo = 'UTILITARIO' WHERE tipo_veiculo IN ('MOTO', 'CARRO');
    ```
- [ ] **Step 4:** Rodar, uma classe por vez: `FluxoFreteIntegrationTest`,
  `PropostaIntegrationTest`, `FreteTest`, `MaquinaEstadosFreteTest`. Todas têm que PASSAR.
- [ ] **Step 5:** Commit: `feat(api): pedido de frete com tamanho do veiculo e tipo de carga`

### Task 2: Veículo com categoria e modelo; o cadastro do motorista cria o primeiro (API)

**Files:**
- Modify: `veiculo/domain/Veiculo.java`, `veiculo/application/dto/VeiculoRequest.java`,
  `veiculo/application/dto/VeiculoResponse.java`, `veiculo/application/VeiculoService.java`,
  `frete/domain/Frete.java` (`aceitaVeiculo` com tipo nulo),
  `frete/application/dto/FreteResponse.java` (`VeiculoResumo` ganha `categoria` e `modelo`, e
  `numeroEixos` vira `Integer`), `usuario/application/UsuarioService.java`
- Create: `usuario/domain/MotoristaCadastrado.java`,
  `veiculo/application/PrimeiroVeiculo.java`,
  `db/migration/V16__veiculo_categoria_e_modelo.sql`
- Test: `veiculo/domain/VeiculoTest`, `VeiculoIntegrationTest` (nova);
  `MarketplaceApiIntegrationTest` tem que continuar passando

**Interfaces:**
- Produces:
  - `VeiculoRequest(String placa, CategoriaVeiculo categoria, String modelo, String rntrc,
    TipoVeiculo tipo, TipoCarroceria carroceria, Integer numeroEixos, boolean rastreador)`.
    - `categoria`: `@NotNull(message = "Escolha o tipo do veículo.")`.
    - `modelo`: `@Size(max = 60, message = "O modelo deve ter até 60 caracteres.")`.
    - Os campos de caminhão são opcionais, com as validações de hoje quando vierem.
  - `VeiculoResponse` ganha `categoria` e `modelo`. `rntrc`, `tipo`, `carroceria` e
    `numeroEixos` podem vir nulos.
  - `record MotoristaCadastrado(UUID motoristaId, CategoriaVeiculo categoria, String placa)`, que
    o `UsuarioService` publica.
  - `PrimeiroVeiculo` ouve o evento com `@EventListener`, na mesma transação, e grava o veículo.
    Placa já usada: `ConflitoException`, e o cadastro volta atrás.
  - Por que um evento: `veiculo` já depende de `usuario`, então `usuario` chamar `veiculo` cria um
    ciclo, que o `ArquiteturaTest` proíbe.

- [ ] **Step 1: Testes que falham**
  - `cadastroSoComCategoriaModeloEPlaca`: POST `/api/motoristas/{id}/veiculos` com
    `{"placa":"ABC1D23","categoria":"VAN","modelo":"Master"}` volta 201, com `$.categoria == "VAN"`,
    `$.modelo == "Master"` e `$.rntrc` nulo.
  - `veiculoSemCategoria`: 400, com `erros.categoria == "Escolha o tipo do veículo."`.
  - `rntrcInvalidoQuandoInformado`: 400, com a mensagem de RNTRC de hoje.
  - `cadastroDoMotoristaJaTrazOVeiculo`: depois de POST `/api/motoristas` (VAN, ABC1D23),
    `GET /veiculos` traz um veículo, `VAN` e com a mesma placa.
  - `placaJaUsadaNoCadastro`: 409, e o e-mail continua livre.
  - `VeiculoTest`: um caminhão sem `tipo` não serve para um frete que exige tipo, e serve para um
    frete sem exigência.
- [ ] **Step 2:** `.\mvnw.cmd -q -B test "-Dtest=VeiculoIntegrationTest"`: tem que FALHAR.
- [ ] **Step 3: Implementar.** V16:
  ```sql
  ALTER TABLE veiculo ADD COLUMN categoria VARCHAR(20) NOT NULL DEFAULT 'CAMINHAO';
  ALTER TABLE veiculo ADD COLUMN modelo VARCHAR(60);
  ALTER TABLE veiculo ALTER COLUMN rntrc DROP NOT NULL;
  ALTER TABLE veiculo ALTER COLUMN tipo DROP NOT NULL;
  ALTER TABLE veiculo ALTER COLUMN carroceria DROP NOT NULL;
  ALTER TABLE veiculo ALTER COLUMN numero_eixos DROP NOT NULL;
  ```
- [ ] **Step 4:** Rodar, uma classe por vez: `VeiculoIntegrationTest`, `VeiculoTest`,
  `MarketplaceApiIntegrationTest`, `PropostaIntegrationTest` e `ArquiteturaTest`. Todas têm que
  PASSAR.
- [ ] **Step 5:** Commit: `feat(api): veiculo com categoria e modelo, dados de caminhao opcionais`

### Task 3: Fotos da carga (API)

**Files:**
- Create: `frete/domain/FotoCarga.java`, `frete/domain/FotoCargaRepository.java`,
  `frete/application/FotoCargaService.java`, `frete/application/dto/FotoCargaResponse.java`,
  `frete/api/FotoCargaController.java`, `db/migration/V17__fotos_da_carga.sql`
- Test: `FotoCargaIntegrationTest`

**Interfaces:**
- Produces:
  - `POST /api/fretes/{id}/fotos` (multipart, parte `foto`) volta 201 com
    `FotoCargaResponse(UUID id, String url)`.
  - `GET /api/fretes/{id}/fotos` volta `List<FotoCargaResponse>`, na ordem de envio, para
    qualquer pessoa logada, como `GET /api/fretes/{id}`.
  - A URL é assinada, como a da foto do canhoto (`ArmazenamentoArquivos`).
  - Regras:
    - quem não é o cliente do frete: 403, "Só quem pediu o frete envia fotos.";
    - status diferente de `PUBLICADO` e `PROPOSTA_ENVIADA`: 422, "As fotos entram antes de o
      frete fechar.";
    - a sexta foto: 422, "Até 5 fotos por pedido.";
    - arquivo que não é JPEG nem PNG (`TipoArquivo.detectar`): o mesmo erro da foto do canhoto.

- [ ] **Step 1: Testes que falham:** `donoEnviaEVeALista`, `sextaFotoVolta422`,
  `outroClienteNaoEnvia`, `arquivoQueNaoEhFoto`, `fotoDepoisDoAceiteVolta422`.
- [ ] **Step 2:** Rodar `FotoCargaIntegrationTest`: tem que FALHAR.
- [ ] **Step 3: Implementar.** A tabela `foto_carga` tem `id`, `frete_id`, `chave` e
  `criado_em`, e um índice por frete.
- [ ] **Step 4:** Rodar `FotoCargaIntegrationTest` e `ArquiteturaTest`: têm que PASSAR.
- [ ] **Step 5:** Commit: `feat(api): fotos da carga no pedido do cliente`

### Task 4: Endereço completo e destinatário só para quem participa (API)

**Files:**
- Modify: `frete/application/dto/FreteResponse.java`, `frete/api/FreteController.java`
  (`buscar` e `listar` recebem o principal), `frete/application/FreteService.java`,
  `frete/application/BuscaFreteService.java`
- Test: `FluxoFreteIntegrationTest`, `BuscaFreteServiceTest`

**Interfaces:**
- Produces:
  - `static FreteResponse de(Frete frete, UsuarioLogado quem)`: vem completo para o
    administrador, para quem contrata e para o motorista do frete; para os outros, vem
    `semDadosPrivados()`.
  - `FreteResponse semDadosPrivados()`:
    - `coleta` e `entrega` mantêm só `bairro`, `cidade` e `uf`;
    - os outros campos do endereço, o `nomeDestinatario` e o `telefoneDestinatario` vêm nulos.
  - A busca por raio e os fretes de volta sempre usam `semDadosPrivados()`.

- [ ] **Step 1: Testes que falham**
  - `motoristaDeForaVeSoBairroECidade`: `GET /api/fretes/{id}` como outro motorista:
    - `$.coleta.logradouro`, `$.coleta.cep`, `$.coleta.latitude` e `$.telefoneDestinatario`
      vêm nulos;
    - `$.coleta.cidade` vem preenchido.
  - `motoristaDoFreteVeTudoDepoisDoAceite`: depois do aceite, o motorista vê
    `$.coleta.logradouro` e `$.telefoneDestinatario`.
  - `clienteDonoVeTudo`.
- [ ] **Step 2:** Rodar `FluxoFreteIntegrationTest`: tem que FALHAR.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4:** Rodar `FluxoFreteIntegrationTest`, `BuscaFreteServiceTest`,
  `MarketplaceApiIntegrationTest` e `FreteControllerTest`: têm que PASSAR.
- [ ] **Step 5:** Commit: `fix(api): endereco completo e destinatario so para quem participa do frete`

### Task 5: Contato depois do aceite (API)

**Files:**
- Create: `frete/application/dto/ContatoResponse.java`
- Modify: `frete/application/FreteService.java`, `frete/api/FreteController.java`
- Test: `FluxoFreteIntegrationTest`

**Interfaces:**
- Produces: `GET /api/fretes/{id}/contato` volta `ContatoResponse(String nome, String telefone)`.
  - O motorista do frete recebe o cliente. Se o frete é de empresa, recebe a empresa, com
    `nomeFantasia` ou, sem ele, `razaoSocial`.
  - Quem contrata recebe o motorista.
  - Só em `ACEITO`, `EM_TRANSITO` e `ENTREGUE`:
    - antes: 422, "O contato aparece depois que o frete fecha.";
    - em `PAGO` ou `CANCELADO`: 422, "Este frete já terminou.".
  - Quem não participa: 403, "Só quem participa do frete vê o contato.".

- [ ] **Step 1: Testes que falham:** `contatoAntesDoAceite`,
  `contatoDepoisDoAceiteDosDoisLados`, `contatoDeQuemNaoParticipa`.
- [ ] **Step 2:** Tem que FALHAR. **Step 3:** Implementar. **Step 4:** Tem que PASSAR.
- [ ] **Step 5:** Commit: `feat(api): contato do outro lado do frete depois do aceite`

### Task 6: Senha nova por link (API)

**Files:**
- Create: `auth/domain/TokenSenha.java`, `auth/domain/TokenSenhaRepository.java`,
  `auth/domain/CorreioSenha.java`, `auth/infra/LogCorreioSenha.java`,
  `auth/application/SenhaService.java`, `auth/application/dto/PedidoLinkSenhaRequest.java`,
  `auth/application/dto/SenhaNovaRequest.java`, `db/migration/V18__token_senha.sql`
- Modify: `auth/api/AuthController.java`, `auth/infra/SecurityConfig.java` (`permitAll` nos dois
  POST), `usuario/domain/Usuario.java` (`void definirSenha(String senhaHash)`),
  `application.yml` (`fretai.front.url: ${FRETAI_URL_FRONT:http://localhost:5173}`)
- Test: `SenhaNovaIntegrationTest`, com `@MockitoBean CorreioSenha` para pegar o link

**Interfaces:**
- Produces:
  - `POST /api/auth/senha/link` com `{email}` volta sempre 204, exista a conta ou não.
  - `POST /api/auth/senha/nova` com `{token, senha}` volta 204. Token inválido, usado ou vencido:
    422, "Este link não vale mais. Peça outro na tela de entrar.".
  - `CorreioSenha.enviarLink(String email, String nome, String link)`. `LogCorreioSenha` só
    escreve o link no log, até existir um servidor de e-mail.
  - O token tem 32 bytes aleatórios em Base64 URL. O banco guarda o SHA-256 em hex, que vale
    1 hora.
  - Um pedido novo invalida os anteriores.
  - Usar o token faz três coisas: grava a senha, marca o token como usado e revoga todos os
    refresh tokens da pessoa.
  - O link é `{fretai.front.url}/nova-senha?token=...`.
  - Cada pedido de link chama `LimitadorTentativas` com a chave `"senha:" + email` e conta como
    falha. Passou do limite: a mesma resposta 429 do login.
  - `senha`: `@NotBlank @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres.")`.

- [ ] **Step 1: Testes que falham**
  - `emailSemContaResponde204ENaoManda`: `CorreioSenha` nunca é chamado.
  - `linkTrocaASenha`: a senha nova entra (login 200) e a antiga não (401).
  - `linkSoValeUmaVez`: na segunda vez, 422.
  - `linkVencido`: 422, depois de recuar o `expiraEm` pelo repositório.
  - `senhaCurta`: 400, com `erros.senha`.
  - `trocaDeSenhaDerrubaAsSessoes`: o refresh token de antes passa a dar 401.
- [ ] **Step 2:** Tem que FALHAR. **Step 3:** Implementar. **Step 4:** Rodar
  `SenhaNovaIntegrationTest`, `SegurancaIntegrationTest` e `ArquiteturaTest`: têm que PASSAR.
- [ ] **Step 5:** Commit: `feat(api): senha nova por link enviado ao e-mail`

### Task 7: Base do motorista por CEP (API)

**Files:**
- Modify: `usuario/application/dto/BaseMotoristaRequest.java`,
  `usuario/application/UsuarioService.java`
- Test: a classe de integração que já cobre `/base`, ou `BaseMotoristaIntegrationTest` (nova)

**Interfaces:**
- Produces: `BaseMotoristaRequest` aceita `cep` no lugar de `latitude` e `longitude`.
  - `cep`: `@Pattern(regexp = "^\\d{5}-?\\d{3}$", message = "Digite os 8 números do CEP.")`.
  - `@AssertTrue(message = "Informe o CEP ou use a sua localização.")`.
  - O CEP vira coordenada pelo `EnderecoGateway` e pelo `GeocodificacaoGateway`, como na busca.

- [ ] **Step 1: Testes que falham:**
  - `baseComCep`: 200, com as coordenadas do geocodificador falso;
  - `baseSemCepNemCoordenada`: 400.
- [ ] **Step 2:** Tem que FALHAR. **Step 3:** Implementar. **Step 4:** Rodar a classe e
  `ArquiteturaTest`: têm que PASSAR.
- [ ] **Step 5:** Commit: `feat(api): base do motorista tambem por CEP`

### Task 8: Tipos, formatos, WhatsApp e modo demo (front)

**Files:**
- Modify: `frontend/src/api/tipos.ts`, `frontend/src/formato.ts`, `frontend/src/api/demo.ts`
- Create: `frontend/src/whatsapp.ts`

**Interfaces:**
- Produces:
  - `tipos.ts`:
    - `CategoriaVeiculo = 'UTILITARIO' | 'VAN' | 'CAMINHAO'`;
    - `TipoCarga = 'MUDANCA' | 'MOVEIS' | 'CAIXAS' | 'OBRA' | 'OUTRO'`;
    - `Frete` ganha `categoriaVeiculo: CategoriaVeiculo | null` e `tipoCarga: TipoCarga | null`;
    - `Veiculo` e `VeiculoResumo` ganham `categoria` e `modelo: string | null`, e os campos de
      caminhão passam a aceitar `null`;
    - `NovoVeiculo` fica igual ao `VeiculoRequest`;
    - `SolicitarFrete` ganha `categoriaVeiculo` e `tipoCarga`;
    - tipos novos: `FotoCarga { id: string; url: string }` e
      `Contato { nome: string; telefone: string }`.
  - `formato.ts`:
    - `CATEGORIAS: Record<CategoriaVeiculo, { nome: string; cabe: string; exemplo: string }>`,
      com os textos do `Cliente-Veiculo.dc.html`;
    - `TIPOS_CARGA: Record<TipoCarga, string>`;
    - `FAIXAS_PESO`: `Até 200 kg` → 200, `De 200 a 700 kg` → 700, `De 700 kg a 1,5 t` → 1500,
      `Mais de 1,5 t` → `null`;
    - `faixaDoPeso(kg: number): string`.
  - `whatsapp.ts`: `linkWhatsApp(telefone: string, texto?: string): string`. Fica só com os
    dígitos, tira o `55` da frente quando sobram 12 ou 13 dígitos e devolve
    `https://wa.me/55<DDD><número>`, com `?text=` codificado quando houver texto.
  - `demo.ts` emula os endpoints das tarefas 1 a 7, com dados para cada etapa:
    - fretes do cliente com tamanho e tipo de carga, um em cada status;
    - veículos com categoria e modelo;
    - fotos de exemplo;
    - contato só depois do aceite;
    - link de senha (o token `demo` vale);
    - base por CEP;
    - Pix que confirma na terceira consulta depois de copiado.

- [ ] **Step 1:** Implementar.
- [ ] **Step 2:** Conferir o WhatsApp rodando
  `node -e "import('./src/whatsapp.ts').then(m => ['(71) 98877-1234','+55 71 98877-1234','71988771234'].forEach(t => console.log(m.linkWhatsApp(t))))"`.
  As três linhas têm que sair `https://wa.me/5571988771234`.
- [ ] **Step 3:** `npm run build` e `npm run lint` passam. As telas de hoje ainda abrem no demo.
- [ ] **Step 4:** Commit: `feat(front): tipos, formatos e modo demo do redesign`

### Task 9: Layouts e componentes comuns (front)

**Files:**
- Modify: `frontend/src/components/Layouts.tsx`, `frontend/src/styles/componentes.css`
- Create: `frontend/src/components/Folha.tsx`, `frontend/src/components/MenuConta.tsx`,
  `frontend/src/components/CancelarComMotivo.tsx`

**Interfaces:**
- Produces:
  - `<Folha aberta titulo aoFechar children>`: um `<dialog>` aberto com `showModal()`. Sobe de
    baixo abaixo de 900px e vira painel a partir de 900px. Esc fecha, e o foco volta a quem
    abriu.
  - `<CancelarComMotivo aberta titulo motivos aviso rotuloConfirmar rotuloManter aoConfirmar(motivo) aoFechar>`:
    - um rádio por motivo, mais "Outro motivo", que abre um texto de até 500 caracteres;
    - Confirmar fica desabilitado sem motivo.
  - `LayoutMotorista`:
    - abaixo de 900px, a barra de baixo de hoje;
    - a partir de 900px, a barra de cima, com Fretes, Meus fretes, Calculadora, Perfil e o
      avatar (iniciais) que leva ao Perfil. A barra de baixo some;
    - o botão de tema continua.
  - `LayoutCliente`: marca e avatar. O avatar abre o `MenuConta`, que é uma `Folha` no celular e
    um menu preso ao avatar a partir de 900px. O menu tem:
    - nome e e-mail (`GET /api/auth/eu`);
    - "Frete em andamento", só se houver;
    - "Pedir um frete", só no celular;
    - "Como o pagamento funciona", que abre e fecha;
    - Sair (`POST /api/auth/logout` e volta a `/entrar`).

- [ ] **Step 1:** Implementar, conferindo com `Cliente-Inicio*.dc.html` e `Motorista-Busca*.dc.html`.
- [ ] **Step 2:** No navegador:
  - o menu da conta abre e fecha pelo toque e pelo Esc, e o foco volta ao avatar;
  - a barra do motorista troca de lugar em 900px;
  - empresa e administrador continuam iguais.
- [ ] **Step 3:** Build e lint passam. Commit: `feat(front): menus do cliente e do motorista, folha e cancelar com motivo`

### Task 10: Entrar e senha nova

**Files:** `pages/Entrar.tsx`; Create `pages/NovaSenha.tsx`; `App.tsx` (rota pública
`/nova-senha`); `styles/telas.css`. Canvas: `Main.dc.html`, `Main-Celular.dc.html`.

- [ ] **Step 1: Implementar a tela Entrar**
  - Entrar, Continuar com Google, Criar conta e os botões de preencher do demo funcionam como
    hoje.
  - "Esqueci a senha" usa o e-mail digitado. Vazio ou inválido: erro no campo, "Digite o e-mail
    da sua conta para receber o link.".
  - Com e-mail, chama `POST /api/auth/senha/link` e mostra o texto do canvas. Um 429 mostra a
    mensagem da API.
  - O painel da direita (computador) e "Como o dinheiro anda" (celular) trazem os três marcos do
    canvas.
- [ ] **Step 2: Implementar a `NovaSenha`**
  - Lê o `token` da URL, tem o campo "Senha nova" (8 a 72) e o botão "Salvar senha nova".
  - Deu certo: volta a `/entrar` com o aviso "Senha nova salva. Entre com ela.".
  - Um 422, ou a URL sem token: aviso de link inválido, com "Pedir outro link" para `/entrar`.
- [ ] **Step 3:** Conferir (ver "Como conferir uma tela"), também `/nova-senha?token=demo` e
  `/nova-senha` sem token.
- [ ] **Step 4:** Commit: `feat(entrar): tela do canvas e senha nova por link`

### Task 11: Cadastro

**Files:** `pages/Cadastro.tsx`, `styles/telas.css`. Canvas: `Cadastro.dc.html`
(`?perfil=cliente|motorista`), `Cadastro-Celular.dc.html`.

- [ ] **Step 1: Implementar**
  - Dois cartões de perfil. Escolhido o perfil, vêm o Google e o formulário do canvas.
  - O motorista escolhe um dos três tamanhos (`CATEGORIAS`), vê o aviso de carro e moto e
    preenche a placa. O número da CNH não entra (Decisões).
  - O aceite dos termos é obrigatório.
  - Criar conta chama `POST /api/clientes` ou `POST /api/motoristas` e vai para `INICIO[papel]`.
    O botão trava enquanto espera.
  - Os erros 400 aparecem em cada campo.
  - `?perfil=` já marca o perfil, e o fluxo do Google fica como hoje.
- [ ] **Step 2:** Conferir, criando uma conta de cliente e uma de motorista no demo.
- [ ] **Step 3:** Commit: `feat(cadastro): tela do canvas, com o veiculo do motorista em tres tamanhos`

### Task 12: Início do cliente

**Files:** `pages/cliente/FretesCliente.tsx`, `styles/telas.css`. Canvas:
`Cliente-Inicio.dc.html`, `Cliente-Inicio-PC.dc.html`.

- [ ] **Step 1: Implementar**
  - Os quatro atalhos levam a `/cliente/fretes/novo?tipo=<TipoCarga>`, e "Pedir frete" leva a
    `/cliente/fretes/novo`.
  - "Em andamento" é todo frete fora de `PAGO` e `CANCELADO`. Cada cartão leva ao frete.
  - Anteriores são os fretes `PAGO` e `CANCELADO`. Cada item abre e fecha (`aria-expanded`).
    Aberto, mostra:
    - o motorista, e o veículo (categoria e placa);
    - "Entregue em" (`concluidoEm`);
    - a nota dada (`GET /api/fretes/{id}/avaliacoes`, buscada ao abrir);
    - "Pedir de novo", que leva a `/cliente/fretes/novo?de={id}`.
  - Sem fretes: estado vazio com "Pedir frete".
- [ ] **Step 2:** Conferir, abrindo e fechando os anteriores.
- [ ] **Step 3:** Commit: `feat(cliente): inicio do canvas com atalhos, frete em andamento e anteriores`

### Task 13: Pedir frete

**Files:** `pages/cliente/PedirFrete.tsx`, `components/CamposPonta.tsx` (reuso),
`styles/telas.css`. Canvas: `Cliente-Pedido.dc.html`, `Cliente-Veiculo.dc.html`,
`Cliente-Pedido-PC.dc.html`.

- [ ] **Step 1: Implementar**
  - **Celular**, em dois passos, com o passo em `?passo=2`, para o voltar do navegador voltar ao
    passo 1:
    - passo 1: de onde e para onde, dia da coleta, o que vai levar, descrição, peso e fotos.
      "Continuar" valida esses campos;
    - passo 2: qual veículo, quem recebe, quanto você oferece e o resumo.
  - **Computador**: uma página, com o resumo ao lado.
  - **Endereço**: os campos de CEP, número e complemento de hoje, porque a API precisa do CEP.
    Depois do CEP, a linha "bairro, cidade" do canvas.
  - **Peso**: as faixas de `FAIXAS_PESO`. "Mais de 1,5 t" abre o campo "Peso em kg".
  - **Fotos**: `accept="image/jpeg,image/png"`, até 5 ("Escolha até 5 fotos."), com miniatura e
    remover.
  - **Atalhos de URL**:
    - `?tipo=` já marca o tipo;
    - `?de={id}` preenche coleta, entrega, descrição, tipo, tamanho e peso a partir de
      `GET /api/fretes/{id}`.
  - O aviso de feriado e domingo e o `SairSemSalvar` continuam.
  - **"Pedir frete por R$ X"**:
    - chama `POST /api/fretes`;
    - envia as fotos uma por uma, em `POST /api/fretes/{id}/fotos`;
    - vai para `/cliente/fretes/{id}`, com `state.fotosQueFalharam` quando alguma falhar.
- [ ] **Step 2:** Conferir:
  - o pedido inteiro no celular e no computador;
  - os erros de campo vindos da API;
  - duas fotos, e seis fotos (aparece a mensagem).
- [ ] **Step 3:** Commit: `feat(cliente): pedir frete em dois passos no celular e numa pagina no computador`

### Task 14: Frete do cliente antes do Pix

**Files:**
- Create: `pages/cliente/FreteCliente.tsx`, que carrega o frete, o pagamento e os eventos e
  escolhe a vista, e `pages/cliente/frete/AntesDoPix.tsx`
- Modify: `App.tsx`: `/cliente/fretes/:id` passa para `FreteCliente`, e a rota da empresa não
  muda
- Canvas: `Cliente-Propostas.dc.html` (`?cenario=procurando|propostas|aceitou`) e
  `Cliente-Propostas-PC.dc.html`

- [ ] **Step 1: Implementar**
  - **As três situações**: procurando motorista (`PUBLICADO` sem propostas), propostas
    (`PROPOSTA_ENVIADA`) e aceitou o valor (`ACEITO` sem Pix).
  - **Propostas** vêm de `GET /api/fretes/{id}/propostas`.
    - Aceitar: `POST /api/propostas/{id}/aceite`, e abre o Pix.
    - Recusar: `POST /api/propostas/{id}/recusa`, e a proposta some.
  - **Pagar com Pix**: `POST /api/fretes/{id}/pagamento`, e aparecem o QR Code e o copia e cola.
    - "Copiar código Pix" copia e mostra "Esperando o banco confirmar…".
    - A tela consulta `GET /api/fretes/{id}/pagamento` a cada 4 s só enquanto está aberta e o
      status é `PENDENTE`. Confirmado: "Pix confirmado" e "Acompanhar frete".
  - **Cancelar pedido** abre `CancelarComMotivo` com os quatro motivos da spec, e então
    `POST /api/fretes/{id}/cancelamento`. Mostra o estado "Pedido cancelado · Nenhum valor foi
    cobrado", com o motivo, "Fazer outro pedido" e "Voltar ao início".
  - **Fotos que falharam no pedido** (`state.fotosQueFalharam`): aviso com "Mandar as fotos de
    novo".
- [ ] **Step 2:** Conferir:
  - cada cenário;
  - aceitar, recusar, pagar, copiar e a confirmação;
  - cancelar com motivo, e sem motivo (fica desabilitado);
  - o toque duplo em Aceitar e em Pagar faz uma chamada só.
- [ ] **Step 3:** Commit: `feat(cliente): motoristas, propostas e Pix do frete do cliente`

### Task 15: Acompanhar o frete do cliente

**Files:**
- Create: `pages/cliente/frete/Acompanhar.tsx`
- Reuse: `Marcos` (vertical no celular, horizontal no computador), `EvidenciaCanhoto` e
  `Avaliar`
- Canvas: `Cliente-Acompanhar.dc.html` (`?etapa=ACEITO|EM_TRANSITO|ENTREGUE|PAGO`) e
  `Cliente-Acompanhar-PC.dc.html`

- [ ] **Step 1: Implementar**
  - **Etapas** pela linha do tempo de `GET /api/fretes/{id}/eventos`.
  - **WhatsApp**, no lugar da conversa do canvas: "Chamar {nome} no WhatsApp" busca
    `GET /api/fretes/{id}/contato` e abre `linkWhatsApp`. Aparece só em `ACEITO`, `EM_TRANSITO`
    e `ENTREGUE`. O aviso de não combinar pagamento por fora fica junto do botão.
  - **Canhoto** (`ENTREGUE`): foto, assinatura e GPS.
    - "Algo chegou errado" abre o motivo (obrigatório, até 500), e então
      `POST /api/fretes/{id}/canhoto/contestacao`.
    - "Voltar" desiste.
  - **O código de quem recebe** some em `PAGO`.
  - **Avaliar** (`PAGO`): Enviar fica desabilitado sem nota.
  - **Cancelar frete**, só em `ACEITO`: `CancelarComMotivo`, e então o estado "Frete cancelado",
    com "O Pix de R$ X volta para você".
- [ ] **Step 2:** Conferir cada etapa:
  - contestar com e sem motivo;
  - a nota;
  - cancelar;
  - o `href` do WhatsApp.
- [ ] **Step 3:** Commit: `feat(cliente): acompanhar o frete, com canhoto, contestacao, nota e WhatsApp`

### Task 16: Fretes perto (motorista)

**Files:** `pages/motorista/BuscaFretes.tsx`, `components/CardFrete.tsx`, `styles/telas.css`.
Canvas: `Motorista-Busca.dc.html`, `Motorista-Busca-PC.dc.html`.

- [ ] **Step 1: Implementar**
  - **Busca**: `GET /api/fretes/busca`, com raio de 10, 25 ou 50 km (`raioKm`).
  - **Usar GPS**:
    - mostra "Localizando…";
    - `getCurrentPosition` desiste em 10 s;
    - negado ou sem resposta: "Sem acesso à localização. Busque pelo CEP.".
  - **CEP** ("Buscar por CEP" no computador): 8 números. Com menos: "Digite os 8 números do
    CEP.".
  - **O cartão** leva ao frete. O frete que nenhum veículo do motorista leva aparece apagado,
    sem link e com o motivo:
    - frete de cliente: `CategoriaVeiculo.leva`;
    - frete de empresa: a regra de tipo e carroceria de hoje.
- [ ] **Step 2:** Conferir com o GPS permitido e negado, CEP de 7 números e a troca de raio.
- [ ] **Step 3:** Commit: `feat(motorista): fretes perto do canvas, com raio, GPS e CEP`

### Task 17: Frete do motorista

**Files:** `pages/motorista/FreteMotorista.tsx`, `styles/telas.css`. Canvas:
`Motorista-Frete.dc.html` (`?etapa=DISPONIVEL|PROPOSTA|FECHADO|PIX_CONFIRMADO|EM_TRANSITO`),
`Motorista-Frete-PC.dc.html`.

- [ ] **Step 1: Implementar**
  - **Fotos da carga**: `GET /api/fretes/{id}/fotos`, antes do aceite.
  - **Endereço completo e quem recebe**: só depois de fechar. A API já esconde.
  - **"Aceitar por R$ X"**:
    - usa o primeiro veículo ativo que leva o frete;
    - sem nenhum, o botão fica desabilitado, com "Cadastre um veículo: este frete precisa de
      {exigência}." e um link para o Perfil.
    - Depois do aceite: "Fechado com {nome}. Esperando o Pix dela.", que vira "Pix confirmado:
      R$ X guardado" quando o pagamento confirma.
  - **Propor outro valor**:
    - Enviar fica desabilitado com o valor vazio ou zero;
    - manda o `adiantamentoPercentual` de hoje;
    - a proposta pode ser retirada.
  - **WhatsApp** depois de fechar, como na tarefa 15.
  - **Viagem**: "Carreguei, iniciar viagem" chama `POST /inicio`; "Cheguei, registrar entrega"
    leva à rota de entrega.
  - **Desistir**, só em `ACEITO`:
    - `CancelarComMotivo`, com os quatro motivos do motorista;
    - depois: "Frete cancelado. {Nome} foi avisada", mais "e o Pix volta para ela" quando já
      havia Pix, e "Ver outros fretes";
    - o aviso "Depois que a carga sai, não dá mais para desistir.".
  - Os documentos do frete, os dados de frete de empresa e os fretes de volta continuam.
- [ ] **Step 2:** Conferir cada etapa e o toque duplo em Aceitar.
- [ ] **Step 3:** Commit: `feat(motorista): frete do canvas, com aceite, proposta, viagem, desistencia e WhatsApp`

### Task 18: Registrar entrega

**Files:** `pages/motorista/RegistrarEntrega.tsx`, `styles/telas.css`. Canvas:
`Motorista-Entrega.dc.html`, `Motorista-Entrega-PC.dc.html`.

- [ ] **Step 1: Implementar**
  - **O que o canhoto pede**:
    - a foto (`accept="image/*" capture="environment"`);
    - a assinatura (`Assinatura`);
    - o GPS, que desiste em 10 s e explica quando é negado;
    - o nome de quem recebeu.
  - **Enviar canhoto**:
    - fica desabilitado e lista o que falta ("Falta: a foto, …");
    - chama `POST /api/fretes/{id}/canhoto` (multipart, como hoje) e trava até a resposta.
  - **Depois**:
    - "Como foi com {nome}?", com 1 a 5 estrelas, que chama `POST /api/fretes/{id}/avaliacoes`
      com `{ nota }`;
    - "Ver mais fretes" leva a `/motorista`;
    - os fretes de volta continuam.
- [ ] **Step 2:** Conferir com o GPS negado, o botão desabilitado e o envio.
- [ ] **Step 3:** Commit: `feat(motorista): registrar entrega do canvas, com nota para o cliente`

### Task 19: Meus fretes

**Files:** `pages/motorista/MeusFretes.tsx`, `styles/telas.css`. Canvas:
`Motorista-Fretes.dc.html`, `Motorista-Fretes-PC.dc.html`.

- [ ] **Step 1: Implementar**
  - O resumo traz "A receber" (`--cor-garantido`) e "Recebido no mês".
  - As abas Em andamento, Propostas (`GET /api/propostas/minhas`) e Concluídos mostram o total de
    cada uma.
  - Retirar proposta chama `POST /api/propostas/{id}/retirada`.
  - Os cartões levam ao frete, e o link para o Extrato continua.
- [ ] **Step 2:** Conferir as três abas e a retirada.
- [ ] **Step 3:** Commit: `feat(motorista): meus fretes do canvas, em tres abas`

### Task 20: Calculadora

**Files:** `pages/motorista/Calculadora.tsx`; Create `frontend/src/calculo.ts`;
`styles/telas.css`. Canvas: `Motorista-Calculadora.dc.html`, `Motorista-Calculadora-PC.dc.html`.

**Interfaces:**
- Produces: `calcularViagem(e: { valor, distanciaKm, consumoKmL, dieselLitro, pedagio, outros, voltaVazio }): { diesel, pedagioEOutros, custo, sobra, porKm } | null`.
  - Sem distância, consumo ou diesel, devolve `null`.
  - O diesel é `distância × (voltaVazio ? 2 : 1) ÷ consumo × preço`.
  - `sobra = valor − custo`. Negativa, a tela mostra "Falta" em `--cor-perigo`.
  - `porKm = valor ÷ distância`.

- [ ] **Step 1:** Implementar `calculo.ts`. Conferir com
  `node -e "import('./src/calculo.ts').then(m => console.log(m.calcularViagem({valor:380,distanciaKm:22,consumoKmL:9,dieselLitro:6.19,pedagio:0,outros:0,voltaVazio:true})))"`:
  o diesel tem que sair perto de 30,26 e o `porKm` perto de 17,27.
- [ ] **Step 2: Implementar a tela**
  - A conta é refeita a cada tecla.
  - "Limpar os números" limpa tudo menos o diesel.
  - O piso ANTT continua numa parte opcional, que chama `POST /api/calculadora/frete` só com o
    tipo de carga e os eixos preenchidos.
- [ ] **Step 3:** Conferir. Commit: `feat(motorista): calculadora do canvas, com a volta vazio`

### Task 21: Perfil do motorista

**Files:** `pages/motorista/Perfil.tsx`, `styles/telas.css`. Canvas: `Motorista-Perfil.dc.html`,
`Motorista-Perfil-PC.dc.html`.

- [ ] **Step 1: Implementar**
  - **Topo**: as iniciais e o nome, "Nota X · N fretes" (`GET /api/motoristas/{id}/perfil`) e a
    situação dos documentos.
  - **Contato**:
    - o celular é editável e o e-mail é só leitura (Decisões);
    - "Salvar contato" chama `PUT /api/motoristas/{id}` com `{nome, telefone}` e mostra
      "Contato salvo.".
  - **Chave Pix**: o tipo de chave só ajuda no formato e na validação.
    `PUT /api/motoristas/{id}/chave-pix` mostra "Chave salva. O dinheiro dos fretes vai para ela.".
  - **Veículos**:
    - lista, Remover (`DELETE`) e Adicionar, com tipo, modelo e placa;
    - placa inválida: "Placa inválida. Use o formato ABC1234 ou ABC1D23.";
    - um caminhão sem os dados de caminhão ganha "Completar dados do caminhão", que abre RNTRC,
      tipo, carroceria, eixos e rastreador e chama `PUT`.
  - **Avisos**:
    - a base é o CEP ou "Usar onde estou", com raio de 10, 25 ou 50 km, e chama
      `PUT /api/motoristas/{id}/base`;
    - "Aceito frete em feriado" chama `PATCH /api/motoristas/{id}/preferencias`.
  - **Documentos**: o componente `Documentos`.
  - **Sair**.
- [ ] **Step 2:** Conferir cada "Salvar", remover e adicionar veículo, a placa inválida e a base
  por CEP.
- [ ] **Step 3:** Commit: `feat(motorista): perfil do canvas, com contato, Pix, veiculos, avisos e documentos`

### Task 22: Fechamento

**Files:** `pages/Legal.tsx`, `README.md`, `frontend/README.md`, `frontend/anti-slop-brief.md`,
`frontend/design/capturas/*.json`

- [ ] **Step 1: Política de privacidade.** Acrescentar três coisas:
  - as fotos da carga, que os motoristas veem antes do aceite;
  - o e-mail usado para o link de senha;
  - o telefone, que o outro lado recebe só depois do aceite.
- [ ] **Step 2: READMEs.** Acrescentar os endpoints novos e o modo demo. No brief, acrescentar
  os desvios do canvas:
  - WhatsApp no lugar da conversa;
  - endereço por CEP;
  - peso em faixas;
  - número da CNH fora do cadastro;
  - e-mail só leitura no Perfil.
- [ ] **Step 3: Quadro.** Acrescentar as telas novas em `capturas/telas.json` e rodar
  `npm run quadro`.
- [ ] **Step 4: Verificação final**
  - a suíte do back-end inteira, rodando sozinha;
  - `npm run build` e `npm run lint`;
  - o grep de hex e o de `href="#"`;
  - todas as rotas do demo sem erro no console.
- [ ] **Step 5:** Commit dos docs.
- [ ] **Step 6:** Push do ramo, e avanço da `main` só por fast-forward, como nas entregas
  anteriores.

## Execução

Nesta sessão, uma tarefa por vez, na ordem acima: primeiro a API, depois as páginas, como o dono
pediu. A cada tarefa, marcar os passos neste arquivo.
