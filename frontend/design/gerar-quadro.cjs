// Gera o quadro de design do Fretaí: um HTML único, com o CSS real do app, fontes embutidas
// e as telas reais capturadas do modo demo em iframes (cada um na largura certa, então as
// media queries do app funcionam como no aparelho).
const fs = require("fs");
const path = require("path");
// Uso: npm run quadro. As capturas em design/capturas vêm do modo demo (npm run demo).
const FRONT = path.resolve(__dirname, "..");
const S = path.join(__dirname, "capturas");
const ler = (p) => fs.readFileSync(p, "utf8");

const telas = JSON.parse(ler(path.join(S, "telas.json")));
const pecas = JSON.parse(ler(path.join(S, "pecas.json")));
const alturasArq = path.join(S, "alturas.json");
const alturas = fs.existsSync(alturasArq) ? JSON.parse(ler(alturasArq)) : {};

// ---------- fontes ----------
const fs_ = path.join(FRONT, "node_modules/@fontsource");
const fontes = [
  ["Barlow", 400, "barlow/files/barlow-latin-400-normal.woff2"],
  ["Barlow", 500, "barlow/files/barlow-latin-500-normal.woff2"],
  ["Barlow", 600, "barlow/files/barlow-latin-600-normal.woff2"],
  ["Barlow Semi Condensed", 600, "barlow-semi-condensed/files/barlow-semi-condensed-latin-600-normal.woff2"],
  ["Barlow Semi Condensed", 700, "barlow-semi-condensed/files/barlow-semi-condensed-latin-700-normal.woff2"],
  ["JetBrains Mono", 500, "jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2"],
];
const cssFontes = fontes
  .map(([f, w, arq]) => `@font-face{font-family:"${f}";font-style:normal;font-display:block;font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(fs_, arq)).toString("base64")}) format("woff2")}`)
  .join("\n");

// ---------- CSS do app ----------
const st = (n) => ler(path.join(FRONT, "src/styles", n));
let cssApp = [st("tokens.css"), st("base.css"), st("componentes.css"), st("telas.css")].join("\n");
// Tema escuro também por classe, para mostrar os dois temas lado a lado na mesma página.
cssApp = cssApp.replace(':root[data-tema="escuro"] {', ':root[data-tema="escuro"], .tema-escuro {');

// ---------- contraste (WCAG 2.x) ----------
const lum = (hex) => {
  const c = hex.replace("#", "").match(/../g).map((x) => parseInt(x, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return ((x + 0.05) / (y + 0.05)).toFixed(2); };
const tok = (bloco, nome) => (bloco.match(new RegExp(`--cor-${nome}:\\s*(#[0-9A-Fa-f]{6})`)) || [])[1];
const tokens = st("tokens.css");
const blocoClaro = tokens.split(':root[data-tema="escuro"]')[0];
const blocoEscuro = tokens.split(':root[data-tema="escuro"]')[1].split("@media")[0];
const cor = (tema, nome) => (tema === "escuro" ? tok(blocoEscuro, nome) || tok(blocoClaro, nome) : tok(blocoClaro, nome));

const CORES = [
  ["fundo", "Fundo da página", null],
  ["superficie", "Campo, barra fixa, folha de negociação", null],
  ["linha", "Divisória fina", null],
  ["texto", "Tinta: texto e ação principal", "fundo"],
  ["texto-secundario", "Apoio, legenda, metadado", "fundo"],
  ["garantido", "Só dinheiro garantido ou liberado", "fundo"],
  ["alerta", "Fretão, abaixo do piso", "fundo"],
  ["perigo", "Cancelado, erro", "fundo"],
  ["info", "Link, aberto, foco no claro", "fundo"],
  ["asfalto", "Pista da linha de rota", null],
  ["faixa", "Tracejado e km da rota. Mais nada.", "asfalto"],
];
const linhaCor = (tema, [nome, uso, contra]) => {
  const hex = cor(tema, nome);
  const r = contra ? `${contraste(hex, cor(tema, contra))}<span class="q-sob">sobre ${contra}</span>` : "";
  return `<li class="q-cor"><span class="q-amostra" style="background:${hex}"></span><span class="q-cor__nome">${nome}</span><code class="q-cor__hex">${hex}</code><span class="q-cor__uso">${uso}</span><span class="q-cor__razao">${r}</span></li>`;
};
const paleta = (tema) => `<ul class="q-cores">${CORES.map((c) => linhaCor(tema, c)).join("")}</ul>`;

// ---------- telas em iframe ----------
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const limpa = (html) => html.replace(/<div class="faixa-demo"[\s\S]*?<\/div>/, "").replace(/<p class="faixa-demo"[\s\S]*?<\/p>/, "");
// No quadro nada navega: os links do app apontariam para rotas que não existem aqui.
const cssQuadroFrame = "a,button,input,select,textarea,label{pointer-events:none}";
const docTela = (chave, tema) => `<!DOCTYPE html><html lang="pt-BR" data-tema="${tema}"><head><meta charset="utf-8"><style>${cssFontes}\n${cssApp}\n${cssQuadroFrame}</style></head><body><div id="root">${limpa(telas[chave])}</div></body></html>`;

let nFrame = 0;
const tela = (chave, tema, largura, escala, legenda) => {
  const id = `t${nFrame++}`;
  const alt = alturas[id] || (largura < 600 ? 1400 : 1100);
  return `<figure class="q-tela" style="--w:${largura}px;--h:${alt}px;--s:${escala}">
  <div class="q-tela__moldura${largura < 600 ? " q-tela__moldura--celular" : ""}"><iframe id="${id}" title="${esc(legenda)}" loading="lazy" tabindex="-1" srcdoc="${esc(docTela(chave, tema))}"></iframe></div>
  <figcaption>${legenda}</figcaption></figure>`;
};

// ---------- peças ----------
const lado = (titulo, html, pilha) => `<div class="q-par${pilha ? " q-par--pilha" : ""}">
  <div class="q-par__lado"><p class="q-rotulo">Claro</p>${html}</div>
  <div class="q-par__lado tema-escuro"><p class="q-rotulo">Escuro</p>${html}</div>
</div>`;
const prop = (telas.detalheE0.match(/<article class="proposta[^"]*"[\s\S]*?<\/article>/) || [pecas.proposta])[0]
  .replace('<p class="proposta__destaques"></p>', '<p class="proposta__destaques"><span class="proposta__destaque">Menor valor</span></p>')
  .replace("Carregando reputação…", "★ 4,9 · 212 fretes · 98% entregues no prazo");

const avisos = [
  ["garantido", "Pagamento garantido.", "A empresa já pagou. O dinheiro está guardado até a entrega."],
  ["info", "Proposta enviada.", "A empresa tem até 24 horas para responder."],
  ["alerta", "Valor muito acima da média desta rota.", "Golpe comum: valor alto para atrair motorista. Confira a empresa antes de carregar."],
  ["perigo", "Frete cancelado", "O frete foi cancelado antes da viagem."],
].map(([t, a, b]) => `<div class="aviso aviso--${t}"><p class="aviso__titulo">${a}</p><p class="aviso__texto">${b}</p></div>`).join("");

const botoes = `<div class="q-linha">
  <button type="button" class="botao botao--primario">Aceitar por R$ 4.850</button>
  <button type="button" class="botao botao--secundario">Fazer proposta</button>
  <button type="button" class="botao botao--fantasma">Recusar</button>
  <button type="button" class="botao botao--perigo">Cancelar frete</button>
  <button type="button" class="botao botao--primario" disabled>Aceitar</button>
</div>`;

const etiquetas = `<div class="q-linha">${[...new Set(pecas.etiquetas)].join("")}${pecas.selos[0]}</div>`;
const tabelaMini = `<div class="tabela-rolagem cartao"><table class="tabela"><thead><tr><th scope="col">Rota</th><th scope="col">Coleta</th><th scope="col" class="tabela__num">Valor</th><th scope="col">Situação</th></tr></thead><tbody>
<tr><td><div class="tabela__rota-cel"><a class="tabela__rota">Campinas/SP → Rio de Janeiro/RJ</a>${pecas.km}</div></td><td>09 de nov.</td><td class="tabela__num">R$ 4.850</td><td><span class="etiqueta etiqueta--faixa">Com propostas</span></td></tr>
<tr><td><div class="tabela__rota-cel"><a class="tabela__rota">Jundiaí/SP → Curitiba/PR</a><span class="km">410&nbsp;km</span></div></td><td>05 de nov.</td><td class="tabela__num">R$ 5.300</td><td><span class="etiqueta etiqueta--faixa">Em trânsito</span></td></tr>
</tbody></table></div>`;

// ---------- quadro ----------
const css = `
${cssFontes}
${cssApp}
/* ---------- só o quadro ---------- */
body.q { padding: 0; }
.q-pagina { max-width: 1240px; margin: 0 auto; padding: var(--esp-12) var(--esp-6) 96px; }
.q-cabeca { display: grid; gap: var(--esp-4); padding-bottom: var(--esp-8); }
.q-cabeca__sobre { display: flex; flex-wrap: wrap; gap: var(--esp-2) var(--esp-6); color: var(--cor-texto-secundario); font-size: var(--tam-detalhe); }
.q-titulo { font-family: var(--fonte-placa); font-weight: var(--peso-placa); font-size: var(--tam-display); line-height: var(--altura-titulo); max-width: 18ch; }
.q-heroi { padding: var(--esp-12) 0; border-top: var(--borda) solid var(--cor-linha); border-bottom: var(--borda) solid var(--cor-linha); }
.q-heroi .rota { max-width: none; }
.q-sec { padding-top: var(--esp-12); display: grid; gap: var(--esp-6); }
.q-sec + .q-sec { margin-top: var(--esp-12); border-top: var(--borda) solid var(--cor-linha); }
.q-sec__cabeca { display: grid; grid-template-columns: 4ch minmax(0, 1fr); gap: var(--esp-4); align-items: baseline; }
.q-sec__n { font-family: var(--fonte-mono); font-size: var(--tam-detalhe); color: var(--cor-texto-secundario); }
.q-sec__titulo { font-size: var(--tam-secao); }
.q-sec__nota { grid-column: 2; color: var(--cor-texto-secundario); max-width: 64ch; }
.q-corpo { padding-left: calc(4ch + var(--esp-4)); display: grid; gap: var(--esp-8); }
.q-rotulo { font-size: var(--tam-legenda); color: var(--cor-texto-secundario); text-transform: uppercase; letter-spacing: 0.08em; font-weight: var(--peso-medio); }
.q-regras { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--esp-8); counter-reset: r; }
.q-regras li { display: grid; gap: var(--esp-2); align-content: start; }
.q-regras b { font-family: var(--fonte-placa); font-weight: var(--peso-placa); font-size: var(--tam-bloco); line-height: var(--altura-titulo); }
.q-regras span { color: var(--cor-texto-secundario); }
.q-par { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.q-par__lado { display: grid; gap: var(--esp-6); align-content: start; padding: var(--esp-8); background: var(--cor-fundo); color: var(--cor-texto); border: var(--borda) solid var(--cor-linha); }
.q-par__lado + .q-par__lado { border-left: 0; }
.q-par--pilha { grid-template-columns: minmax(0, 1fr); }
.q-par--pilha .q-par__lado + .q-par__lado { border-left: var(--borda) solid var(--cor-linha); border-top: 0; }
.q-par + .q-par { margin-top: var(--esp-8); }
.q-linha { display: flex; flex-wrap: wrap; gap: var(--esp-3) var(--esp-4); align-items: center; }
.q-pilha { display: grid; gap: var(--esp-6); }
.q-cores { display: grid; }
.q-cor { display: grid; grid-template-columns: 40px 16ch 9ch minmax(0, 1fr) 13ch; gap: var(--esp-3); align-items: center; padding: var(--esp-2) 0; border-bottom: var(--borda) solid var(--cor-linha); font-size: var(--tam-detalhe); }
.q-amostra { width: 40px; height: 28px; border-radius: var(--raio-campo); box-shadow: inset 0 0 0 var(--borda) var(--cor-linha); }
.q-cor__nome { font-weight: var(--peso-medio); }
.q-cor__hex { font-size: var(--tam-legenda); color: var(--cor-texto-secundario); }
.q-cor__uso { color: var(--cor-texto-secundario); }
.q-cor__razao { font-family: var(--fonte-mono); text-align: right; display: grid; }
.q-sob { font-family: var(--fonte-texto); font-size: var(--tam-legenda); color: var(--cor-texto-secundario); }
.q-tipos { display: grid; }
.q-tipo { display: grid; grid-template-columns: 30ch minmax(0, 1fr); gap: var(--esp-6); align-items: center; padding: var(--esp-4) 0; border-bottom: var(--borda) solid var(--cor-linha); }
.q-tipo__meta { font-size: var(--tam-detalhe); color: var(--cor-texto-secundario); display: grid; }
.q-tipo__meta code { font-size: var(--tam-legenda); }
.q-esp { display: grid; gap: var(--esp-2); }
.q-esp li { display: grid; grid-template-columns: 9ch 6ch minmax(0, 1fr); gap: var(--esp-3); align-items: center; font-size: var(--tam-detalhe); }
.q-esp__barra { height: 12px; background: var(--cor-texto); }
.q-telas { display: flex; flex-wrap: wrap; gap: var(--esp-12) var(--esp-8); align-items: flex-start; }
.q-tela { margin: 0; display: grid; gap: var(--esp-3); }
.q-tela__moldura { width: calc(var(--w) * var(--s)); height: calc(var(--h) * var(--s)); overflow: hidden; border: var(--borda) solid var(--cor-linha); border-radius: var(--raio-campo); }
.q-tela__moldura--celular { border-radius: var(--raio-sheet); }
.q-tela iframe { display: block; border: 0; width: var(--w); height: var(--h); transform: scale(var(--s)); transform-origin: 0 0; }
.q-tela figcaption { font-size: var(--tam-detalhe); color: var(--cor-texto-secundario); max-width: calc(var(--w) * var(--s)); }
.q-pista-demo { max-width: 46ch; }
.q-pe { margin-top: 96px; padding-top: var(--esp-6); border-top: var(--borda) solid var(--cor-linha); font-size: var(--tam-detalhe); color: var(--cor-texto-secundario); display: grid; gap: var(--esp-2); }
@media (max-width: 900px) {
  .q-regras, .q-par { grid-template-columns: minmax(0, 1fr); }
  .q-par__lado + .q-par__lado { border-left: var(--borda) solid var(--cor-linha); border-top: 0; }
  .q-corpo { padding-left: 0; }
  .q-cor { grid-template-columns: 32px minmax(0, 1fr) 9ch; }
  .q-cor__uso, .q-cor__razao .q-sob { display: none; }
  .q-tipo { grid-template-columns: minmax(0, 1fr); gap: var(--esp-2); }
}
`;

const sec = (n, titulo, nota, corpo) => `<section class="q-sec" aria-labelledby="s${n}">
  <div class="q-sec__cabeca"><span class="q-sec__n">${String(n).padStart(2, "0")}</span><h2 id="s${n}" class="q-sec__titulo">${titulo}</h2>${nota ? `<p class="q-sec__nota">${nota}</p>` : ""}</div>
  <div class="q-corpo">${corpo}</div>
</section>`;

const TIPOS = [
  ["display", "Display", "40 / 56", "placa 700", "Frete garantido"],
  ["titulo", "Título da página, H1", "28 / 36", "placa 700", "Frete de Campinas para Rio de Janeiro"],
  ["secao", "Seção, H2", "22 / 28", "placa 700", "Propostas recebidas"],
  ["bloco", "Bloco, H3", "18 / 22", "placa 700", "João Batista Ferreira"],
  ["corpo", "Corpo", "16", "texto 400", "O adiantamento cai quando você sai com a carga."],
  ["detalhe", "Detalhe", "14", "texto 400", "a 6 km de você · coleta 09 de nov."],
  ["legenda", "Legenda", "12", "texto 400", "Calculado com coeficientes de exemplo."],
];
const tipos = `<div class="q-tipos">${TIPOS.map(([t, nome, px, fam, ex]) => {
  const placa = fam.startsWith("placa");
  return `<div class="q-tipo"><span class="q-tipo__meta"><span>${nome}</span><code>--tam-${t} · ${px} px · ${fam}</code></span><span style="font-size:var(--tam-${t});${placa ? "font-family:var(--fonte-placa);font-weight:var(--peso-placa);line-height:var(--altura-titulo)" : ""}">${ex}</span></div>`;
}).join("")}
<div class="q-tipo"><span class="q-tipo__meta"><span>Mono</span><code>--fonte-mono · placa, Pix, km</code></span><span style="font-family:var(--fonte-mono)">ABC1D23 · 00020126580014br.gov.bcb.pix</span></div></div>`;

const ESP = [1, 2, 3, 4, 6, 8, 12];
const espacos = `<ul class="q-esp">${ESP.map((n) => `<li><code>--esp-${n}</code><span>${n * 4} px</span><span class="q-esp__barra" style="width:var(--esp-${n})"></span></li>`).join("")}</ul>
<p class="q-sec__nota" style="grid-column:auto">Raio: 4 px em campo e botão, 12 px na folha de negociação. Nenhuma sombra. Alvo de toque: 48 px no motorista, 40 px na empresa.</p>`;

let html = `<!DOCTYPE html>
<html lang="pt-BR" data-tema="claro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fretaí · sistema de design</title>
<style>${css}</style>
</head>
<body class="q">
<main class="q-pagina">
  <header class="q-cabeca">
    <p class="marca">Fretaí</p>
    <h1 class="q-titulo">Frete com pagamento garantido, desenhado como folha.</h1>
    <p class="q-cabeca__sobre"><span>Sistema de design do front-end web</span><span>Rota “Folha”, v2</span><span>7 de nov. de 2026</span></p>
  </header>

  <div class="q-heroi">${pecas.rotaGrande}</div>

  ${sec(1, "Três regras", "Tudo o mais sai delas. O pedido foi minimalista: ficaram as fontes e a linha de rota com km.", `
  <ol class="q-regras">
    <li><b>Tinta sobre fundo.</b><span>Sem caixa, sem sombra, sem fundo tingido. Seções se separam por espaço e por uma linha fina.</span></li>
    <li><b>Amarelo só na rota.</b><span>O tracejado e o km da linha de rota são a única coisa amarela da tela. A ação principal é tinta cheia.</span></li>
    <li><b>Estado é palavra colorida.</b><span>Cor só no texto. Verde só para dinheiro garantido ou liberado, nunca como decoração.</span></li>
  </ol>`)}

  ${sec(2, "Assinatura: a linha de rota", "Asfalto com tracejado amarelo e o km no meio. Inteira no card e no detalhe; em miniatura nas listas; vertical no login, explicando o caminho do dinheiro.", lado("", `
    ${pecas.rotaGrande}
    <div class="q-pilha"><p class="q-rotulo">Na lista</p>${tabelaMini}</div>
    <div class="q-pilha"><p class="q-rotulo">No login</p><div class="q-pista-demo">${pecas.passos}</div></div>`, true))}

  ${sec(3, "Cor", "Contraste WCAG calculado a partir de tokens.css no momento em que este quadro foi gerado. Texto pede 4.5; o menor par aqui passa disso.", `
  <div class="q-par"><div class="q-par__lado"><p class="q-rotulo">Claro, padrão da empresa</p>${paleta("claro")}</div><div class="q-par__lado tema-escuro"><p class="q-rotulo">Escuro, padrão do motorista</p>${paleta("escuro")}</div></div>`)}

  ${sec(4, "Tipo", "Barlow, a família das placas de rodovia, para tudo. Semi Condensed nos títulos. JetBrains Mono para placa, código Pix e km. O primeiro número é celular; o segundo, a partir de 1024 px.", tipos)}

  ${sec(5, "Espaço", "Grade de 4 px, só com os degraus que o briefing lista.", espacos)}

  ${sec(6, "Componentes", "Marcação real do app, nos dois temas.", lado("", `
    <div class="q-pilha"><p class="q-rotulo">Botões</p>${botoes}</div>
    <div class="q-pilha"><p class="q-rotulo">Campo</p><div style="max-width:var(--largura-formulario)">${pecas.campo}</div></div>
    <div class="q-pilha"><p class="q-rotulo">Situação</p>${etiquetas}</div>
    <div class="q-pilha"><p class="q-rotulo">Dinheiro e piso</p><div class="q-linha">${pecas.valor[0]}${pecas.chipPiso.join("")}</div></div>
    <div class="q-pilha"><p class="q-rotulo">Placa e km</p><div class="q-linha">${pecas.placa}${pecas.km}</div></div>
    <div class="q-pilha"><p class="q-rotulo">Avisos</p>${avisos}</div>
    <div class="q-pilha"><p class="q-rotulo">Filtros</p>${pecas.filtros}</div>
    <div class="q-pilha"><p class="q-rotulo">Proposta, no comparador</p><div style="max-width:var(--largura-proposta)">${prop}</div></div>
    <div class="q-pilha"><p class="q-rotulo">Card de frete</p>${pecas.card.replace(/<a class="card-frete__link"[\s\S]*?<\/a>/, "")}</div>`) + lado("", `<div class="q-pilha"><p class="q-rotulo">Marcos da viagem</p>${pecas.marcosV}</div>`, true))}

  ${sec(7, "Motorista, no celular", "390 px, mostrado a 85%. Escuro é o padrão: cabine, noite, bateria.", `
  <div class="q-telas">
    ${tela("busca", "escuro", 390, 0.85, "Fretes perto de você · escuro")}
    ${tela("freteM0", "escuro", 390, 0.85, "Detalhe do frete, em negociação · escuro")}
    ${tela("busca", "claro", 390, 0.85, "Fretes perto de você · claro")}
    ${tela("freteM2", "claro", 390, 0.85, "Detalhe do frete, aberto · claro")}
    ${tela("meusFretes", "escuro", 390, 0.85, "Meus fretes, com o km nas listas · escuro")}
    ${tela("entrar", "escuro", 390, 0.85, "Entrar, com a pista vertical · escuro")}
    ${tela("extrato", "escuro", 390, 0.85, "Extrato, a receber e recebidos por mês · escuro")}
  </div>`)}

  ${sec(8, "Empresa, no escritório", "1280 px, mostrado a 75%. Claro é o padrão: várias abas, tabela, comparador lado a lado.", `
  <div class="q-telas">
    ${tela("fretesE", "claro", 1280, 0.75, "Fretes, tabela com o km em miniatura · claro")}
    ${tela("detalheE0", "claro", 1280, 0.75, "Detalhe com propostas, comparador · claro")}
    ${tela("detalheE1", "claro", 1280, 0.75, "Detalhe em trânsito, marcos da viagem · claro")}
    ${tela("detalheE0", "escuro", 1280, 0.75, "Detalhe com propostas · escuro")}
    ${tela("pagamentosE", "claro", 1280, 0.75, "Pagamentos, com centavos · claro")}
    ${tela("dadosE", "claro", 1280, 0.75, "Dados da empresa · claro")}
    ${tela("entrar", "claro", 1280, 0.75, "Entrar · claro")}
  </div>`)}

  ${sec(9, "Cliente pessoa física, no celular", "390 px, mostrado a 85%. Entrada secundária: um cartão por frete, com o próximo passo, e alvo de 48 px. Claro é o padrão.", `
  <div class="q-telas">
    ${tela("fretesC", "claro", 390, 0.85, "Seus fretes, com o próximo passo · claro")}
    ${tela("detalheC", "claro", 390, 0.85, "Frete com propostas e o resumo do pedido · claro")}
    ${tela("pedirC", "claro", 390, 0.85, "Pedir frete · claro")}
    ${tela("cadastro", "claro", 390, 0.85, "Criar conta, com a entrada de pessoa física · claro")}
  </div>`)}

  ${sec(10, "Administrador, no escritório", "1280 px, mostrado a 75%. Três filas, na ordem do que trava dinheiro. Ação sem volta pede confirmação ou motivo.", `
  <div class="q-telas">
    ${tela("documentosA", "claro", 1280, 0.75, "Documentos, com a recusa aberta · claro")}
    ${tela("contestacoesA", "claro", 1280, 0.75, "Contestação, com a prova da entrega ao lado · claro")}
    ${tela("pisoA", "claro", 1280, 0.75, "Piso ANTT · claro")}
  </div>`)}

  <footer class="q-pe">
    <p>Gerado a partir do código: o CSS é o de src/styles, as telas são o HTML do modo demo (dados de exemplo).</p>
    <p>Valores em src/styles/tokens.css. Decisões e desvios do briefing em frontend/anti-slop-brief.md.</p>
  </footer>
</main>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, "fretai-design.html"), html);
console.log("ok", (html.length / 1024).toFixed(0) + " KB", nFrame + " telas");
