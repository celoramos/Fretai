# Brief do front-end Fretaí

Data: 2026-11-06, revisto no mesmo dia. Os valores ficam em `src/styles/tokens.css`; este arquivo guarda o que não tem outro lugar.

## As quatro raízes

As raízes 1, 2 e 4 foram lidas de `docs/briefing-design-figma.md`. A raiz 3 foi revista a pedido do dono do produto.

1. **Produto.** Marketplace de frete com pagamento garantido antes de carregar. A empresa paga por Pix no aceite, o valor fica retido, o adiantamento sai na saída e o saldo sai com o canhoto (foto, assinatura, GPS a até 500 m). Piso ANTT em todo frete, alerta de "fretão", reputação dos dois lados (inclui "% de saldos pagos em dia").
2. **Voz.** Fala como o caminhoneiro fala, sem jargão financeiro. Teste de cada frase: o João (47 anos, carreteiro, na cabine) entende em 2 segundos? "Pagamento garantido", não "escrow ativo".
3. **Temperatura.** Minimalista, por pedido do dono do produto, que manteve as fontes e a linha de rota com km. Tinta sobre fundo, sem caixas nem fundos tingidos. O amarelo aparece só na linha de rota. Cor de estado só no texto, e verde só para dinheiro garantido ou liberado.
4. **Densidade.** Motorista: uma coluna, pouca coisa por tela, alvo de 48 px, escuro por padrão. Empresa: escritório com várias abas, tabela e comparador lado a lado, claro por padrão.

## Inventário (a cópia só usa isto)

Campos dos DTOs da API (`src/api/tipos.ts`), rótulos de status da seção 6 do briefing e microcopy da seção 4. Os dados do modo demo (`src/api/demo.ts`) são de exemplo e aparecem sob a faixa "Modo demonstração". Nenhum número de tração ou depoimento foi inventado.

## Rota tomada

**Folha** (tomada, substitui "Placa"): a linha de rota, uma faixa de asfalto com tracejado amarelo e o km no meio, continua como assinatura, e agora é a única coisa amarela da tela. Ela aparece inteira no card e no detalhe de cada frete. Nas listas aparece em miniatura, só o marco de km sobre asfalto. No login, vira a pista vertical que explica o caminho do dinheiro (km 0, saída, entrega). Também está no ícone. O resto é tipografia e espaço:

- a ação principal é tinta cheia;
- estado é ponto e palavra;
- seções se separam por uma linha fina;
- placa, marcos e etiquetas perderam o desenho e ficaram só com o conteúdo.

Movimento (Motion, motion.dev): só onde conta algo. A pista abre da origem ao destino e o km aparece no meio do caminho. No login, a pista desce e as etapas entram em ordem. O indicador do que está escolhido desliza até a nova escolha, as listas chegam em cascata e o medidor enche na ordem do dinheiro. Nada fica em loop e nenhum número "conta". Com movimento reduzido no sistema, tudo aparece pronto. Os valores estão em `src/movimento.ts`.

Não tomadas:
- **Placa** (a anterior): sinalização como moldura, com placa Mercosul desenhada, marcos de km em asfalto, etiquetas e avisos com fundo colorido e cards. O dono do produto achou carregado.
- **Só tipografia:** a rota também viraria uma linha fina com o km. Foi descartada porque o dono do produto pediu para manter a linha de rota como está.

## Página pública (2026-11-07)

Pedido do dono do produto: um site atraente e fácil de entender, simples mas com informação suficiente, com os apps de entrega e corrida (iFood, Uber, 99) como referência e as mesmas cores. Isso muda a raiz 3 só na página pública: lá o conteúdo vive em cartões arredondados, a ação principal é pílula e há sombra no claro (Departure em `tokens.css`). O app logado continua na Folha até o redesenho das telas.

Das referências vieram padrões, não a cara: a escolha de público no topo ("Sou motorista" / "Tenho carga"), a ação grande logo abaixo do título, o produto mostrado funcionando ao lado (um frete e um pagamento de exemplo, marcados "Exemplo") e as dúvidas em lista que abre. A assinatura continua a pista: em "Como o dinheiro anda" ela se desenha conforme a rolagem (GSAP, ScrollTrigger), parando em km 0, saída e entrega.

Logo: provisório em `src/components/Marca.tsx` até o dono do produto mandar o definitivo.

Colisão, testada contra a página de uma vitrine de fretes: foto de caminhão na abertura, números de tração ("+ de 500 mil motoristas"), três cartões com ícone e azul. Respostas: sem foto, a abertura é um frete de exemplo; nenhum número de tração, porque não existe nenhum; os cartões são quatro, um por proteção do inventário, cada um mostrando o pedaço real da interface no lugar de ícone.

## Teste de colisão

Vizinho testado: um marketplace de frete sem garantia (vitrine de cargas), na mesma categoria do Fretebras.

| Valor | Colidiu? | Resposta |
|---|---|---|
| Fundo quase branco `#FAFAF8` e botão preto | Sim, é o molde "minimal SaaS" | Aceito: o pedido foi minimalista. A diferença fica na assinatura, que nenhum vizinho tem: a rota em asfalto com km. |
| Laranja `#C2410C` | Parecido com terracota | Fica só em alerta (fretão, abaixo do piso). Nunca é acento de marca. |
| Tabela de fretes com status | Sim, é o padrão da categoria | Mantida: a Carla compara muitos fretes, e a tabela serve a isso. |
| Azul de link | Sim | Mantido: é a placa azul de informação do briefing. |

## Aprovado

- 2026-11-07: o dono do produto aprovou a paleta dos dois temas, do jeito que está em `src/styles/tokens.css`: fundo, superfície, linha, texto, estados, asfalto e faixa. Trocar uma cor pede nova aprovação. O layout das páginas ainda vai mudar.
- O quadro visual (tokens, componentes e telas nos dois temas) sai de `npm run quadro`, em `design/fretai-design.html`. Ele usa o CSS do app e o HTML do modo demo guardado em `design/capturas/`.

## Desvios do briefing, registrados

- `cor/garantido` no claro mudou de `#00875A` para `#007A51`. Motivo: o tom original não passava sobre fundo verde, e o novo continua com o mesmo matiz.
- A ação principal saiu do amarelo e foi para a tinta. Motivo: o amarelo fica só na rota.
- A linha de rota usa asfalto escuro sob o tracejado. Motivo: amarelo sobre fundo claro não tem contraste.
- No tema escuro o asfalto vai para `#0A0C0F`, com acostamento `#4A5160` marcando a borda.
- A empresa usa navegação no topo, não lateral. Motivo: só existe uma seção por enquanto.

## Fora deste corte

Cadastros, publicar frete, carteira, perfil, canhoto (câmera, assinatura e GPS), calculadora, avaliação, admin e contestação pública. A navegação mostra só o que existe.
