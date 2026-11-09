# Redesign do cliente e do motorista - design

Data: 2026-11-09 · Origem: canvas de design feito no Claude (25 telas), exportado em
`frontend/design/canvas/`. Canvas original (privado, só o dono abre):
https://claude.ai/artifact/F8unrR8Y1fCg78jCsNxrZw

## Por quê

O app do cliente pessoa física e do motorista já existe em `frontend/`. O canvas
redesenha essas telas no modelo Uber/99/iFood (a pessoa pede o frete, um motorista
com utilitário, van ou caminhão aceita), com versão de celular e de computador, e
define o que cada botão faz. Esta spec diz o que mudar em cada página para o app
ficar igual ao canvas, sem perder o que já funciona.

## Objetivos

- Cada página do mapa abaixo fica com o layout, os textos e o comportamento do canvas,
  no celular e no computador.
- Todo botão e link faz alguma coisa. Nenhum `href="#"`, nenhum botão sem ação.
- O que o canvas simula com espera vira chamada real à API (tabela "Simulado no canvas").

## Não-objetivos

- Telas de empresa e de administrador (não estão no canvas). Não mexer.
- Os atalhos "entrar como cliente / motorista" da tela Entrar do canvas existem só para
  navegar o protótipo. Não implementar.

## Anti-objetivos

- Não remover o que o app já faz e o canvas não mostra: Extrato, fretes de volta
  (`FretesDeVolta`), documentos do frete, página pública `/contestar`.
- Nada de cor, raio ou sombra em hex no código: tudo pelos tokens de `styles/tokens.css`.
- Carro de passeio e moto não fazem frete (decisão do dono do produto).

## Como ler o canvas

- Cada tela é um `.dc.html`. A marcação fica dentro de `<x-dc>`, com estilos inline. Os
  `{{valores}}` vêm de `renderVals()` no `<script type="text/x-dc">` no fim do arquivo,
  `<sc-if value>` é condicional e `<sc-for list as>` é lista.
- O `data-props` do script lista as etapas que o canvas deixa ver (`etapa`, `cenario`,
  `perfil`). No app, isso vem do status do frete.
- `canvas.json` mostra a organização: acesso, cliente no celular, cliente no computador,
  motorista no celular, motorista no computador.
- Os arquivos não rodam fora do canvas (dependem do runtime do Claude). São referência de
  layout, texto e comportamento. Não importar no app.
- Celular e computador são a mesma rota. O layout de computador entra a partir de 900px,
  o breakpoint que o app já usa.
- Dados fixos do canvas (Juliana, Edvaldo, R$ 380, 22 km, Pituba → Vilas do Atlântico)
  são exemplo. No app, tudo vem da API.

## Tokens

O canvas usa os mesmos valores de `tokens.css`. Trocar cada hex pelo token:

| Canvas (claro) | Canvas (escuro, motorista) | Token |
|---|---|---|
| `#FAFAF8` | `#14171C` | `--cor-fundo` |
| `#FFFFFF` | `#1E222A` | `--cor-superficie` |
| `#E6E4DF` | `#2A2F3A` | `--cor-linha` |
| `#8A8F98` | `#6B7280` | `--cor-borda-campo` |
| `#1C1F24` | `#F2F0EA` | `--cor-texto` |
| `#5B6270` | `#A3A9B5` | `--cor-texto-secundario` |
| `#FFC629` | `#FFC629` | `--cor-faixa` (só na linha de rota) |
| `#007A51` | `#2FBF84` | `--cor-garantido` (só dinheiro garantido ou pago) |
| `#C2410C` | `#FB8C4B` | `--cor-alerta` |
| `#C92A2A` | `#FF6B6B` | `--cor-perigo` |
| `#1F5FAD` | `#6EA8F0` | `--cor-info` |
| `#1F5FAD` | `#FFC629` | `--cor-foco` |
| `#2A2F38` | `#0A0C0F` | `--cor-asfalto` |
| (não usa) | `#4A5160` | `--cor-acostamento` |
| `rgb(28 31 36 / .45)` | `rgb(0 0 0 / .55)` | `--cor-veu` |

Raio 16 → `--raio-cartao`, 12 → `--raio-controle`, 4 → `--raio-campo`, 999 →
`--raio-pilula`. Sombra do cartão → `--sombra-cartao`. Alvo de toque 48px →
`--alvo-motorista`. Os tons de hover `#F0EFEB` (claro) e `#262B34` (escuro) não são
tokens: usar o hover que o app já tem. O tema escuro do motorista é
`:root[data-tema="escuro"]`, que já existe.

## Mapa de telas

| Canvas (celular / computador) | Rota | Página atual |
|---|---|---|
| `Main-Celular` / `Main` | `/entrar` | `pages/Entrar.tsx` |
| `Cadastro-Celular` / `Cadastro` | `/cadastro` | `pages/Cadastro.tsx` |
| `Cliente-Inicio` / `Cliente-Inicio-PC` | `/cliente` | `pages/cliente/FretesCliente.tsx` |
| `Cliente-Pedido` + `Cliente-Veiculo` / `Cliente-Pedido-PC` | `/cliente/fretes/novo` | `pages/cliente/PedirFrete.tsx` |
| `Cliente-Propostas` / `Cliente-Propostas-PC` | `/cliente/fretes/:id` antes do Pix | `pages/contratante/DetalheFrete.tsx` |
| `Cliente-Acompanhar` / `Cliente-Acompanhar-PC` | `/cliente/fretes/:id` depois do Pix | `pages/contratante/DetalheFrete.tsx` |
| `Motorista-Busca` / `Motorista-Busca-PC` | `/motorista` | `pages/motorista/BuscaFretes.tsx` |
| `Motorista-Frete` / `Motorista-Frete-PC` | `/motorista/fretes/:id` | `pages/motorista/FreteMotorista.tsx` |
| `Motorista-Entrega` / `Motorista-Entrega-PC` | `/motorista/fretes/:id/entrega` | `pages/motorista/RegistrarEntrega.tsx` |
| `Motorista-Fretes` / `Motorista-Fretes-PC` | `/motorista/meus-fretes` | `pages/motorista/MeusFretes.tsx` |
| `Motorista-Calculadora` / `Motorista-Calculadora-PC` | `/motorista/calculadora` | `pages/motorista/Calculadora.tsx` |
| `Motorista-Perfil` / `Motorista-Perfil-PC` | `/motorista/perfil` | `pages/motorista/Perfil.tsx` |

O menu do motorista (embaixo no celular, no topo no computador) e o menu da conta do
cliente ficam nos layouts (`components/Layouts.tsx`), não em cada página.

## Comportamento por tela

### Entrar (`/entrar`)

- Entrar → `POST /api/auth/login` → página inicial do papel.
- Continuar com Google → `POST /api/auth/google`.
- Esqueci a senha → o canvas só mostra um aviso. Não existe endpoint (ver decisões).
- Criar conta → `/cadastro`.

### Cadastro (`/cadastro`)

- Escolha de perfil: "Quero pedir fretes" ou "Sou motorista".
- Motorista escolhe Utilitário, Van ou furgão, ou Caminhão. Aviso fixo: "Carro de passeio e
  moto não fazem frete no Fretaí."
- Criar conta → `POST /api/clientes` ou `POST /api/motoristas` → início do papel.

### Início do cliente (`/cliente`)

- Quatro atalhos (Mudança, Móveis e eletros, Caixas e volumes, Material de obra) e
  "Pedir frete" → `/cliente/fretes/novo`. O atalho pode já marcar o tipo.
- Cartão "Em andamento" → `/cliente/fretes/:id`.
- Anteriores (`GET /api/fretes/cliente/{clienteId}`): cada item abre e fecha. Aberto
  mostra o motorista, o veículo, quando foi entregue, a nota dada e "Pedir de novo" →
  `/cliente/fretes/novo` (sugestão: já preencher rota e descrição).
- Avatar → menu da conta: nome e e-mail (`GET /api/auth/eu`), "Frete em andamento",
  "Pedir um frete" (só no celular), "Como o pagamento funciona" (texto que abre e fecha)
  e Sair (`POST /api/auth/logout` → `/entrar`). No celular é uma folha que sobe de baixo,
  no computador é um menu no avatar.

### Pedir frete (`/cliente/fretes/novo`)

- Celular em dois passos (`Cliente-Pedido` → `Cliente-Veiculo`). Computador numa página
  só, com o resumo ao lado (`Cliente-Pedido-PC`).
- Campos → `SolicitarFreteRequest`: coleta, entrega, dataColeta, descricaoCarga, pesoKg,
  nomeDestinatario, telefoneDestinatario, valor.
- Tipo de carga, fotos e tamanho do veículo não existem no `SolicitarFreteRequest` (ver
  decisões).
- Pedir frete → `POST /api/fretes` → `/cliente/fretes/:id`.

### Motorista encontrado e propostas (`/cliente/fretes/:id` antes do Pix)

- Três situações: procurando motorista (`PUBLICADO` sem propostas), propostas de outro
  valor (`PROPOSTA_ENVIADA`) e motorista aceitou o valor do cliente (`ACEITO` sem Pix).
- Propostas: `GET /api/fretes/{id}/propostas`. Aceitar → `POST /api/propostas/{id}/aceite`
  e abre o Pix. Recusar → `POST /api/propostas/{id}/recusa` e a proposta some.
- Pagar com Pix → `POST /api/fretes/{id}/pagamento` e mostra QR Code e copia e cola.
  "Copiar código Pix" copia e mostra "Esperando o banco confirmar…". A confirmação vem do
  webhook: acompanhar por `GET /api/fretes/{id}/pagamento`. Depois: "Pix confirmado" e
  "Acompanhar frete".
- Cancelar pedido → confirmação com motivo obrigatório: "Não preciso mais do frete",
  "Vou mudar a data", "Achei outro jeito de levar" ou "Outro motivo" (texto, até 500).
  Sem motivo, o botão fica desabilitado. Confirmar → `POST /api/fretes/{id}/cancelamento`
  com `{ motivo }` → estado "Pedido cancelado · Nenhum valor foi cobrado", com o motivo,
  "Fazer outro pedido" e "Voltar ao início". "Manter o pedido" fecha sem cancelar.

### Acompanhar (`/cliente/fretes/:id` depois do Pix)

- Etapas `ACEITO` → `EM_TRANSITO` → `ENTREGUE` → `PAGO`, com a linha do tempo de
  `GET /api/fretes/{id}/eventos` (vertical no celular, estrada horizontal no computador).
- "Mandar mensagem para o Edvaldo" → conversa (folha no celular, painel lateral no
  computador): histórico, campo, Enviar desabilitado com campo vazio, Enter envia, aviso
  fixo "Pagamento e comprovantes ficam no Fretaí, fora do chat. Não combine pagamento por
  fora." A API não tem mensagens (ver decisões).
- Canhoto (`ENTREGUE`, `GET /api/fretes/{id}/canhoto`): foto, assinatura e GPS. "Algo
  chegou errado" abre o motivo (obrigatório, até 500) → `POST
  /api/fretes/{id}/canhoto/contestacao`. "Voltar" desiste.
- Código de quem recebe: 8 caracteres, como o `CanhotoService` gera (o canvas mostra
  `HK7M 4PXR`). Some em `PAGO`.
- Avaliar (`PAGO`): 1 a 5 estrelas, Enviar desabilitado sem nota → `POST
  /api/fretes/{id}/avaliacoes` com `{ nota }` (a API também aceita `comentario`).
- Cancelar frete (só em `ACEITO`, antes de a carga sair) → confirmação com motivo (as
  mesmas quatro opções) → `POST /api/fretes/{id}/cancelamento` → estado "Frete cancelado"
  com "O Pix de R$ 380 volta para você", "Fazer outro pedido" e "Voltar ao início".

### Fretes perto (`/motorista`)

- Busca: `GET /api/fretes/busca`.
- Raio 10, 25 ou 50 km → `raioKm`.
- Usar GPS → `navigator.geolocation` → `origemLat` e `origemLng`. Mostra "Localizando…"
  enquanto espera e precisa de mensagem se a permissão for negada.
- CEP (no computador, "Buscar por CEP") → campo de 8 números. Com menos, mostra "Digite os
  8 números do CEP." Buscar → `origemCep`.
- Cartão do frete → `/motorista/fretes/:id`. Frete que o veículo não leva aparece apagado,
  sem link, com o motivo.
- Menu: Fretes, Meus fretes, Calculadora, Perfil. No computador, o avatar leva ao Perfil.

### Frete do motorista (`/motorista/fretes/:id`)

- Aceitar por R$ X → `POST /api/fretes/{id}/aceite` com `{ motoristaId, veiculoId }` →
  "Fechado com Juliana. Esperando o Pix dela." → "Pix confirmado: R$ 380 guardado" quando o
  pagamento confirmar.
- Propor outro valor → campo de valor (Enviar desabilitado com valor vazio ou zero) →
  `POST /api/fretes/{id}/propostas` → "Proposta enviada… A cliente decide." A API também
  exige `adiantamentoPercentual`: manter o que o app já manda. Retirar proposta → `POST
  /api/propostas/{id}/retirada`.
- Endereços e telefone de quem recebe só aparecem depois de fechar.
- "Mandar mensagem para a Juliana" (depois de fechar) → a mesma conversa do cliente.
- Carreguei, iniciar viagem → `POST /api/fretes/{id}/inicio`.
- Cheguei, registrar entrega → `/motorista/fretes/:id/entrega`.
- Desistir do frete (só em `ACEITO`, fechado ou com Pix confirmado) → confirmação com
  motivo obrigatório: "Problema com o veículo", "Não vou conseguir no dia", "A carga é
  diferente do anunciado" ou "Outro motivo" → `POST /api/fretes/{id}/cancelamento` →
  "Frete cancelado. A Juliana foi avisada" (mais "e o Pix volta para ela" se já tinha Pix)
  e "Ver outros fretes". Aviso: "Depois que a carga sai, não dá mais para desistir."

### Registrar entrega (`/motorista/fretes/:id/entrega`)

- Foto (câmera), assinatura de quem recebe, GPS e nome de quem recebeu. Enviar canhoto só
  com tudo preenchido → `POST /api/fretes/{id}/canhoto` (multipart), como o app já faz.
- "Como foi com a Juliana?" com 1 a 5 estrelas (ver decisões).
- Ver mais fretes → `/motorista`. Manter os fretes de volta (`GET
  /api/fretes/{id}/retorno`) que o app já mostra.

### Meus fretes (`/motorista/meus-fretes`)

- Resumo: "A receber" (garantido, em `--cor-garantido`) e "Recebido no mês".
- Abas Em andamento, Propostas (`GET /api/propostas/minhas`) e Concluídos, com o total em
  cada aba. Retirar proposta → `POST /api/propostas/{id}/retirada`.
- Cartão em andamento → `/motorista/fretes/:id`.

### Calculadora (`/motorista/calculadora`)

- Campos: valor do frete, distância, consumo (km/l), diesel (R$/l), pedágio e outros
  custos. "Contar a volta vazio" dobra a distância do diesel.
- Resultado: diesel, pedágio e outros, custo da viagem, "Sobra" (cor do texto) ou "Falta"
  (`--cor-perigo`) e R$ por km rodado com carga.
- "Limpar os números" limpa tudo menos o diesel.
- A API tem `POST /api/calculadora/frete` (com piso ANTT por tipo de carga e eixos). Usar a
  API ou calcular no navegador; conferir se a API considera a volta.

### Perfil (`/motorista/perfil`)

- Contato → salvar mostra "Contato salvo.".
- Chave Pix → `PUT /api/motoristas/{id}/chave-pix` com `{ chavePix }`. O tipo de chave do
  canvas só ajuda no formato; a API recebe só a chave.
- Veículos → `GET`, `POST` e `DELETE /api/motoristas/{id}/veiculos`. Placa no formato
  ABC1234 ou ABC1D23, com mensagem de erro (ver decisões sobre os outros campos).
- Avisos de frete: base e raio (10, 25 ou 50 km) → `PUT /api/motoristas/{id}/base` com
  `{ latitude, longitude, raioKm }`. Feriados → `PATCH /api/motoristas/{id}/preferencias`
  com `{ aceitaFeriado }`.
- Documentos (CNH e CRLV): situação de cada um e envio de arquivo (componente `Documentos`).
- Sair → `POST /api/auth/logout` → `/entrar`.

## Simulado no canvas → real no app

| No canvas | No app |
|---|---|
| Pix confirmado depois de 1,8 s (cliente) ou 2,5 s (motorista) | webhook `POST /api/webhooks/pagamentos` + `GET /api/fretes/{id}/pagamento` |
| GPS "Localizando…" por 1,2 s | `navigator.geolocation` |
| CEP vira "CEP 41810-000" no topo | `origemCep` na busca |
| Resposta automática no chat depois de 1,2 s | mensagem real do outro lado |
| Etapas escolhidas no painel do canvas | status do frete (`StatusFrete`) |
| Cada tela guarda o próprio estado | estado vem da API: cancelar numa tela aparece nas outras |
| Foto, assinatura e GPS da entrega com um toque | câmera, componente `Assinatura` e GPS de verdade |

## Decisões

Onde o comportamento por tela diz outra coisa, vale esta seção. Respondidas pelo dono do
produto em 2026-11-09:

1. **Mensagens: link de WhatsApp depois do aceite.** A conversa do canvas vira um botão que
   abre o WhatsApp com o telefone do outro lado. O telefone só sai da API depois do aceite
   (`GET /api/fretes/{id}/contato`). Não há chat no app.
2. **Tamanho do veículo no pedido: campo novo.** O pedido e o frete ganham
   `categoriaVeiculo` (`UTILITARIO`, `VAN` ou `CAMINHAO`). Aceita quem tem um veículo desse
   tamanho ou maior. `MOTO` e `CARRO` saem de `CategoriaVeiculo`.
3. **Veículo do motorista: o formulário do canvas vale para todos.** O veículo ganha
   categoria e modelo. RNTRC, tipo de caminhão, carroceria e eixos viram opcionais; o frete
   de empresa que exige um tipo de caminhão continua pedindo esses dados.
4. **Esqueci a senha: link por e-mail.** Token de uso único que expira. Enquanto o projeto
   não tem servidor de e-mail, o link sai no log. Tela nova para criar a senha.
5. **Tipo de carga e fotos: entram na API.** O frete ganha `tipoCarga` e até 5 fotos (JPEG
   ou PNG), que os motoristas veem antes de aceitar.
6. **Nota do motorista para o cliente: só gravar.** A API já aceita e guarda; ninguém vê a
   média.
7. **Cotação: fica de fora.** O cliente oferece o valor e o motorista aceita ou propõe outro.

Decididas na escrita do plano, por estarem fora da lista acima:

- **Número da CNH no cadastro: não entra.** A foto da CNH, que o administrador confere, já
  traz o número. Pedir de novo aumenta o dado pessoal guardado sem mudar nada.
- **E-mail no Perfil: só leitura.** É o login, e trocar exigiria confirmar o e-mail novo.
  "Salvar contato" grava o celular (`PUT /api/motoristas/{id}`).
- **Base do motorista: CEP ou "usar onde estou".** `PUT /api/motoristas/{id}/base` passa a
  aceitar `cep`. Bairro sem cidade não dá para localizar.
- **Peso em faixas:** o pedido manda o limite de cima da faixa (200, 700 ou 1500 kg); "Mais
  de 1,5 t" abre um campo para o peso.
- **Calculadora:** a conta do canvas roda no navegador (a API não conta a volta vazio). O
  piso ANTT, que o app já mostra, continua como parte opcional.
- **Frete do cliente em página própria:** `/cliente/fretes/:id` deixa de usar o
  `DetalheFrete` da empresa, que fica como está.
- **Endereço completo e quem recebe só para quem participa:** a API passa a esconder
  logradouro, número, CEP, coordenadas e o destinatário de quem não é parte do frete.

## Como verificar

- Cada tela do mapa, em 390×844 e em 1440 de largura, comparada com o `.dc.html`.
- Cada botão desta spec faz o que está escrito; nenhum `href="#"`.
- Estados de carregamento, vazio e erro em toda chamada à API.
- `npm run build` e `npm run lint` passam, e os testes existentes continuam passando.
- O modo demo (`npm run demo`) mostra as etapas, para recapturar o quadro com
  `npm run quadro`.
