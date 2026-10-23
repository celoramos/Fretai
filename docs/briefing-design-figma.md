# Fretaí — briefing de design para o Figma

> **Para o Claude Code:** este documento é a fonte única para desenhar a interface do Fretaí no Figma.
> Leia inteiro antes de criar qualquer coisa. A seção 9 diz como organizar o arquivo e em que ordem trabalhar.
> O backend já existe e está pronto (Java/Spring, neste repositório). O design deve usar **os dados reais da API**
> descritos na seção 7. Não invente campos que a API não tem; se uma tela precisar de algo que não existe,
> anote como "precisa de API" no canto do frame.

---

## 1. O produto em uma frase

**O Fretaí resolve o calote no frete.** É um marketplace que liga empresas que têm carga a caminhoneiros
autônomos, com o pagamento garantido antes de a carga sair.

### O problema real

O caminhoneiro autônomo aceita uma carga confiando na palavra de quem oferece. Recebe uma parte na saída
(adiantamento) e o resto (saldo) "depois da entrega". É nesse depois que o calote acontece: o saldo atrasa,
encolhe ou nunca chega. Do outro lado, a empresa não sabe se o motorista é quem diz ser, nem se a carga chegou inteira.
Concorrente principal: Fretebras (vitrine de fretes, sem garantia de pagamento).

### Como o Fretaí resolve, e o que o design precisa deixar óbvio

| Mecanismo | Como aparece para o usuário |
|---|---|
| **Dinheiro existe antes de sair.** A empresa paga por Pix no aceite; o valor fica retido no provedor de pagamento. | Selo **"Pagamento garantido"** visível em todo frete pago. É o elemento mais importante da interface. |
| **Adiantamento na saída, saldo na entrega comprovada.** | Medidor em 3 partes: Retido → Adiantamento liberado → Saldo liberado. |
| **Canhoto digital:** foto, assinatura do recebedor na tela, GPS conferido contra o destino. | Fluxo de câmera + assinatura + "Você está a 60 m do destino ✓". |
| **Piso mínimo da ANTT** (Lei 13.703/2018) calculado em todo frete. | Chip "Piso ANTT R$ 7.350" ao lado do valor; alerta se a oferta está abaixo. |
| **Alerta de "fretão"** (golpe: valor alto demais para atrair o motorista). | Aviso laranja "Valor muito acima da média desta rota. Confira a empresa." |
| **Reputação dos dois lados.** | Nota, nº de fretes e **"% de saldos pagos em dia"** da empresa, em destaque no card. |
| **Documentos sem WhatsApp.** CNH/CRLV só aparecem para a empresa depois que ela aceita aquele motorista, por link que expira. | Cadeado + "Visível para a empresa só após o aceite". |

**Sentimento que a interface precisa passar:** "aqui o dinheiro é sério". Confiança de banco digital com a
linguagem de quem vive na estrada. Nada de cara de planilha, nada de template genérico de SaaS.

---

## 2. Histórico do que já foi feito (contexto)

1. O projeto começou como um app de frete pontual para **pessoa física** (cliente pede, motorista aceita),
   com cadastro, CEP pelo ViaCEP, coordenadas pelo Nominatim, distância pelo GraphHopper e adicional de feriado.
2. Virou marketplace B2B em 10 fases (todas implementadas e testadas, ~180 testes):
   1. Persistência com PostgreSQL/PostGIS: Empresa (CNPJ, embarcador ou agenciador), Veículo, histórico de eventos.
   2. API REST completa com paginação e erros padronizados.
   3. Login com JWT (access 15 min + refresh), papéis CLIENTE, EMPRESA, MOTORISTA e ADMIN.
   4. Busca de fretes por raio (50/100/200 km ou livre) com filtros.
   5. Propostas nos dois sentidos, aceite, máquina de estados e trilha de auditoria.
   6. Calculadora de custo da viagem e piso ANTT (tabela no banco, hoje com valores **de exemplo**).
   7. Avaliação bidirecional e perfis públicos.
   8. Documentos (CNH, CRLV, comprovantes) com link temporário e registro de quem abriu.
   9. Pagamento com garantia via PSP (Asaas sandbox / PSP falso), webhooks, adiantamento, saldo e estorno.
   10. Canhoto digital, contestação, notificações (WhatsApp), frete de retorno.
3. **Decisões do dono do produto que o design deve respeitar:**
   - Os **dois fluxos convivem**: cliente pessoa física (frete pontual) e empresa (marketplace). O foco visual
     é o marketplace B2B; o fluxo PF pode aparecer como uma entrada secundária ("Precisa de um frete avulso?").
   - Não existe frontend ainda. Este design é o primeiro.
   - O frontend será um **PWA**: o motorista usa no celular (instala na tela inicial), a empresa usa no computador.

---

## 3. Quem usa

### Motorista — "João, 47 anos, carreteiro autônomo"
- Usa **só o celular**, muitas vezes na cabine, no sol, com uma mão, com sinal ruim na estrada.
- Lê pouco e rápido. Quer saber em 2 segundos: **de onde, para onde, quanto, se paga garantido, se a empresa é séria.**
- Já levou calote. Desconfia de valor alto demais. Pensa em **R$/km** e em **"volto vazio?"**.
- Vocabulário: carreta, truck, bitrem, sider, baú, eixo, frete de retorno, adiantamento, saldo, canhoto, RNTRC.

### Empresa — "Carla, analista de logística de uma indústria de cerâmica"
- Usa **computador**, várias abas abertas, vários fretes por semana.
- Quer publicar rápido, comparar propostas, ver o motorista (nota, documentos, caminhão) e acompanhar a entrega.
- Precisa provar internamente que pagou certo: valoriza **trilha de auditoria** e **canhoto com foto e GPS**.
- Pode ser **embarcador** (dono da carga) ou **agenciador** (intermediário). Agenciador aparece marcado no frete.

### Administrador — operação do Fretaí
- Verifica documentos, resolve contestações de entrega, mantém a tabela do piso ANTT. Desktop, telas densas.

### Recebedor da carga (sem conta)
- Recebe por WhatsApp um código de 8 letras para contestar a entrega. Precisa de **uma única tela pública**, simples.

---

## 4. Direção visual

### Conceito: "Rodovia + cofre"

A interface empresta a linguagem da **sinalização rodoviária brasileira** (placas, faixas, marcos de quilômetro,
asfalto) e junta com a **solidez de um app bancário** quando o assunto é dinheiro. Duas regras:

1. **Estrada é a moldura** (rotas, timeline, marcos, tipografia de placa).
2. **Dinheiro é sagrado** (valores grandes, verde só para "garantido/liberado", nunca decorativo).

Evitar: gradientes roxo/azul genéricos, ilustrações 3D de bonequinhos, cards todos iguais com sombra suave,
ícones de caminhão de desenho animado, glassmorphism. Isso é o que faz parecer "mais um template".

### Paleta (criar como variáveis do Figma, com modos **Claro** e **Escuro**)

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `cor/fundo` | `#F6F4EF` (papel de canhoto, quente) | `#14171C` (asfalto) | fundo de página |
| `cor/superficie` | `#FFFFFF` | `#1E222A` | cards, sheets |
| `cor/superficie-elevada` | `#FFFFFF` | `#262B35` | modais, menus |
| `cor/linha` | `#E2DED5` | `#323845` | bordas, divisórias |
| `cor/texto` | `#1C1F24` | `#F2F0EA` | texto principal |
| `cor/texto-secundario` | `#5B6270` | `#A3A9B5` | metadados |
| `cor/faixa` | `#FFC629` | `#FFC629` | **amarelo de sinalização**: CTA principal, destaques de rota. Texto sobre ele sempre `#14171C`. |
| `cor/garantido` | `#00875A` | `#2FBF84` | **só** para pagamento retido/liberado, entrega confirmada, documento verificado |
| `cor/garantido-fundo` | `#E3F4EC` | `#123528` | fundo do selo "Pagamento garantido" |
| `cor/alerta` | `#C2410C` | `#FB8C4B` | "fretão", abaixo do piso, contestação aberta (cone laranja) |
| `cor/alerta-fundo` | `#FFF1E6` | `#3A2214` | fundo de avisos |
| `cor/perigo` | `#C92A2A` | `#FF6B6B` | erro, cancelamento, recusado |
| `cor/info` | `#1F5FAD` | `#6EA8F0` | placas azuis de informação, links |

- Modo **Escuro é o padrão do motorista** (cabine, noite, economiza bateria); modo **Claro é o padrão da empresa**.
- Conferir contraste: texto ≥ 4,5:1, textos grandes e ícones ≥ 3:1, nos dois modos. O motorista usa no sol:
  na dúvida, mais contraste.

### Tipografia (Google Fonts)

| Papel | Fonte | Por quê |
|---|---|---|
| Títulos, rotas, números | **Barlow Semi Condensed** (600/700) | desenhada a partir das placas de rodovia; números largos e legíveis |
| Texto de interface | **Barlow** (400/500/600) | mesma família, legível em tela pequena |
| Placas, códigos, ids | **JetBrains Mono** (500) | placa `ABC1D23`, código de contestação `K7QM2XPR`, RNTRC |

Escala (mobile / desktop): Display 40/56 · H1 28/36 · H2 22/28 · H3 18/22 · Corpo 16/16 · Pequeno 14/14 · Legenda 12/12.
Valores em dinheiro de destaque: Barlow Semi Condensed 700, com o "R$" menor e mais claro que o número.

### Forma, espaço, movimento

- Grade de 4 px; espaçamentos 4, 8, 12, 16, 24, 32, 48.
- Raio: 6 px em campos e chips, 12 px em cards, 20 px em bottom sheets. Nada de pílula em tudo.
- Sombras quase ausentes; separação por **cor de superfície e borda** (mais "documento", menos "flutuante").
- Alvos de toque ≥ 48 px no app do motorista (luva, mão suja, estrada).
- Movimento curto (150–250 ms), com propósito: o medidor de pagamento "enche" quando o status avança.
  Respeitar "reduzir movimento".

### Elementos-assinatura (o que deixa o Fretaí reconhecível)

1. **Linha de rota**: origem e destino ligados por uma faixa tracejada amarela (como faixa de pista), com a
   distância no meio ("430 km"). Usada em todo card de frete.
2. **Selo "Pagamento garantido"**: escudo/cadeado + texto, verde. Aparece no card, no detalhe e na tela de andamento.
3. **Medidor de garantia**: barra em 3 trechos (Retido · Adiantamento · Saldo) que vão ficando verdes, com os
   valores em reais embaixo de cada trecho.
4. **Timeline em marcos de quilômetro**: cada status do frete é um marco (placa pequena) ao longo de uma estrada vertical.
5. **Chip de piso ANTT**: estilo placa branca com borda; muda para laranja se a oferta estiver abaixo.
6. **Placa do veículo** desenhada como placa Mercosul em miniatura (faixa azul no topo, mono).

### Tom de voz (microcopy em pt-BR)

Direto, respeitoso, sem jargão financeiro. Falar como o caminhoneiro fala.

| Evitar | Usar |
|---|---|
| "Escrow ativo" | "Pagamento garantido" |
| "Status: RETIDO" | "O dinheiro já está guardado. Pode carregar." |
| "Submeter proposta" | "Enviar proposta" |
| "Erro 422" | "Você está a 3,2 km do destino. O canhoto só vale a até 500 m do endereço de entrega." |
| "Nenhum registro encontrado" | "Nenhum frete nesse raio agora. Aumente para 200 km ou ative o aviso de frete novo." |

---

## 5. Mapa de telas

Tamanhos de frame: **motorista** em 390 × 844 (celular); **empresa** e **admin** em 1440 × 1024 (com variação
responsiva da empresa em 390 para emergências). Toda tela com dados precisa dos estados: **carregando (skeleton),
vazio, erro, sucesso**.

### 5.1 Público e entrada

| Tela | Conteúdo |
|---|---|
| **Landing** (desktop + mobile) | Hero: "Frete com pagamento garantido antes de carregar." Dois CTAs: "Sou caminhoneiro" / "Tenho carga". Seção "Como funciona" em 4 passos na linha de rota (Publica → Propõe → Paga e retém → Entrega com canhoto e recebe). Números de confiança (deixar como placeholders claros, ex.: "[N] fretes pagos"). Link secundário: "Precisa de um frete avulso? (pessoa física)". |
| **Escolha de perfil** | Dois cartões grandes: Motorista / Empresa. |
| **Cadastro do motorista** (3 passos) | 1) Dados: nome, CPF, e-mail, telefone, senha. 2) Caminhão principal: tipo (lista visual com silhueta e eixos), carroceria, placa, RNTRC, nº de eixos, rastreador sim/não. 3) Chave Pix e base (cidade + raio de aviso 50/100/200 km). |
| **Cadastro da empresa** | CNPJ primeiro → a razão social preenche sozinha (consulta à Receita) e aparece confirmada ("Cerâmica Paulista Ltda · ATIVA ✓"). Tipo: embarcador/agenciador (explicar a diferença em uma linha). Telefone, nome fantasia. Responsável: nome, CPF, e-mail, telefone, senha. |
| **Login** | E-mail + senha. Estado de bloqueio: "Muitas tentativas. Tente de novo em 12 minutos." |
| **Contestar entrega** (pública, sem login) | Campo do código de 8 letras (caixas separadas, mono), motivo, enviar. Sucesso: "Recebemos. O pagamento ao motorista fica parado até a análise." |

### 5.2 Motorista (celular, modo escuro padrão)

Navegação inferior com 4 itens: **Fretes** · **Meus fretes** · **Carteira** · **Perfil**.

| Tela | Conteúdo |
|---|---|
| **Fretes (busca)** | Topo: "Perto de [cidade]" + chips de raio **50 · 100 · 200 · outro**. Filtros em bottom sheet: destino (opcional), tipo de veículo, carroceria, e SIM/NÃO/TANTO FAZ para rastreador, agenciador, com preço, complemento. Alternância **Lista / Mapa**. Lista de cards ordenada por distância. |
| **Card de frete** (componente) | Linha de rota (cidade/UF → cidade/UF, km); distância até a coleta ("a 23 km de você"); valor grande ou "A combinar"; R$/km; chip piso ANTT; data de coleta; badges: rastreador, complemento, agenciador, feriado; tipos de veículo aceitos; mini-reputação da empresa (★ 4,8 · 96% pagos em dia). Se `acimaDaMedia`: faixa laranja "Valor muito acima da média desta rota". |
| **Detalhe do frete** | Mapa da rota; carga (descrição, espécie, tipo ANTT, peso); requisitos; valor + piso ANTT + aviso; data; bloco da empresa (nome, tipo, desde quando, nota, fretes concluídos, % saldos pagos em dia, link para avaliações). Rodapé fixo: **"Aceitar por R$ X"** (amarelo) e **"Fazer proposta"** (secundário). Se "a combinar": só "Fazer proposta". |
| **Enviar proposta** (bottom sheet) | Caminhão (escolher da frota; os incompatíveis aparecem desabilitados com o motivo); valor (teclado numérico, R$/km calculado ao vivo, comparação com o piso); adiantamento (slider 0–100% em passos de 10, mostrando "R$ 3.120 na saída · R$ 4.680 na entrega"); prazo de entrega; observação. |
| **Calculadora "esse frete paga?"** | Distância, consumo km/l, preço do diesel, pedágio, outros custos, tipo de carga e eixos → custo total, piso ANTT, margem em destaque (verde se positiva, laranja se negativa). Acessível pelo detalhe do frete e pela carteira. |
| **Meus fretes** | Abas: **Propostas** (enviada/aceita/recusada/retirada, com botão retirar) · **Em andamento** · **Concluídos**. |
| **Frete em andamento** | Topo: status com timeline de marcos. **Medidor de garantia** com valores. Ações conforme o status: "Iniciar viagem" (ACEITO, e só faz sentido com pagamento RETIDO: mostrar aviso se ainda PENDENTE), "Registrar entrega" (EM_TRANSITO). Contato e endereço completo de coleta/entrega. Documentos do frete (enviar CNH/CRLV). Card **"Frete de retorno"**: "3 fretes saindo perto de Rio de Janeiro/RJ". |
| **Canhoto digital** (3 passos, tela cheia) | 1) Foto da entrega (câmera). 2) Nome do recebedor + **assinatura na tela** (área grande, botão limpar). 3) Confirmação com GPS: "Você está a 60 m do destino ✓" (ou erro com a distância). Enviar. Sucesso: "Entrega registrada. O saldo de R$ 4.680 sai em 24 h se ninguém contestar." com contagem regressiva. |
| **Carteira** | Saldo a receber, adiantamentos e saldos liberados por frete (lista com medidor compacto), chave Pix cadastrada (mascarada), aviso se não tem chave ("Sem chave Pix a empresa não consegue gerar o pagamento"). |
| **Perfil** | Nota, fretes concluídos, documentos verificados (selos CNH/CRLV), frota (lista de caminhões com placa Mercosul), base e raio de aviso, aceita frete em feriado (toggle), chave Pix, sair. |
| **Avaliar** | 5 estrelas grandes + comentário opcional. Aparece depois da entrega. |

### 5.3 Empresa (desktop, modo claro padrão)

Navegação lateral: **Painel** · **Fretes** · **Publicar frete** · **Pagamentos** · **Perfil da empresa**.

| Tela | Conteúdo |
|---|---|
| **Painel** | KPIs: fretes publicados, com propostas aguardando, em trânsito, valor retido no momento, % de saldos pagos em dia (o número que os motoristas veem). Lista "Precisa da sua ação": propostas para responder, cobranças Pix pendentes, entregas para conferir/contestar, avaliações pendentes. |
| **Publicar frete** (wizard em 1 página com seções) | Coleta e entrega (CEP → endereço preenche; número; pino no mapa opcional); data de coleta (avisar se é feriado/domingo); carga (descrição, espécie, tipo ANTT, peso); requisitos (tipos de veículo em grade visual com silhuetas, carrocerias, rastreador, complemento); valor **ou** "a combinar". Painel lateral fixo "Resumo": rota, distância, piso ANTT estimado, R$/km, alertas. Depois de publicar, mostrar o piso e alertas reais da resposta. |
| **Fretes** | Tabela com filtros por status (chips com cor do status) e alternância **Quadro** (kanban: Publicado → Com propostas → Aceito → Em trânsito → Entregue → Pago). |
| **Detalhe do frete** (empresa) | Cabeçalho com rota, status e timeline horizontal. Abas: **Propostas** (comparador lado a lado: motorista, nota, fretes concluídos, docs verificados, caminhão com placa e eixos, valor, adiantamento em % e R$, prazo; aceitar/recusar; destacar a melhor por valor e a melhor por reputação) · **Pagamento** (QR Code Pix grande + copia-e-cola + vencimento; depois o medidor de garantia) · **Entrega** (canhoto: foto, assinatura, mapa com o ponto do GPS e o destino, distância, prazo de contestação, botão "Contestar entrega") · **Documentos** (cadeado antes do aceite; depois lista com "Abrir" → link temporário; aviso "este acesso fica registrado") · **Histórico** (trilha de auditoria: de → para, quem, quando, observação) · **Avaliar motorista**. |
| **Pagamentos** | Lista de cobranças com status de pagamento, valores, vencimento, pago em. |
| **Perfil da empresa** | Como os motoristas veem a empresa (preview do card público) + edição de nome fantasia e telefone. |

### 5.4 Administrador (desktop)

| Tela | Conteúdo |
|---|---|
| **Documentos para verificar** | Fila com prévia do arquivo, motorista, tipo, data; botão "Verificar". |
| **Contestações** | Lista de entregas contestadas: motivo, canhoto (foto, assinatura, GPS), valores bloqueados; decisão "Entrega confirmada" ou "Contestação procedente" + observação. |
| **Tabela do piso ANTT** | Grade tipo de carga × eixos (2,3,4,5,6,7,9) com CCD (R$/km) e CC (R$). Banner fixo laranja enquanto houver linha com fonte "EXEMPLO": "Estes coeficientes são de exemplo. Preencha com a tabela vigente da ANTT." Edição por célula com campo "fonte". |

---

## 6. Status, rótulos e cores (usar exatamente estes valores da API)

### Status do frete (`StatusFrete`)

| Valor | Rótulo para motorista | Rótulo para empresa | Cor |
|---|---|---|---|
| `PUBLICADO` | Aberto | Aguardando propostas | info |
| `PROPOSTA_ENVIADA` | Em negociação | Com propostas | faixa |
| `ACEITO` | Fechado · vá para a coleta | Motorista a caminho da coleta | info |
| `EM_TRANSITO` | Em viagem | Em trânsito | faixa |
| `ENTREGUE` | Entregue · saldo em análise | Entregue | garantido (claro) |
| `PAGO` | Pago | Concluído e pago | garantido |
| `CANCELADO` | Cancelado | Cancelado | perigo (suave) |

Fluxo: `PUBLICADO ⇄ PROPOSTA_ENVIADA → ACEITO → EM_TRANSITO → ENTREGUE → PAGO`; `CANCELADO` só antes de `EM_TRANSITO`.

### Status do pagamento (`StatusPagamento`)

| Valor | Rótulo | Medidor |
|---|---|---|
| `PENDENTE` | Aguardando o Pix da empresa | vazio, com aviso |
| `RETIDO` | **Pagamento garantido** | trecho 1 verde |
| `ADIANTAMENTO_LIBERADO` | Adiantamento pago | trechos 1–2 verdes |
| `LIBERADO` | Saldo pago | completo |
| `ESTORNADO` | Devolvido à empresa | cinza |

`saldoBloqueado: true` → trecho do saldo em laranja com "Entrega contestada · em análise".

### Proposta (`StatusProposta`)
`ENVIADA` (aguardando) · `ACEITA` · `RECUSADA` · `RETIRADA`.

### Enums com rótulo amigável

- **TipoVeiculo:** `RODOTREM` Rodotrem (9 eixos) · `BITREM` Bitrem (7) · `CARRETA_LS` Carreta LS (6) · `CARRETA` Carreta (5) · `VANDERLEIA` Vanderleia (6) · `TRUCK` Truck (3) · `BITRUCK` Bitruck (4) · `TOCO` Toco (2) · `VUC` VUC (2) · `TRES_QUARTOS` 3/4 (2). Desenhar uma silhueta lateral simples de cada (traço, sem cartoon), com os eixos contáveis.
- **TipoCarroceria:** `BAU` Baú · `BAU_FRIGORIFICO` Baú frigorífico · `SIDER` Sider · `CACAMBA` Caçamba · `GRADE_BAIXA` Grade baixa · `GRANELEIRO` Graneleiro · `PRANCHA` Prancha · `TANQUE` Tanque · `CEGONHA` Cegonha.
- **TipoCargaAntt:** Granel sólido · Granel líquido · Frigorificada · Conteinerizada · Carga geral · Neogranel · Perigosa (granel sólido / granel líquido / frigorificada / conteinerizada / carga geral) · Granel pressurizada.
- **TipoEmpresa:** `EMBARCADOR` (dono da carga) · `AGENCIADOR` (intermediário; frete sai marcado).
- **TipoDocumento:** `CNH` · `CRLV` · `COMPROVANTE`.
- **Papel:** `CLIENTE` · `EMPRESA` · `MOTORISTA` · `ADMIN`.

---

## 7. Dados reais da API (para os layouts usarem campos que existem)

Base: `http://localhost:8080`. Swagger em `/swagger-ui.html`. Tudo com `Authorization: Bearer <accessToken>`,
exceto login, cadastros, consulta de CNPJ, contestação por código e links de arquivo.

### Frete (`GET /api/fretes/{id}`, item de listas)
```
id, status, statusDescricao,
cliente {id, nome} | null,  empresa {id, razaoSocial, nomeFantasia, tipo} | null,
motorista {id, nome, tipoVeiculo, placa} | null,
veiculo {id, placa, tipo, carroceria, numeroEixos, rastreador} | null,
coleta / entrega {cep, logradouro, numero, complemento, bairro, cidade, uf, pontoReferencia,
                  enderecoCompleto, latitude, longitude},
nomeDestinatario, telefoneDestinatario, descricaoCarga, especieCarga, tipoCargaAntt, pesoKg,
valor, valorACombinar, adicionalFeriado, valorTotal,
veiculosAceitos[], carroceriasAceitas[], exigeRastreador, complemento, publicadoPorAgenciador,
dataColeta, feriado, nomeFeriado, domingo, distanciaKm, distanciaEstimada,
valorAcordado, adiantamentoPercentual, prazoEntrega,
preco {pisoMinimo, eixosConsiderados, coeficientesDeExemplo, abaixoDoPiso, acimaDaMedia, mediaRotaPorKm},
motivoCancelamento, criadoEm, aceitoEm, concluidoEm, pagoEm
```
Busca (`GET /api/fretes/busca`) devolve itens `{distanciaOrigemKm, frete}`.
Parâmetros: `origemLat`, `origemLng` ou `origemCep`; `raioKm` (padrão 100, máx. 1000); `destinoLat/Lng` ou
`destinoCep`; `raioDestinoKm`; `tipoVeiculo` e `carroceria` (repetíveis); `exigeRastreador`, `agenciador`,
`comPreco`, `complemento` = `SIM | NAO | AMBOS`.

### Proposta
```
id, freteId, motorista {id, nome}, veiculo {id, placa, tipo, carroceria, numeroEixos, rastreador} | null,
autorPapel (MOTORISTA | EMPRESA | CLIENTE), valor, adiantamentoPercentual, valorAdiantamento,
prazoEntrega, observacao, status, criadaEm, respondidaEm
```

### Pagamento (`/api/fretes/{id}/pagamento`)
```
id, freteId, status, valorTotal, valorAdiantamento, valorSaldo, gateway, cobrancaId,
pixCopiaECola, pixQrCodeBase64 (só enquanto PENDENTE; imagem PNG em base64),
vencimento, pagoEm, adiantamentoLiberadoEm, saldoLiberavelApos, saldoBloqueado, saldoLiberadoEm, estornadoEm
```

### Canhoto (`/api/fretes/{id}/canhoto`)
```
id, freteId, nomeRecebedor, latitude, longitude, distanciaDestinoKm, localConferido,
registradoEm, contestacaoAte, contestado, motivoContestacao, resolucao, fotoUrl, assinaturaUrl (links que expiram em 10 min)
```

### Perfis
- Empresa: `razaoSocial, nomeFantasia, tipo, naPlataformaDesde, mediaNotas, quantidadeAvaliacoes, fretesPublicados, fretesConcluidos, percentualSaldosPagosEmDia (null = sem histórico), cobrancasConsideradas`
- Motorista: `nome, naPlataformaDesde, mediaNotas, quantidadeAvaliacoes, fretesConcluidos, documentosVerificados[]`
- Motorista (próprio): `nome, email, telefone, tipoVeiculo, placa, aceitaFeriado, temChavePix`
- Veículo: `placa, rntrc, tipo, carroceria, numeroEixos, rastreador`

### Outros
- Histórico: `[{de, para, autorId, autorPapel, observacao, ocorridoEm}]` (`autorPapel` nulo = sistema).
- Avaliação: `{lado (CONTRATANTE|MOTORISTA), avaliadoTipo, nota 1–5, comentario, criadaEm}`.
- Calculadora (`POST /api/calculadora/frete`): `custo {distanciaKm, litros, combustivel, pedagio, outros, total}, piso {valor, ...}, margem, abaixoDoPiso`.
- Documento: `{tipo, contentType, tamanhoBytes, verificado, verificadoEm, criadoEm}`; abrir = `POST /api/documentos/{id}/link` → `{url, expiraEm}`.
- Login: `{accessToken, refreshToken, expiresIn, usuarioId, papel, empresaId}`.
- Listas paginadas: `{content: [...], page: {size, number, totalElements, totalPages}}`.
- Erros: `{title, detail, status, erros?: {campo: mensagem}}`. Desenhar **erro por campo** nos formulários e
  um **banner de erro** com `title` + `detail`.

### Regras que mudam a interface
- O motorista só aceita direto se o frete tem valor; "a combinar" só por proposta.
- Frete de empresa exige escolher um caminhão compatível (tipo, carroceria, rastreador).
- A empresa só vê documentos do motorista **depois do aceite**.
- Cobrança Pix só depois do aceite e se o motorista tem chave Pix.
- Canhoto só com o frete `EM_TRANSITO` e GPS a até **500 m** do destino; assinatura em PNG.
- Contestação até `contestacaoAte` (24 h por padrão).
- Piso com `coeficientesDeExemplo: true` → mostrar discretamente "valores de referência de exemplo".

---

## 8. Componentes do design system

Criar como componentes do Figma, com variantes e propriedades, usando Auto Layout e as variáveis da seção 4.

| Componente | Variantes |
|---|---|
| Botão | primário (faixa), secundário, fantasma, perigo · tamanhos M/G · com ícone · carregando · desabilitado |
| Campo | texto, número/moeda (R$), CEP, CPF, CNPJ, placa (mono), senha · estados: vazio, foco, preenchido, erro, desabilitado |
| Chip / filtro | raio, SIM/NÃO/TANTO FAZ (segmentado), status |
| Badge de status | os 7 do frete, os 5 do pagamento, os 4 da proposta |
| Selo "Pagamento garantido" | compacto (card) e grande (detalhe) |
| Medidor de garantia | 5 estados do pagamento + bloqueado |
| Linha de rota | horizontal (card) e vertical (detalhe) |
| Card de frete | lista do motorista, linha de tabela da empresa, com/sem alerta de fretão, a combinar |
| Chip piso ANTT | normal, abaixo do piso, exemplo |
| Aviso | info, alerta (laranja), perigo, sucesso |
| Timeline de marcos | horizontal (desktop) e vertical (mobile) |
| Placa Mercosul | tamanho P e M |
| Silhuetas de veículo | 10 tipos |
| Cartão de reputação | empresa e motorista |
| Comparador de propostas | coluna de proposta, com destaque "melhor valor" / "melhor reputação" |
| Seletor de adiantamento | slider com valores em reais |
| Área de assinatura | vazia, assinando, assinada |
| QR Code Pix | com copia-e-cola e vencimento |
| Navegação | barra inferior (motorista), menu lateral (empresa/admin), cabeçalho |
| Bottom sheet, modal, toast, skeleton, estado vazio (com ilustração em traço, tema estrada) |

---

## 9. Instruções para o Claude Code montar no Figma

1. **Antes de qualquer `use_figma`, carregar a skill `figma-use`** (e `figma-generate-design` para as telas).
   Rodar `search_design_system` para ver se já existe biblioteca utilizável; se não houver, criar a do Fretaí.
2. **Criar um arquivo novo** chamado "Fretaí — Produto" com estas páginas, nesta ordem:
   - `00 Capa` — nome, conceito "Rodovia + cofre", paleta e as 3 telas-vitrine.
   - `01 Fundamentos` — variáveis (cores com modos Claro/Escuro, espaçamento, raio), estilos de texto, ícones.
   - `02 Componentes` — tudo da seção 8, com variantes e nomes em pt-BR (`Botão/Primário/G`).
   - `03 Motorista · Mobile` — telas da seção 5.2 (frames 390 × 844, modo escuro).
   - `04 Empresa · Desktop` — telas da seção 5.3 (frames 1440 × 1024, modo claro).
   - `05 Admin` — telas da seção 5.4.
   - `06 Público` — landing, cadastros, login, contestação pública.
   - `07 Fluxos` — protótipo clicável dos fluxos da seção 10.
3. **Ordem de trabalho:** fundamentos → componentes → as 3 telas-vitrine → resto das telas → protótipo.
   Mostrar as telas-vitrine antes de seguir, para o dono do produto aprovar a direção:
   - **Motorista: Fretes (busca) com cards** — prova a linha de rota, o selo e a reputação.
   - **Motorista: Frete em andamento** — prova o medidor de garantia e a timeline de marcos.
   - **Empresa: Detalhe do frete, aba Propostas** — prova o comparador e a densidade desktop.
4. Tudo em Auto Layout, ligado às variáveis (nada de cor solta), textos reais em pt-BR (nada de lorem ipsum),
   dados de exemplo coerentes (rotas reais: Campinas/SP → Rio de Janeiro/RJ 430 km, Cuiabá/MT → Belém/PA, etc.;
   valores de mercado plausíveis; placas no formato `ABC1D23`).
5. Cada tela com seus estados (carregando, vazio, erro) em frames lado a lado, nomeados `Tela / Estado`.
6. Anotar no próprio frame qual endpoint alimenta a tela (ex.: "GET /api/fretes/busca"), para a etapa de código.

---

## 10. Fluxos para prototipar

1. **Motorista encontra e fecha um frete:** Fretes → Card → Detalhe → Fazer proposta → Meus fretes (proposta enviada) → notificação "Proposta aceita" → Frete em andamento (aguardando Pix → Pagamento garantido).
2. **Empresa publica e contrata:** Publicar frete (com piso e alerta) → Fretes (quadro) → Detalhe → comparar propostas → Aceitar → Pagamento (QR Pix) → Pagamento garantido.
3. **Viagem e entrega:** Frete em andamento → Iniciar viagem (adiantamento liberado, medidor anda) → Registrar entrega (foto → assinatura → GPS ✓) → "Saldo sai em 24 h" → Saldo pago → Avaliar.
4. **Contestação:** Recebedor abre a tela pública → código → motivo → empresa vê "Entrega contestada" → admin decide → saldo liberado ou mantido.
5. **Frete de retorno:** no aceite, card "3 fretes saindo perto do seu destino" → lista filtrada pelo caminhão do motorista.

---

## 11. Critérios de "isso é um bom sistema"

- Em 2 segundos o motorista sabe de onde, para onde, quanto e se é garantido.
- O verde aparece **só** quando há dinheiro garantido ou liberado: vira um sinal em que se confia.
- Nenhuma tela pede para o usuário fazer conta: R$/km, adiantamento em reais e margem já vêm prontos.
- Todo número de dinheiro tem contexto (piso, média, parte de quê).
- Estados vazios e de erro dizem o próximo passo.
- Funciona com uma mão, no sol, com luva: alvos grandes, alto contraste, ação principal no alcance do polegar.
- A empresa consegue provar o que aconteceu: histórico, canhoto com foto e GPS, registro de acesso a documentos.
