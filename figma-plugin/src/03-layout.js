// ---------- moldes de tela, peças comuns, grade e estados ----------

function altura(f, h) { f.layoutSizingVertical = 'FIXED'; f.resize(f.width, h); }
function bordaLado(f, lado, cor = 'linha', w = 1) {
  f.strokes = [P(cor)];
  f.strokeAlign = 'INSIDE';
  f.strokeTopWeight = lado === 'topo' ? w : 0;
  f.strokeBottomWeight = lado === 'base' ? w : 0;
  f.strokeLeftWeight = lado === 'esq' ? w : 0;
  f.strokeRightWeight = lado === 'dir' ? w : 0;
}

async function barraStatus() {
  const f = AL('H', { nome: 'Barra de status', pad: [0, 24], just: 'SPACE_BETWEEN', alinha: 'CENTER' });
  add(f, await T('9:41', 'Pequeno/SemiBold'), await T('5G · 87%', 'Legenda/SemiBold'));
  return f;
}

function botaoIcone(nomeIcone, rotulo, borda = true) {
  const b = AL('H', { nome: rotulo || nomeIcone, just: 'CENTER', alinha: 'CENTER', r: 12, borda: borda ? 'linha' : null });
  WH(b, 48, 48);
  add(b, icone(nomeIcone, 'texto', 22));
  return b;
}

async function telaMobile(nome, o = {}) {
  const f = figma.createFrame();
  f.name = nome;
  f.layoutMode = 'VERTICAL';
  f.resize(390, 844);
  f.primaryAxisSizingMode = 'FIXED';
  f.counterAxisSizingMode = 'FIXED';
  f.fills = [P('fundo')];
  f.clipsContent = true;
  f.itemSpacing = 0;
  const sb = await barraStatus();
  add(f, sb); altura(sb, 44); fw(sb);
  if (o.titulo != null) {
    const temBotao = o.voltar || o.fechar;
    const h = AL('H', { nome: 'Cabeçalho', pad: [4, 16, 8, temBotao ? 4 : 16], gap: 8, alinha: 'CENTER' });
    add(f, h); fw(h);
    if (temBotao) add(h, botaoIcone(o.voltar ? 'voltar' : 'fechar', o.voltar ? 'Voltar' : 'Fechar', false));
    const col = AL('V', { gap: 2 });
    add(h, col); col.layoutGrow = 1;
    await TQ(col, o.titulo, 'Mobile/H2');
    if (o.sub) await TQ(col, o.sub, 'Pequeno/Regular', 'texto-secundario');
    if (o.badge) add(h, o.badge);
    for (const a of o.acoes || []) add(h, botaoIcone(a));
  }
  const body = AL('V', { nome: 'Conteúdo', pad: o.pad != null ? o.pad : [8, 16, 24, 16], gap: o.gap != null ? o.gap : 16 });
  add(f, body); fw(body); fh(body);
  body.clipsContent = true;
  body.overflowDirection = 'VERTICAL';
  let rodape = null;
  if (o.rodape) {
    rodape = AL('H', { nome: 'Rodapé fixo', pad: [12, 16, 24, 16], gap: 12, fill: 'superficie', alinha: 'CENTER' });
    bordaLado(rodape, 'topo');
    add(f, rodape); fw(rodape);
  }
  if (o.nav) { const n = inst('navinf', { Ativo: o.nav }); add(f, n); fw(n); }
  return { f, body, rodape };
}

async function menuAdmin(ativo) {
  const m = AL('V', { nome: 'Menu lateral · Admin', pad: [24, 16], gap: 4, fill: 'superficie' });
  W(m, 248);
  bordaLado(m, 'dir');
  const logo = inst('logo', { Tema: TM() });
  add(m, logo);
  const esp = AL('V'); WH(esp, 10, 24); add(m, esp);
  add(m, await T('OPERAÇÃO', 'Legenda/SemiBold', 'texto-secundario'));
  for (const [rot, ic] of [['Documentos', 'documento'], ['Contestações', 'alerta'], ['Piso ANTT', 'calculadora']]) {
    const on = rot === ativo;
    const it = AL('H', { nome: rot, pad: [12, 12], gap: 12, alinha: 'CENTER', r: 6, fill: on ? 'faixa' : null });
    add(it, icone(ic, on ? 'sobre-faixa' : 'texto-secundario', 20), await T(rot, on ? 'Corpo/SemiBold' : 'Corpo/Regular', on ? 'sobre-faixa' : 'texto'));
    add(m, it); fw(it);
  }
  const mola = AL('V', { nome: 'Espaço' }); add(m, mola); mola.layoutGrow = 1;
  const u = AL('H', { gap: 12, alinha: 'CENTER' });
  add(u, await avatar('RS', 36), await T('Rafael Souza · Admin', 'Pequeno/SemiBold'));
  add(m, u);
  return m;
}

async function telaDesk(nome, o = {}) {
  const f = figma.createFrame();
  f.name = nome;
  f.layoutMode = 'HORIZONTAL';
  f.resize(o.largura || 1440, o.altura || 1024);
  f.primaryAxisSizingMode = 'FIXED';
  f.counterAxisSizingMode = 'FIXED';
  f.fills = [P('fundo')];
  f.clipsContent = true;
  f.itemSpacing = 0;
  if (o.menu) {
    const m = o.admin ? await menuAdmin(o.menu) : inst('menu', { Ativo: o.menu });
    add(f, m); fh(m);
  }
  const main = AL('V', { nome: 'Principal', pad: o.pad != null ? o.pad : [32, 40], gap: o.gap != null ? o.gap : 24 });
  add(f, main); main.layoutGrow = 1; fh(main);
  main.clipsContent = true;
  main.overflowDirection = 'VERTICAL';
  if (o.titulo) {
    const h = AL('H', { nome: 'Cabeçalho', gap: 16, alinha: 'CENTER' });
    add(main, h); fw(h);
    const col = AL('V', { gap: 4 });
    add(h, col); col.layoutGrow = 1;
    if (o.migalha) add(col, await T(o.migalha, 'Pequeno/Regular', 'texto-secundario'));
    const tl = AL('H', { gap: 12, alinha: 'CENTER' });
    add(col, tl);
    add(tl, await T(o.titulo, 'Desktop/H1'));
    if (o.badge) add(tl, o.badge);
    if (o.sub) add(col, await T(o.sub, 'Corpo/Regular', 'texto-secundario'));
    for (const a of o.acoes || []) add(h, a);
  }
  return { f, main };
}

// ---------- peças ----------
function cartao(o = {}) {
  return AL('V', { nome: o.nome || 'Cartão', pad: o.pad != null ? o.pad : 16, gap: o.gap != null ? o.gap : 12, fill: o.fill || 'superficie', r: 12, borda: o.borda === false ? null : (o.borda || 'linha'), bw: o.bw });
}
async function kv(pai, rotulo, valor, o = {}) {
  const l = AL('H', { nome: rotulo, just: 'SPACE_BETWEEN', alinha: 'CENTER', gap: 12 });
  add(pai, l); fw(l);
  add(l, await T(rotulo, o.estilo || 'Corpo/Regular', 'texto-secundario'), await T(valor, o.estiloV || 'Corpo/SemiBold', o.cor || 'texto'));
  return l;
}
async function titulo(pai, texto, estilo = 'Mobile/H3', cor = 'texto') { const t = await T(texto, estilo, cor); add(pai, t); return t; }
async function abas(itens, ativa, desk = false) {
  const l = AL('H', { nome: 'Abas', gap: desk ? 32 : 0 });
  bordaLado(l, 'base');
  for (const it of itens) {
    const on = it === ativa;
    const a = AL('V', { nome: it, pad: [12, desk ? 0 : 8], alinha: 'CENTER' });
    if (on) bordaLado(a, 'base', 'faixa', 3);
    add(a, await T(it, on ? 'Corpo/SemiBold' : 'Corpo/Regular', on ? 'texto' : 'texto-secundario'));
    add(l, a);
    if (!desk) a.layoutGrow = 1;
  }
  return l;
}
function toggle(on) {
  const f = figma.createFrame();
  f.name = on ? 'Toggle · ligado' : 'Toggle · desligado';
  f.resize(52, 32); f.cornerRadius = 16;
  f.fills = [P(on ? 'garantido' : 'linha')];
  const k = circulo(24, 'branco');
  k.x = on ? 24 : 4; k.y = 4;
  f.appendChild(k);
  return f;
}
async function avatar(iniciais, d = 48) {
  const a = AL('H', { nome: 'Avatar', just: 'CENTER', alinha: 'CENTER', fill: 'superficie-elevada', borda: 'linha' });
  WH(a, d, d); a.cornerRadius = d / 2;
  add(a, await T(iniciais, d > 40 ? 'Corpo/SemiBold' : 'Legenda/SemiBold'));
  return a;
}
function estrelas(n, tam = 20) {
  const l = AL('H', { nome: 'Estrelas · ' + n, gap: tam > 30 ? 8 : 2 });
  for (let i = 0; i < 5; i++) add(l, icone('star', i < n ? 'faixa' : 'linha', tam, i < n ? 'faixa' : null));
  return l;
}
async function tag(texto, cor = 'texto-secundario', icn) {
  const t = AL('H', { nome: 'Tag · ' + texto, pad: [4, 8], gap: 4, alinha: 'CENTER', r: 6, borda: 'linha' });
  if (icn) add(t, icone(icn, cor, 14));
  add(t, await T(texto, 'Legenda/SemiBold', cor));
  return t;
}
function linhaH(gapN = 8, o = {}) { return AL('H', Object.assign({ gap: gapN, alinha: 'CENTER' }, o)); }
function coluna(gapN = 8, o = {}) { return AL('V', Object.assign({ gap: gapN }, o)); }
function mola() { const m = AL('H', { nome: 'Espaço' }); return m; }

function mapa(w, h, o = {}) {
  const f = figma.createFrame();
  f.name = 'Mapa'; f.resize(w, h); f.fills = [P('superficie-elevada')]; f.cornerRadius = 12; f.clipsContent = true;
  for (let i = 1; i < 6; i++) { const r = ret(w, 1, 'linha'); r.y = (h / 6) * i; f.appendChild(r); }
  for (let i = 1; i < 8; i++) { const r = ret(1, h, 'linha'); r.x = (w / 8) * i; f.appendChild(r); }
  const v = figma.createVector();
  const x0 = 40, y0 = h - 40, x1 = w - 48, y1 = 44;
  v.vectorPaths = [{ windingRule: 'NONE', data: `M ${x0} ${y0} C ${w * 0.35} ${h * 0.9} ${w * 0.45} ${h * 0.2} ${x1} ${y1}` }];
  v.strokes = [P('faixa')]; v.strokeWeight = 4; v.dashPattern = [12, 8]; v.fills = []; v.strokeCap = 'ROUND';
  v.name = 'Rota';
  f.appendChild(v);
  const a = icone('map-pin', 'info', 28); f.appendChild(a); a.x = x0 - 14; a.y = y0 - 28;
  const b = icone('map-pin', 'faixa', 28); f.appendChild(b); b.x = x1 - 14; b.y = y1 - 28;
  if (o.raio) {
    const c = circulo(o.raio, null, 'garantido'); c.fills = [P('garantido', 0.15)]; c.x = x1 - o.raio / 2; c.y = y1 - o.raio / 2 - 10; f.appendChild(c);
  }
  return f;
}

function overlay(f, cor = 'escuro/fundo', op = 0.72) {
  const r = figma.createRectangle();
  r.name = 'Véu'; r.resize(f.width, f.height); r.fills = [P(cor, op)];
  f.appendChild(r);
  r.layoutPositioning = 'ABSOLUTE';
  r.x = 0; r.y = 0;
  return r;
}
// escurece a tela e prende a bottom sheet no rodapé (a tela cresce se a sheet não couber)
function montarSheet(f, sheet) {
  if (sheet.height + 60 > f.height) f.resize(f.width, sheet.height + 60);
  overlay(f);
  f.appendChild(sheet);
  sheet.layoutPositioning = 'ABSOLUTE';
  W(sheet, f.width);
  sheet.x = 0;
  sheet.y = f.height - sheet.height;
}
function sheetBase(nome) {
  const s = AL('V', { nome, pad: [8, 16, 32, 16], gap: 16, fill: 'superficie-elevada' });
  W(s, 390);
  s.topLeftRadius = 20; s.topRightRadius = 20;
  const pegador = AL('H', { just: 'CENTER' });
  add(s, pegador);
  pegador.layoutSizingHorizontal = 'FILL';
  add(pegador, ret(40, 4, 'linha', 2));
  return s;
}

// ---------- grade dentro de uma seção ----------
class Grade {
  constructor(secao) { this.s = secao; this.y = 120; this.maxX = 0; }
  async linha(nome, endpoint, telas, obs) {
    const temaAntes = TEMA; TEMA = 'claro';
    const n = AL('V', { gap: 4 });
    n.name = 'Nota · ' + nome;
    add(n, await T(nome, 'Desktop/H3', 'claro/texto'));
    add(n, await T(endpoint, 'Mono/P', 'claro/info'));
    if (obs) add(n, await T(obs, 'Pequeno/SemiBold', 'claro/alerta'));
    TEMA = temaAntes;
    this.s.appendChild(n); n.x = 80; n.y = this.y;
    let x = 80, h = 0;
    const topo = this.y + n.height + 24;
    for (const f of telas) {
      if (!f) continue;
      this.s.appendChild(f); f.x = x; f.y = topo;
      x += f.width + 80; h = Math.max(h, f.height);
    }
    this.y = topo + h + 160;
    this.maxX = Math.max(this.maxX, x);
  }
  fechar() { this.s.resizeWithoutConstraints(Math.max(this.maxX, 1600), this.y); }
}

function novaSecao(pagina, nome) {
  for (const n of pagina.children.slice()) if (n.type === 'SECTION' && n.name === nome) n.remove();
  let baixo = 0;
  for (const n of pagina.children) baixo = Math.max(baixo, n.y + n.height);
  const s = figma.createSection();
  s.name = nome;
  pagina.appendChild(s);
  s.x = 0; s.y = baixo + 400;
  s.fills = [{ type: 'SOLID', color: { r: 0.93, g: 0.92, b: 0.9 } }];
  return s;
}

// ---------- estados padrão (carregando, vazio, erro) ----------
async function estadosMobile(base, o) {
  const r = [];
  const shell = { titulo: o.titulo, sub: o.sub, voltar: o.voltar, nav: o.nav };
  {
    const { f, body } = await telaMobile(base + ' / Carregando', shell);
    for (let i = 0; i < (o.skel || 3); i++) { const s = skeleton('Card'); add(body, s); fw(s); }
    r.push(f);
  }
  if (o.vazio) {
    const { f, body } = await telaMobile(base + ' / Vazio', shell);
    body.primaryAxisAlignItems = 'CENTER';
    const v = vazio(o.vazio[0], o.vazio[1]); add(body, v); fw(v);
    if (o.vazio[2]) { const b = botao('Primário', o.vazio[2]); add(body, b); fw(b); }
    r.push(f);
  }
  {
    const { f, body } = await telaMobile(base + ' / Erro', shell);
    const a = aviso('Perigo', o.erro ? o.erro[0] : 'Não deu para carregar', o.erro ? o.erro[1] : 'Confira sua conexão e tente de novo.');
    add(body, a); fw(a);
    const b = botao('Secundário', 'Tentar de novo'); add(body, b); fw(b);
    r.push(f);
  }
  return r;
}

async function estadosDesk(base, o) {
  const r = [];
  const shell = { menu: o.menu, admin: o.admin, titulo: o.titulo, sub: o.sub };
  {
    const { f, main } = await telaDesk(base + ' / Carregando', shell);
    for (let i = 0; i < 7; i++) { const s = skeleton('Linha'); add(main, s); fw(s); }
    r.push(f);
  }
  if (o.vazio) {
    const { f, main } = await telaDesk(base + ' / Vazio', shell);
    const box = AL('V', { gap: 16, alinha: 'CENTER' });
    add(main, box); fw(box); fh(box);
    box.primaryAxisAlignItems = 'CENTER';
    const v = vazio(o.vazio[0], o.vazio[1]); add(box, v); v.resize(420, v.height);
    if (o.vazio[2]) add(box, botao('Primário', o.vazio[2]));
    r.push(f);
  }
  {
    const { f, main } = await telaDesk(base + ' / Erro', shell);
    const a = aviso('Perigo', o.erro ? o.erro[0] : 'Não deu para carregar', o.erro ? o.erro[1] : 'Confira sua conexão e tente de novo. Se continuar, fale com o suporte.');
    add(main, a); fw(a);
    add(main, botao('Secundário', 'Tentar de novo', 'M'));
    r.push(f);
  }
  return r;
}

// ---------- capa ----------
async function capa(pg1) {
  for (const n of pg1.children.slice()) if (n.name === '00 Capa') n.remove();
  const temaAntes = TEMA; TEMA = 'escuro';
  const f = AL('V', { nome: '00 Capa', pad: 96, gap: 32, fill: 'fundo' });
  WH(f, 1920, 1080);
  f.layoutMode = 'VERTICAL';
  pg1.appendChild(f);
  let esq = 0;
  for (const n of pg1.children) if (n !== f) esq = Math.min(esq, n.x);
  f.x = esq - 2200; f.y = 0;
  add(f, inst('logo', { Tema: 'Escuro' }));
  add(f, await T('Fretaí — Produto', 'Desktop/Display'));
  await TQ(f, 'Rodovia + cofre. Estrada é a moldura; dinheiro é sagrado. Frete com pagamento garantido antes de carregar.', 'Desktop/H3', 'texto-secundario');
  const faixa = figma.createVector();
  faixa.vectorPaths = [{ windingRule: 'NONE', data: 'M 0 0 L 1728 0' }];
  faixa.strokes = [P('faixa')]; faixa.strokeWeight = 6; faixa.dashPattern = [48, 32]; faixa.fills = [];
  faixa.name = 'Faixa de pista';
  add(f, faixa);
  const pal = AL('H', { nome: 'Paleta', gap: 24 });
  add(f, pal);
  for (const [nome, v] of [['faixa', 'escuro/faixa'], ['garantido', 'escuro/garantido'], ['alerta', 'escuro/alerta'], ['perigo', 'escuro/perigo'], ['info', 'escuro/info'], ['fundo · asfalto', 'escuro/fundo'], ['fundo · canhoto', 'claro/fundo']]) {
    const c = AL('V', { gap: 8 });
    const sw = ret(160, 96, v, 12); sw.strokes = [P('escuro/linha')]; sw.strokeWeight = 1;
    add(c, sw, await T(nome, 'Pequeno/SemiBold', 'texto-secundario'));
    add(pal, c);
  }
  const mol = mola(); add(f, mol); mol.layoutGrow = 1;
  await TQ(f, 'Páginas: 01 Sistema (fundamentos, ícones e componentes) · 02 Motorista · Mobile · 03 Empresa · Admin · Público. Plano Starter: 3 páginas; Claro e Escuro são grupos de variáveis.', 'Corpo/Regular', 'texto-secundario');
  await TQ(f, 'Telas-vitrine aprovadas: Motorista / Fretes (busca) · Motorista / Frete em andamento · Empresa / Detalhe do frete · Propostas.', 'Corpo/SemiBold', 'faixa');
  TEMA = temaAntes;
  return f;
}
