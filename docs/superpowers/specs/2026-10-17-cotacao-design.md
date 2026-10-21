# Cotação com preço dinâmico — design

Data: 2026-10-17 · Parte 1 de 6 das melhorias inspiradas no Uber Direct.

## Por quê

O Fretai quer ser "um Uber/99 de fretes": quem precisa transportar algo pede e
recebe um preço na hora, e freteiros/caminhoneiros (os "agregados") aceitam.

Hoje o **cliente digita o valor do frete** (`SolicitarFreteRequest.valor`). Isso
não funciona num app no estilo Uber: o preço tem que vir da plataforma, ser
igual para todo mundo nas mesmas condições e ficar travado entre a cotação e o
pedido. Também abre brecha para fretes de 500 km por R$ 1.

## Objetivos

- O cliente descreve a carga escolhendo uma **categoria** e informando o **peso
  aproximado**; o sistema devolve **uma opção de preço por veículo que atende
  aquela categoria** (como UberX / Comfort / Black).
- Preço calculado pela plataforma: `(taxa de saída + km × valor/km do veículo) × multiplicador`,
  com piso mínimo por veículo.
- A cotação vale 15 minutos; o frete é criado a partir dela e o preço fica travado.
- Tipos de veículo passam a refletir o negócio: **Carro, Caminhonete, Carreto, Caminhão** (sem moto).
- Freteiro só aceita frete do mesmo tipo de veículo que o dele.
- Depois do aceite, o cliente recebe um link de WhatsApp do freteiro para combinar os detalhes.

## Não-objetivos (ficam para depois)

- Preço dinâmico por **demanda** (muitos pedidos/poucos motoristas na região) —
  exige saber onde os motoristas estão; virá com o app do motorista.
- Contraproposta/negociação de preço pelo freteiro. Ele só aceita ou não.
- Janela de **horário** de coleta/entrega (Parte 4). A data de coleta já existe
  (`dataColeta`, ver "Integração com o trabalho de feriado"); o horário não.
- Piso mínimo da ANTT (Lei 13.703/2018). **O dono do produto precisa conferir a
  tabela atual** antes de calibrar os valores de Caminhão em produção.
- Autenticação: `clienteId` continua vindo no corpo, como hoje.

## Anti-objetivos

- O peso **não** pode alterar o preço (decisão do dono do produto: preço = veículo + distância).
- Nenhum valor de preço fixo no código: tudo em `application.yml`.
- O telefone do freteiro **não** pode aparecer antes do aceite.

## Categorias de carga

| Categoria | Peso aproximado | Exemplos | Veículos oferecidos |
|---|---|---|---|
| `LEVE` | até 200 kg | caixas, TV, micro-ondas, encomendas | Carro, Caminhonete, Carreto |
| `MEDIA` | até 700 kg | geladeira, sofá, máquina de lavar | Caminhonete, Carreto |
| `MEDIO_PESADA` | até 1.500 kg | mudança de kitnet / 1–2 quartos, material de construção em pouca quantidade | Carreto, Caminhão |
| `PESADA` | acima de 1.500 kg (até o limite da plataforma, 50 t) | mudança grande, paletes, carga comercial | Caminhão |

Os limites e a lista de veículos de cada categoria são **decisão minha** a
partir das categorias pedidas (leve, média, médio-pesada, pesada); ficam no
código como enum `CategoriaCarga`, já que mudam raramente e definem regras.

Peso informado acima do limite da categoria → 422 com mensagem sugerindo a
categoria correta ("800 kg não é carga leve; escolha Média"). Peso abaixo do
mínimo implícito (ex.: 50 kg em `PESADA`) é aceito.

## Tipos de veículo

`TipoVeiculo` passa a ser: `CARRO`, `CAMINHONETE`, `CARRETO`, `CAMINHAO`.

- `CARRETO` cobre HR, Bongo, Fiorino, vans e furgões (decisão minha).
- O método `suporta(BigDecimal pesoKg)` (que tinha um TODO) é substituído:
  a regra agora é "a categoria lista os veículos que a atendem".

Migration Flyway (V3): motoristas existentes com `UTILITARIO` ou `VAN` →
`CARRETO`; `MOTO` → `CARRO` (decisão minha, para nenhum cadastro ficar inválido).

## Preço

```
bruto  = taxaSaida(veículo) + distanciaKm × valorPorKm(veículo)
preco  = max(bruto × multiplicador, minimo(veículo))
```

Arredondado para 2 casas, `HALF_UP`, sempre `BigDecimal`.

**Multiplicador** (o maior que se aplicar; não se somam — decisão minha):

| Condição | Valor inicial |
|---|---|
| nenhum | 1,00 |
| fim de semana (`dataColeta` é sábado ou domingo) | 1,15 |
| noturno: coleta **para hoje** pedida entre 22h e 6h | 1,20 |
| feriado nacional na `dataColeta` (via `CalendarioService`/BrasilAPI já existente) | 1,20 |

Feriado e fim de semana olham para a **data da coleta**. Como ainda não há
horário de coleta, o noturno só vale para pedido urgente: `dataColeta` = hoje e
a cotação feita entre 22h e 6h (decisão minha). Os 20% de feriado vêm do
trabalho de feriado que já existia (antes era +20% sobre o valor oferecido).

Fuso: `America/Sao_Paulo`. Se a BrasilAPI de feriados falhar, a cotação segue
sem o multiplicador de feriado (não bloqueia o pedido).

**Valores iniciais** (exemplo; o dono do produto ajusta no `application.yml`):

| Veículo | Taxa de saída | R$/km | Mínimo |
|---|---|---|---|
| Carro | 15,00 | 1,80 | 25,00 |
| Caminhonete | 25,00 | 2,50 | 40,00 |
| Carreto | 40,00 | 3,27 | 70,00 |
| Caminhão | 80,00 | 5,50 | 150,00 |

Configuração sugerida:

```yaml
fretai:
  preco:
    validade-cotacao: 15m
    fuso: America/Sao_Paulo
    veiculos:
      CARRO:       { taxa-saida: 15.00, por-km: 1.80, minimo: 25.00 }
      CAMINHONETE: { taxa-saida: 25.00, por-km: 2.50, minimo: 40.00 }
      CARRETO:     { taxa-saida: 40.00, por-km: 3.27, minimo: 70.00 }
      CAMINHAO:    { taxa-saida: 80.00, por-km: 5.50, minimo: 150.00 }
    multiplicadores:
      fim-de-semana: 1.15
      noturno: 1.20
      noturno-inicio: "22:00"
      noturno-fim: "06:00"
      feriado: 1.20
```

A aplicação deve falhar ao subir se faltar configuração de algum `TipoVeiculo`.

## API

### `POST /api/cotacoes` → 201

Pedido:

```json
{
  "clienteId": "…",
  "coleta":  { "cep": "01310100", "numero": "1000", "complemento": null, "pontoReferencia": null },
  "entrega": { "cep": "13010000", "numero": "50",   "complemento": "ap 12", "pontoReferencia": null },
  "categoria": "MEDIA",
  "pesoKg": 120,
  "descricaoCarga": "Geladeira duplex",
  "dataColeta": "2026-10-18"
}
```

Resposta:

```json
{
  "id": "…",
  "categoria": "MEDIA",
  "distanciaKm": 98.4,
  "distanciaEstimada": false,
  "dataColeta": "2026-10-18",
  "feriado": false,
  "nomeFeriado": null,
  "multiplicador": 1.15,
  "motivoMultiplicador": "FIM_DE_SEMANA",
  "validaAte": "2026-10-17T15:45:00Z",
  "opcoes": [
    { "tipoVeiculo": "CAMINHONETE", "descricao": "Caminhonete", "valor": 311.65 },
    { "tipoVeiculo": "CARRETO",     "descricao": "Carreto",     "valor": 416.03 }
  ]
}
```

Regras:
- Endereços resolvidos como hoje (ViaCEP/BrasilAPI → Nominatim → GraphHopper).
- **Sem coordenadas de coleta ou entrega não há preço** → 422 "Não foi possível
  localizar o endereço de coleta/entrega no mapa" (decisão minha; hoje o frete
  é criado sem distância, mas sem distância não há cotação). Sem chave do
  GraphHopper continua valendo a distância estimada (`distanciaEstimada: true`).
- A cotação é **persistida** (tabela `cotacao` + opções), com os endereços já
  resolvidos, para o frete não precisar geocodificar de novo.

### `GET /api/cotacoes/{id}` → 200

Devolve a cotação (útil para a tela). 404 se não existe.

### `POST /api/fretes` (alterado) → 201

```json
{
  "clienteId": "…",
  "cotacaoId": "…",
  "tipoVeiculo": "CARRETO",
  "nomeDestinatario": "Maria",
  "telefoneDestinatario": "11988887777"
}
```

- Saem do pedido: `coleta`, `entrega`, `descricaoCarga`, `pesoKg`, `valor`, `dataColeta` — tudo vem da cotação.
- 404 cotação inexistente; 422 se ela **venceu** ("Cotação expirada, faça uma nova");
  422 se `tipoVeiculo` não está entre as opções; 422 se `clienteId` ≠ cliente da cotação;
  409 se a cotação **já virou frete** (uma cotação gera no máximo um frete).
- O frete grava `categoria`, `tipoVeiculo`, `valor` (da opção escolhida) e `cotacao_id`.

### `POST /api/fretes/{id}/aceite` (alterado)

- 422 se `motorista.tipoVeiculo ≠ frete.tipoVeiculo`
  ("Este frete pede Carreto; seu veículo é Carro").

### `GET /api/fretes` (alterado)

- Novo filtro opcional `tipoVeiculo`, para o freteiro ver só o que pode aceitar.

### `FreteResponse` (alterado)

- Novos campos: `categoria`, `tipoVeiculo`, `cotacaoId`.
- `motorista` ganha `telefone` e `whatsappUrl` (`https://wa.me/55<DDD+número só dígitos>`),
  **preenchidos só quando o status é `ACEITO` ou `EM_TRANSITO`**; nos demais, `null`.

## Integração com o trabalho de feriado (feito em outra sessão)

Antes deste design, outra sessão começou (sem commit) um adicional de feriado:
`dataColeta`, `feriado`, `nomeFeriado`, `domingo`, `adicionalFeriado`,
`valorTotal` no `Frete`, `aceitaFeriado` no `Motorista`, a migration
`V3__data_coleta_e_feriado.sql` e a classe `AdicionalFeriado` (com TODO).
Aprovado pelo dono do produto:

- **Fica:** `dataColeta`, `feriado`, `nomeFeriado`, `domingo` (agora vindos da
  cotação), `aceitaFeriado` do motorista, o endpoint de preferências, a regra
  "motorista que não aceita feriado não pega frete de feriado", e a V3 como está.
- **Sai:** `AdicionalFeriado`, `adicionalFeriado`, `valorTotal`,
  `Frete.registrarFeriado(nome, percentual)` e `fretai.frete.adicional-feriado-percentual`.
  O feriado agora é um multiplicador da cotação.
- As migrations deste design começam na **V4**.

## Banco (migrations V4–V6)

- V4 — `motorista.tipo_veiculo`: UPDATE de UTILITARIO/VAN → CARRETO, MOTO → CARRO.
- V5 — `cotacao`: id, cliente_id, categoria, peso_kg, descricao_carga, data_coleta,
  feriado, nome_feriado, endereços de
  coleta/entrega (mesmas colunas de `frete`, com coordenadas), distancia_km,
  distancia_estimada, multiplicador, motivo_multiplicador, criada_em, valida_ate, usada (boolean).
- `cotacao_opcao`: cotacao_id, tipo_veiculo, valor (PK composta).
- V6 — `frete`: + `cotacao_id` (FK, nulável para fretes antigos), + `categoria`, + `tipo_veiculo`
  (nuláveis para fretes antigos); − `adicional_feriado`, − `valor_total`.
  Frete antigo sem `tipo_veiculo` pode ser aceito por qualquer veículo.

## Onde fica no código

Dentro do módulo `frete` (`frete.api`, `frete.application`, `frete.domain`,
`frete.infra`). Decisão minha: um módulo `cotacao` separado criaria ciclo com
`frete` (a cotação usa `EnderecoFrete` e o frete usa a cotação), e o
`ArquiteturaTest` proíbe ciclos entre módulos.

- `domain`: `CategoriaCarga` (limite de peso + veículos), `Cotacao` (entidade,
  com `estaValida(Instant)` e `marcarComoUsada()`), `TabelaPreco` (cálculo puro,
  sem Spring, testável com números fixos), `Multiplicador`.
- `application`: `CotacaoService` (orquestra endereço, rota, feriado e preço).
- `infra`: `PrecoProperties` (`@ConfigurationProperties`) e `PrecoConfig`, que monta a `TabelaPreco`.
- `frete`: `FreteService.solicitar` passa a receber a cotação; `Frete.aceitar`
  troca `suporta(peso)` pela comparação de tipo de veículo.
- O relógio entra por um `Clock` injetado, para testar fim de semana/noite/validade.

## Testes esperados

- `TabelaPreco`: fórmula, mínimo, arredondamento, cada multiplicador e "vale o maior".
- `CategoriaCarga`: peso no limite, acima do limite com sugestão de categoria.
- `Cotacao`: validade (antes/depois de 15 min), uso único.
- `CotacaoService`: endereço sem coordenada → 422; feriado indisponível → segue sem multiplicador.
- Fluxo de integração: cotar → criar frete → aceitar com veículo errado (422) → certo (200, com `whatsappUrl`).
- Ajustar testes existentes que usam `TipoVeiculo.VAN`/`UTILITARIO` e o campo `valor`.

## Decisões minhas (para revisar)

1. Limites de peso das 4 categorias e quais veículos cada uma oferece.
2. Van/furgão agrupados em `CARRETO`.
3. Multiplicadores não se somam; vale o maior. Valores iniciais 1,15 / 1,20 / 1,20.
   Noturno só para coleta no mesmo dia pedida entre 22h e 6h.
4. Valores de taxa/km/mínimo de exemplo (Carreto usa os R$ 3,27/km mencionados).
5. Cotação sem localização no mapa é recusada.
6. Migração MOTO → CARRO.
7. Feriado indisponível não bloqueia a cotação (o trabalho anterior devolvia 503;
   mantive o que foi aprovado aqui — o cliente ainda recebe preço, só sem o adicional).
8. Cotação e frete ficam no módulo `frete`.
