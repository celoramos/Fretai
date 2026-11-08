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

**Folha** (tomada, substitui "Placa"; em 2026-11-07 o app trocou as linhas finas por cartões, ver "App logado"): a linha de rota, uma faixa de asfalto com tracejado amarelo e o km no meio, continua como assinatura, e agora é a única coisa amarela da tela. Ela aparece inteira no card e no detalhe de cada frete. Nas listas aparece em miniatura, só o marco de km sobre asfalto. No login, vira a pista vertical que explica o caminho do dinheiro (km 0, saída, entrega). Também está no ícone. O resto é tipografia e espaço:

- a ação principal é tinta cheia;
- estado é ponto e palavra;
- seções se separam por uma linha fina;
- placa, marcos e etiquetas perderam o desenho e ficaram só com o conteúdo.

Movimento (Motion, motion.dev): só onde conta algo. A pista abre da origem ao destino e o km aparece no meio do caminho. No login, a pista desce e as etapas entram em ordem. O indicador do que está escolhido desliza até a nova escolha, as listas chegam em cascata e o medidor enche na ordem do dinheiro. Nada fica em loop e nenhum número "conta". Com movimento reduzido no sistema, tudo aparece pronto. Os valores estão em `src/movimento.ts`.

Não tomadas:
- **Placa** (a anterior): sinalização como moldura, com placa Mercosul desenhada, marcos de km em asfalto, etiquetas e avisos com fundo colorido e cards. O dono do produto achou carregado.
- **Só tipografia:** a rota também viraria uma linha fina com o km. Foi descartada porque o dono do produto pediu para manter a linha de rota como está.

## Página pública (2026-11-07)

Pedido do dono do produto: um site atraente e fácil de entender, simples mas com informação suficiente, com os apps de entrega e corrida (iFood, Uber, 99) como referência e as mesmas cores. Isso muda a raiz 3 só na página pública: lá o conteúdo vive em cartões arredondados, a ação principal é pílula e há sombra no claro (Departure em `tokens.css`). O app logado seguiu no mesmo dia (seção abaixo).

Das referências vieram padrões, não a cara: a escolha de público no topo ("Sou motorista" / "Tenho carga"), a ação grande logo abaixo do título, o produto mostrado funcionando ao lado (um frete e um pagamento de exemplo, marcados "Exemplo") e as dúvidas em lista que abre. A assinatura continua a pista: em "Como o dinheiro anda" ela se desenha conforme a rolagem (GSAP, ScrollTrigger), parando em km 0, saída e entrega.

Logo: a carreta-pista do dono do produto (2026-11-07), símbolo sem nome, em `src/components/Marca.tsx` e `design/marca/`. O nome ao lado é texto provisório.

Colisão, testada contra a página de uma vitrine de fretes: foto de caminhão na abertura, números de tração ("+ de 500 mil motoristas"), três cartões com ícone e azul. Respostas: sem foto, a abertura é um frete de exemplo; nenhum número de tração, porque não existe nenhum; os cartões são quatro, um por proteção do inventário, cada um mostrando o pedaço real da interface no lugar de ícone.

## App logado (2026-11-07)

O motorista e a empresa passaram para o desenho da página pública, para quem entra não sentir que trocou de produto. Da Folha ficou a assinatura (rota em asfalto, km, placa) e a regra de cor: amarelo só na rota, estado só no texto. Mudou o resto:

- cada frete da busca, cada item de "Meus fretes", cada bloco do detalhe, cada proposta, o pagamento e a tabela da empresa vivem num cartão (superfície, raio 16, sombra no claro e contorno no escuro);
- todo botão, filtro e seletor de raio é pílula; campo de texto e select têm raio 12;
- a barra de baixo do motorista ganhou ícone acima do rótulo, como nos apps de entrega;
- pista, marco de km, placa e código Pix ficam com canto de 4, porque imitam sinalização.

Os contrastes sobre o cartão estão calculados em `tokens.css`.

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
- A empresa usa navegação no topo, não lateral. Motivo: são três seções (Fretes, Pagamentos, Empresa), e a tabela de fretes precisa da largura inteira.
- O status `ACEITO`, para quem contratou, diz "Fechado com o motorista", não "Motorista a caminho da coleta". Motivo: no aceite o Pix ainda pode estar por pagar, e sem ele o motorista não sai.

## Telas do fluxo inteiro (2026-11-08)

Pedido do dono do produto: o melhor front possível para o sistema. O que faltava era o fluxo andar de ponta a ponta sem sair do app, então as telas novas seguem a ordem do dinheiro e usam o desenho que já existia (cartão, pílula, rota):

- empresa: publicar frete, "Precisa de você" (Pix, propostas e entregas paradas), aba Entrega com o canhoto e a contestação, avaliar o motorista, cancelar;
- motorista: registrar a entrega (foto, assinatura com o dedo em papel branco, GPS conferido contra os 500 m da API), ver e retirar a proposta enviada, fretes de volta, resumo do dinheiro, calculadora, perfil (chave Pix, caminhões, base dos avisos, feriado), avaliar a empresa, cancelar;
- os dois: documentos do motorista (ele envia e vê quem abriu; a empresa abre por link temporário);
- pública: contestar a entrega com o código do recebedor.

A barra de baixo do motorista passou a ter quatro destinos (Fretes, Meus fretes, Calculadora, Perfil). Verde continua só no dinheiro garantido ou pago: a sobra da calculadora fica na tinta, a falta em vermelho.

## O resto do sistema (2026-11-08)

O que ainda faltava, no mesmo desenho:

- empresa: editar o frete enquanto não há proposta (o mesmo formulário de publicar, preenchido), Pagamentos e Dados da empresa na barra de cima;
- motorista: extrato, a partir do resumo do dinheiro em Meus fretes;
- administrador: três filas (documentos, contestações, piso ANTT), na largura de escritório da empresa.

Três decisões que valem para todas:

- formulário preenchido pergunta antes de sair, por qualquer caminho (data router e <dialog>);
- extrato e pagamentos mostram centavos, porque ali a soma tem de bater com as linhas; o resto do app continua com o valor redondo;
- ação sem volta na API (verificar documento, decidir contestação) pede confirmação, e o botão diz o que move ("Liberar o saldo").

## O cliente pessoa física e a recusa de documento (2026-11-08)

O cliente pessoa física pede um frete avulso: uma mudança, uma entrega. Decisões:

- entrada secundária, como pede o briefing: uma linha abaixo da ação da empresa na página inicial e um botão abaixo dos dois perfis no cadastro;
- uma coluna de cartões, um por frete, com o próximo passo escrito no fim de cada um; o que espera pelo cliente vem primeiro, e a barra fica sem navegação, porque é um lugar só;
- alvo de toque de 48 px, o do motorista: quem pede frete avulso está no celular;
- o formulário pede o que o motorista precisa para decidir e quem recebe (é quem assina o canhoto); sem tipo de caminhão nem carga ANTT, que quem faz uma mudança não sabe;
- o detalhe do frete é o mesmo da empresa, com o resumo do pedido e o adicional de feriado escrito, porque ele entra no valor sem o cliente digitar.

Recusar documento: o motivo é o passo deliberado, e sem motivo não se recusa. O motorista lê o motivo junto do documento; quem contratou não vê o arquivo recusado.

## Fora deste corte

A tela de dados do cliente, porque a API ainda não lê nem edita o cadastro dele. A navegação mostra só o que existe.
