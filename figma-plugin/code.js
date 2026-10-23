// Fretaí — plugin local que gera as telas restantes, os componentes complementares e o protótipo.
// Usa as variáveis, estilos de texto, ícones e componentes que já existem na página "01 Sistema".
// Pode rodar de novo: apaga e refaz só as seções "Gerado · …" (os componentes complementares são reaproveitados).

const ERROS = [];
const FEITOS = [];

const SET_IDS = {
  botao: '4:54', selo: '4:85', piso: '4:114', badge: '4:245', aviso: '4:316', placa: '4:329', chip: '4:344',
  rota: '5:95', medidor: '5:355', timeline: '5:635', repu: '6:100', logo: '6:117', navinf: '6:241',
  menu: '6:539', card: '6:803', coluna: '6:937',
};
const SET_NOMES = {
  botao: 'Botão', selo: 'Selo garantido', piso: 'Chip piso ANTT', badge: 'Badge status', aviso: 'Aviso',
  placa: 'Placa Mercosul', chip: 'Chip', rota: 'Linha de rota', medidor: 'Medidor de garantia',
  timeline: 'Timeline de marcos', repu: 'Reputação mini', logo: 'Logo', navinf: 'Navegação inferior',
  menu: 'Menu lateral', card: 'Card de frete', coluna: 'Coluna de proposta',
};

const V = {};   // variáveis por nome ("escuro/fundo", "espaco/16")
const S = {};   // estilos de texto por nome ("Mobile/H1")
const SETS = {}; // component sets por chave
const IC = {};  // ícones por nome ("busca")
let TEMA = 'escuro';
const TM = () => (TEMA === 'escuro' ? 'Escuro' : 'Claro');

const FONTES = [
  ['Inter', 'Regular'], ['Barlow', 'Regular'], ['Barlow', 'Medium'], ['Barlow', 'SemiBold'],
  ['Barlow Semi Condensed', 'SemiBold'], ['Barlow Semi Condensed', 'Bold'], ['JetBrains Mono', 'Medium'],
];

async function preparar() {
  for (const [family, style] of FONTES) {
    try { await figma.loadFontAsync({ family, style }); } catch (e) { ERROS.push('Fonte ausente: ' + family + ' ' + style); }
  }
  for (const v of await figma.variables.getLocalVariablesAsync()) V[v.name] = v;
  for (const s of await figma.getLocalTextStylesAsync()) {
    S[s.name] = s;
    try { await figma.loadFontAsync(s.fontName); } catch (e) { /* já reportado acima */ }
  }
}

async function seguro(nome, fn) {
  try { const r = await fn(); FEITOS.push(nome); return r; }
  catch (e) { ERROS.push(nome + ': ' + (e && e.message ? e.message : e)); return null; }
}

// ---------- cor, espaço, raio ----------
const cv = (n) => (n.includes('/') ? n : TEMA + '/' + n);
function P(n, opacidade) {
  const p = { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } };
  if (opacidade != null) p.opacity = opacidade;
  const v = V[cv(n)];
  if (!v) { ERROS.push('Variável não encontrada: ' + cv(n)); return p; }
  return figma.variables.setBoundVariableForPaint(p, 'color', v);
}
function liga(n, campo, valor, prefixo) {
  const v = V[prefixo + '/' + valor];
  if (v) { try { n.setBoundVariable(campo, v); } catch (e) { /* valor solto fica */ } }
}
function gap(f, n) { f.itemSpacing = n; liga(f, 'itemSpacing', n, 'espaco'); }
function pad(f, p) {
  const [t, r, b, l] = typeof p === 'number' ? [p, p, p, p] : p.length === 2 ? [p[0], p[1], p[0], p[1]] : p;
  f.paddingTop = t; f.paddingRight = r; f.paddingBottom = b; f.paddingLeft = l;
  for (const [c, val] of [['paddingTop', t], ['paddingRight', r], ['paddingBottom', b], ['paddingLeft', l]]) liga(f, c, val, 'espaco');
}
const RAIO = { 6: 'campo', 12: 'card', 20: 'sheet' };
function rad(f, n) {
  f.cornerRadius = n;
  if (RAIO[n]) for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) liga(f, c, RAIO[n], 'raio');
}
function bd(f, cor = 'linha', w = 1) { f.strokes = [P(cor)]; f.strokeWeight = w; f.strokeAlign = 'INSIDE'; }

// ---------- nós ----------
function AL(dir, o = {}) {
  const f = figma.createFrame();
  f.layoutMode = dir === 'H' ? 'HORIZONTAL' : 'VERTICAL';
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.fills = [];
  f.clipsContent = false;
  f.itemSpacing = 0;
  if (o.nome) f.name = o.nome;
  if (o.gap != null) gap(f, o.gap);
  if (o.pad != null) pad(f, o.pad);
  if (o.fill) f.fills = [P(o.fill, o.op)];
  if (o.r != null) rad(f, o.r);
  if (o.borda) bd(f, o.borda, o.bw || 1);
  if (o.alinha) f.counterAxisAlignItems = o.alinha; // MIN | CENTER | MAX
  if (o.just) f.primaryAxisAlignItems = o.just;     // MIN | CENTER | MAX | SPACE_BETWEEN
  return f;
}
function W(f, w) {
  f.resize(w, Math.max(1, f.height));
  if (f.layoutMode === 'VERTICAL') { f.counterAxisSizingMode = 'FIXED'; f.primaryAxisSizingMode = 'AUTO'; }
  else if (f.layoutMode === 'HORIZONTAL') { f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'AUTO'; }
  return f;
}
function WH(f, w, h) {
  f.resize(w, h);
  if (f.layoutMode !== 'NONE') { f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'FIXED'; }
  return f;
}
function add(pai, ...filhos) { for (const c of filhos) if (c) pai.appendChild(c); return pai; }
function fw(n) { n.layoutSizingHorizontal = 'FILL'; return n; }
function fh(n) { n.layoutSizingVertical = 'FILL'; return n; }

async function T(texto, estilo, cor = 'texto', o = {}) {
  const t = figma.createText();
  const s = S[estilo];
  if (s) await t.setTextStyleIdAsync(s.id);
  else { t.fontName = { family: 'Barlow', style: 'Regular' }; t.fontSize = 16; ERROS.push('Estilo de texto ausente: ' + estilo); }
  t.characters = String(texto);
  t.fills = [P(cor)];
  t.name = o.nome || String(texto).slice(0, 40);
  if (o.centro) t.textAlignHorizontal = 'CENTER';
  if (o.direita) t.textAlignHorizontal = 'RIGHT';
  return t;
}
// texto que quebra linha: chamar depois de anexar a um pai auto-layout com largura definida
function quebra(t) { t.textAutoResize = 'HEIGHT'; t.layoutSizingHorizontal = 'FILL'; return t; }
async function TQ(pai, texto, estilo, cor) { const t = await T(texto, estilo, cor); pai.appendChild(t); return quebra(t); }

function ret(w, h, cor, r = 0, op) {
  const x = figma.createRectangle();
  x.resize(w, h);
  x.fills = cor ? [P(cor, op)] : [];
  if (r) x.cornerRadius = r;
  return x;
}
function circulo(d, cor, borda) {
  const e = figma.createEllipse();
  e.resize(d, d);
  e.fills = cor ? [P(cor)] : [];
  if (borda) { e.strokes = [P(borda)]; e.strokeWeight = 2; }
  return e;
}
function linhaDiv(w = 100) {
  const r = ret(w, 1, 'linha');
  r.name = 'Divisória';
  return r;
}
function divisoria(pai) { const r = linhaDiv(); pai.appendChild(r); r.layoutSizingHorizontal = 'FILL'; return r; }

// ---------- componentes existentes ----------
async function carregarComponentes(pg1) {
  for (const [k, id] of Object.entries(SET_IDS)) {
    let n = await figma.getNodeByIdAsync(id);
    if (!n || n.type !== 'COMPONENT_SET') n = pg1.findOne((x) => x.type === 'COMPONENT_SET' && x.name === SET_NOMES[k]);
    if (n) SETS[k] = n; else ERROS.push('Componente não encontrado: ' + SET_NOMES[k]);
  }
  for (const c of pg1.findAllWithCriteria({ types: ['COMPONENT'] })) {
    if (c.name.startsWith('Ícone/')) IC[c.name.slice(6)] = c;
  }
}

function inst(chave, props = {}) {
  const set = SETS[chave];
  if (!set) throw new Error('Componente não encontrado: ' + (SET_NOMES[chave] || chave));
  let melhor = null, nota = -1;
  for (const c of set.children) {
    if (c.type !== 'COMPONENT') continue;
    const vp = c.variantProperties || {};
    let n = 0;
    for (const [k, v] of Object.entries(props)) if (vp[k] === v) n++;
    if (n > nota) { nota = n; melhor = c; }
  }
  if (nota < Object.keys(props).length) ERROS.push((set.name) + ': variante não exata ' + JSON.stringify(props));
  return melhor.createInstance();
}
function prop(i, nome, valor) {
  const d = i.componentProperties;
  for (const k in d) if (k.split('#')[0] === nome) { try { i.setProperties({ [k]: valor }); return true; } catch (e) { return false; } }
  return false;
}
async function fontesDo(t) {
  if (t.fontName !== figma.mixed) await figma.loadFontAsync(t.fontName);
  else for (const s of t.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(s.fontName);
}
async function txt(i, nomeNo, valor) {
  const t = i.findOne((n) => n.type === 'TEXT' && n.name === nomeNo);
  if (!t) return false;
  await fontesDo(t); t.characters = valor; return true;
}
// troca um texto pelo conteúdo atual (quando o nó não tem nome conhecido)
async function trocaTexto(raiz, antigo, novo) {
  const t = raiz.findOne((n) => n.type === 'TEXT' && n.characters === antigo);
  if (!t) return false;
  await fontesDo(t); t.characters = novo; return true;
}
async function textoProp(i, nome, valor, nomeNo) {
  if (!prop(i, nome, valor) && nomeNo) await txt(i, nomeNo, valor);
  return i;
}

function icone(nome, cor = 'texto', tam = 20, corPreenchida) {
  const c = IC[nome];
  if (!c) { ERROS.push('Ícone ausente: ' + nome); const r = figma.createFrame(); r.resize(tam, tam); r.fills = []; r.name = 'Ícone/' + nome; return r; }
  const i = c.createInstance();
  i.resize(tam, tam);
  const p = P(cor);
  for (const n of i.findAll((x) => 'strokes' in x && x.strokes.length)) n.strokes = [p];
  if (corPreenchida) { const pf = P(corPreenchida); for (const n of i.findAll((x) => x.type === 'VECTOR')) n.fills = [pf]; }
  return i;
}

// atalhos das instâncias mais usadas
function botao(tipo, rotulo, tam = 'G') { const i = inst('botao', { Tipo: tipo, Tamanho: tam, Tema: TM() }); prop(i, 'Rótulo', rotulo); i.name = 'Botão · ' + rotulo; return i; }
function badge(status) { return inst('badge', { Status: status, Tema: TM() }); }
function aviso(tipo, titulo, texto) { const i = inst('aviso', { Tipo: tipo, Tema: TM() }); prop(i, 'Título', titulo); prop(i, 'Texto', texto); return i; }
function piso(estado, valor) { const i = inst('piso', { Estado: estado, Tema: TM() }); prop(i, 'Valor', valor); return i; }
function selo(tam = 'Compacto', texto) { const i = inst('selo', { Tamanho: tam, Tema: TM() }); if (texto) prop(i, 'Texto', texto); return i; }
function chip(rotulo, ativo = false) { const i = inst('chip', { Estado: ativo ? 'Ativo' : 'Inativo', Tema: TM() }); prop(i, 'Rótulo', rotulo); return i; }
async function placa(p, tam = 'P') { const i = inst('placa', { Tamanho: tam }); await textoProp(i, 'Placa', p, 'placa'); return i; }
async function rota(orient, origem, destino, km) {
  const i = inst('rota', { 'Orientação': orient, Tema: TM() });
  await textoProp(i, 'Origem', origem, 'origem');
  await textoProp(i, 'Destino', destino, 'destino');
  await textoProp(i, 'Distância', km, 'km');
  return i;
}
function medidor(estado) { return inst('medidor', { Estado: estado, Tema: TM() }); }
function timeline(orient, etapa) { return inst('timeline', { 'Orientação': orient, Etapa: etapa }); }
// largura fixa para instâncias (sem mexer nos modos de auto layout do componente)
function largura(n, w) {
  n.resize(w, n.height);
  try { n.layoutSizingHorizontal = 'FIXED'; n.layoutSizingVertical = 'HUG'; } catch (e) { /* fora de auto layout */ }
  return n;
}
// ---------- componentes complementares (seção 8 do briefing) ----------

SET_NOMES.campo = 'Campo';
SET_NOMES.segmentado = 'Segmentado SIM/NÃO/TANTO FAZ';
SET_NOMES.adiant = 'Seletor de adiantamento';
SET_NOMES.assinatura = 'Área de assinatura';
SET_NOMES.qr = 'QR Code Pix';
SET_NOMES.toast = 'Toast';
SET_NOMES.skeleton = 'Skeleton';
SET_NOMES.vazio = 'Estado vazio';
SET_NOMES.veiculo = 'Silhueta de veículo';

const VEICULOS = [
  ['RODOTREM', 'Rodotrem', 9], ['BITREM', 'Bitrem', 7], ['CARRETA_LS', 'Carreta LS', 6], ['CARRETA', 'Carreta', 5],
  ['VANDERLEIA', 'Vanderleia', 6], ['TRUCK', 'Truck', 3], ['BITRUCK', 'Bitruck', 4], ['TOCO', 'Toco', 2],
  ['VUC', 'VUC', 2], ['TRES_QUARTOS', '3/4', 2],
];

function combinacoes(eixos) {
  let r = [{}];
  for (const [k, vals] of Object.entries(eixos)) {
    const n = [];
    for (const base of r) for (const v of vals) n.push(Object.assign({}, base, { [k]: v }));
    r = n;
  }
  return r;
}

async function criarSet(pai, chave, eixos, construir, textos = [], booleanos = [], larg = 1200) {
  const existente = pai.findOne((n) => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && n.name === SET_NOMES[chave]);
  if (existente) { SETS[chave] = existente; return existente; }
  const temaAntes = TEMA;
  const comps = [];
  for (const combo of combinacoes(eixos)) {
    if (combo.Tema) TEMA = combo.Tema === 'Claro' ? 'claro' : 'escuro';
    const c = figma.createComponent();
    c.name = Object.entries(combo).map(([k, v]) => k + '=' + v).join(', ');
    c.fills = [];
    await construir(c, combo);
    comps.push(c);
  }
  TEMA = temaAntes;
  const set = figma.combineAsVariants(comps, pai);
  set.name = SET_NOMES[chave];
  set.layoutMode = 'HORIZONTAL';
  set.layoutWrap = 'WRAP';
  set.itemSpacing = 24;
  set.counterAxisSpacing = 24;
  set.paddingTop = set.paddingBottom = set.paddingLeft = set.paddingRight = 24;
  set.resize(larg, Math.max(1, set.height));
  set.primaryAxisSizingMode = 'FIXED';
  set.counterAxisSizingMode = 'AUTO';
  set.fills = [P('claro/fundo')];
  set.strokes = [{ type: 'SOLID', color: { r: 0.59, g: 0.27, b: 1 } }];
  set.dashPattern = [6, 4];
  set.cornerRadius = 12;
  for (const tp of textos) {
    const k = set.addComponentProperty(tp.nome, 'TEXT', tp.padrao);
    for (const c of set.children) {
      const n = c.findOne((x) => x.type === 'TEXT' && x.name === tp.no);
      if (n) n.componentPropertyReferences = Object.assign({}, n.componentPropertyReferences || {}, { characters: k });
    }
  }
  for (const bp of booleanos) {
    const k = set.addComponentProperty(bp.nome, 'BOOLEAN', bp.padrao);
    for (const c of set.children) {
      const n = c.findOne((x) => x.name === bp.no);
      if (n) n.componentPropertyReferences = Object.assign({}, n.componentPropertyReferences || {}, { visible: k });
    }
  }
  SETS[chave] = set;
  return set;
}

async function construirCampo(c, { Estado }) {
  c.layoutMode = 'VERTICAL';
  W(c, 320);
  gap(c, 4);
  const rot = await T('Rótulo', 'Pequeno/SemiBold', 'texto-secundario', { nome: 'rotulo' });
  add(c, rot); quebra(rot);
  const foco = Estado === 'Foco', erro = Estado === 'Erro';
  const caixa = AL('H', { nome: 'Caixa', pad: [0, 12], gap: 8, alinha: 'CENTER', fill: Estado === 'Desabilitado' ? 'fundo' : 'superficie', r: 6, borda: foco ? 'faixa' : erro ? 'perigo' : 'linha', bw: foco || erro ? 2 : 1 });
  add(c, caixa);
  caixa.layoutSizingVertical = 'FIXED';
  caixa.resize(320, 48);
  caixa.layoutSizingHorizontal = 'FILL';
  const vazio = Estado === 'Vazio' || Estado === 'Desabilitado';
  const val = await T(vazio ? 'Digite aqui' : 'Campinas/SP', 'Corpo/Regular', vazio ? 'texto-secundario' : 'texto', { nome: 'valor' });
  add(caixa, val); quebra(val);
  if (foco) { const cur = ret(2, 22, 'faixa'); cur.name = 'Cursor'; add(caixa, cur); }
  if (erro) add(caixa, icone('alerta', 'perigo', 20));
  const aj = await T(erro ? 'Confira este campo.' : 'Texto de ajuda', 'Legenda/Regular', erro ? 'perigo' : 'texto-secundario', { nome: 'ajuda' });
  add(c, aj); quebra(aj);
  if (Estado === 'Desabilitado') c.opacity = 0.55;
}

async function construirSegmentado(c, { Valor }) {
  c.layoutMode = 'HORIZONTAL';
  W(c, 320);
  pad(c, 4); gap(c, 4);
  c.fills = [P('superficie')];
  bd(c, 'linha'); rad(c, 6);
  for (const lab of ['Sim', 'Não', 'Tanto faz']) {
    const ativo = lab === Valor;
    const seg = AL('H', { nome: lab, pad: [12, 8], just: 'CENTER', alinha: 'CENTER', fill: ativo ? 'faixa' : null });
    seg.cornerRadius = 4;
    add(seg, await T(lab, 'Pequeno/SemiBold', ativo ? 'sobre-faixa' : 'texto'));
    add(c, seg); seg.layoutGrow = 1;
  }
}

async function construirAdiantamento(c) {
  c.layoutMode = 'VERTICAL';
  W(c, 358);
  gap(c, 8);
  const topo = AL('H', { nome: 'Topo', just: 'SPACE_BETWEEN', alinha: 'CENTER' });
  add(c, topo); fw(topo);
  add(topo, await T('Adiantamento na saída', 'Pequeno/SemiBold', 'texto-secundario'), await T('40%', 'Valor/M', 'texto', { nome: 'percentual' }));
  const tr = figma.createFrame();
  tr.name = 'Trilho'; tr.fills = []; tr.resize(358, 32); tr.clipsContent = false;
  const base = ret(358, 8, 'linha', 4); base.y = 12;
  const cheio = ret(143, 8, 'faixa', 4); cheio.y = 12;
  const pino = circulo(32, 'faixa'); pino.x = 127; pino.strokes = [P('fundo')]; pino.strokeWeight = 4; pino.name = 'Pino';
  add(tr, base, cheio, pino);
  add(c, tr);
  const marcas = AL('H', { nome: 'Marcas', just: 'SPACE_BETWEEN' });
  add(c, marcas); fw(marcas);
  add(marcas, await T('0%', 'Legenda/Regular', 'texto-secundario'), await T('50%', 'Legenda/Regular', 'texto-secundario'), await T('100%', 'Legenda/Regular', 'texto-secundario'));
  const v = await T('R$ 3.120 na saída · R$ 4.680 na entrega', 'Corpo/SemiBold', 'texto', { nome: 'valores' });
  add(c, v); quebra(v);
}

async function construirAssinatura(c, { Estado }) {
  c.layoutMode = 'VERTICAL';
  W(c, 358);
  gap(c, 8);
  const area = figma.createFrame();
  area.name = 'Área'; area.resize(358, 200); area.fills = [P('superficie')]; area.cornerRadius = 12;
  area.strokes = [P('linha')]; area.strokeWeight = 2; area.dashPattern = [8, 6];
  const base = ret(300, 1, 'texto-secundario'); base.x = 29; base.y = 150;
  const x = await T('×', 'Mobile/H3', 'texto-secundario'); x.x = 29; x.y = 120;
  add(area, base, x);
  if (Estado === 'Vazia') {
    const t = await T('Assine aqui com o dedo', 'Corpo/Regular', 'texto-secundario');
    area.appendChild(t); t.x = (358 - t.width) / 2; t.y = 84;
  } else {
    const v = figma.createVector();
    v.vectorPaths = [{ windingRule: 'NONE', data: Estado === 'Assinando'
      ? 'M 0 70 C 20 10 40 10 50 60 C 60 100 80 0 100 40'
      : 'M 0 70 C 20 10 40 10 50 60 C 60 100 80 0 100 40 C 115 70 130 50 145 35 C 160 20 175 70 195 55 C 215 40 230 30 260 45' }];
    v.strokes = [P('texto')]; v.strokeWeight = 3; v.strokeCap = 'ROUND'; v.fills = [];
    v.name = 'Traço';
    area.appendChild(v); v.x = 50; v.y = 60;
  }
  add(c, area);
  const rodape = AL('H', { nome: 'Rodapé', just: 'SPACE_BETWEEN', alinha: 'CENTER' });
  add(c, rodape); fw(rodape);
  add(rodape, await T(Estado === 'Assinada' ? 'Assinado por Roberto Lima' : 'Assinatura do recebedor', 'Legenda/Regular', 'texto-secundario', { nome: 'legenda' }),
    await T('Limpar', 'Pequeno/SemiBold', 'info'));
}

function caminhoQR() {
  const N = 25, M = 8;
  let s = 7;
  const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  const finder = (r, c) => {
    for (const [r0, c0] of [[0, 0], [0, N - 7], [N - 7, 0]]) {
      const dr = r - r0, dc = c - c0;
      if (dr >= 0 && dr < 7 && dc >= 0 && dc < 7) {
        const borda = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const miolo = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        return borda || miolo ? 1 : 0;
      }
      if (dr >= -1 && dr <= 7 && dc >= -1 && dc <= 7) return 0;
    }
    return -1;
  };
  let d = '';
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const f = finder(r, c);
    const escuro = f === -1 ? rnd() > 0.52 : f === 1;
    if (escuro) { const x = c * M, y = r * M; d += `M ${x} ${y} L ${x + M} ${y} L ${x + M} ${y + M} L ${x} ${y + M} Z `; }
  }
  return d.trim();
}

async function criarQR(pai) {
  const existente = pai.findOne((n) => n.type === 'COMPONENT' && n.name === SET_NOMES.qr);
  if (existente) { SETS.qr = existente; return; }
  const c = figma.createComponent();
  c.name = SET_NOMES.qr;
  c.resize(232, 232);
  c.fills = [P('claro/superficie')];
  c.cornerRadius = 12;
  c.strokes = [P('claro/linha')]; c.strokeWeight = 1;
  const v = figma.createVector();
  v.vectorPaths = [{ windingRule: 'NONZERO', data: caminhoQR() }];
  v.fills = [P('claro/texto')]; v.strokes = [];
  v.name = 'Módulos';
  c.appendChild(v); v.x = 16; v.y = 16;
  const selo = figma.createFrame();
  selo.resize(40, 40); selo.fills = [P('claro/faixa')]; selo.cornerRadius = 6; selo.x = 96; selo.y = 96; selo.name = 'Marca';
  selo.strokes = [P('claro/superficie')]; selo.strokeWeight = 4;
  c.appendChild(selo);
  c.description = 'QR Code do Pix (pixQrCodeBase64). Só existe enquanto o pagamento está PENDENTE.';
  pai.appendChild(c);
  SETS.qr = c;
}

async function construirToast(c, { Tipo }) {
  c.layoutMode = 'HORIZONTAL';
  W(c, 358);
  pad(c, [12, 16]); gap(c, 12);
  c.counterAxisAlignItems = 'CENTER';
  c.fills = [P('superficie-elevada')];
  bd(c, Tipo === 'Sucesso' ? 'garantido' : 'linha');
  rad(c, 12);
  add(c, icone(Tipo === 'Sucesso' ? 'check' : 'info', Tipo === 'Sucesso' ? 'garantido' : 'info', 20));
  const t = await T('Proposta aceita! A Cerâmica Paulista fechou com você.', 'Corpo/SemiBold', 'texto', { nome: 'texto' });
  add(c, t); quebra(t);
}

async function construirSkeleton(c, { Formato }) {
  if (Formato === 'Card') {
    c.layoutMode = 'VERTICAL';
    W(c, 358);
    pad(c, 16); gap(c, 12);
    c.fills = [P('superficie')]; bd(c); rad(c, 12);
    add(c, ret(180, 14, 'linha', 4), ret(300, 24, 'linha', 4), ret(140, 14, 'linha', 4));
    const l = AL('H', { gap: 8 });
    add(l, ret(88, 24, 'linha', 6), ret(88, 24, 'linha', 6), ret(120, 24, 'linha', 6));
    add(c, l);
  } else {
    c.layoutMode = 'HORIZONTAL';
    W(c, 1000);
    pad(c, [16, 16]); gap(c, 24);
    c.counterAxisAlignItems = 'CENTER';
    c.fills = [P('superficie')];
    add(c, ret(64, 14, 'linha', 4), ret(260, 14, 'linha', 4), ret(140, 14, 'linha', 4), ret(120, 14, 'linha', 4), ret(110, 24, 'linha', 6));
  }
}

async function construirVazio(c) {
  c.layoutMode = 'VERTICAL';
  W(c, 358);
  pad(c, [32, 24]); gap(c, 12);
  c.counterAxisAlignItems = 'CENTER';
  const il = figma.createFrame();
  il.name = 'Ilustração · estrada'; il.resize(200, 104); il.fills = [];
  const linha = (d, cor, w, tracejado) => {
    const v = figma.createVector();
    v.vectorPaths = [{ windingRule: 'NONE', data: d }];
    v.strokes = [P(cor)]; v.strokeWeight = w; v.fills = []; v.strokeCap = 'ROUND';
    if (tracejado) v.dashPattern = tracejado;
    il.appendChild(v);
    return v;
  };
  const e = linha('M 0 70 L 70 0', 'texto-secundario', 2); e.x = 20; e.y = 32;
  const d = linha('M 70 70 L 0 0', 'texto-secundario', 2); d.x = 110; d.y = 32;
  const m = linha('M 0 70 L 0 0', 'faixa', 3, [8, 8]); m.x = 100; m.y = 32;
  const pino = icone('map-pin', 'faixa', 28); il.appendChild(pino); pino.x = 86; pino.y = 0;
  add(c, il);
  const t = await T('Nada por aqui ainda', 'Mobile/H3', 'texto', { nome: 'titulo', centro: true });
  add(c, t); quebra(t);
  const x = await T('Quando houver algo, aparece aqui.', 'Corpo/Regular', 'texto-secundario', { nome: 'texto', centro: true });
  add(c, x); quebra(x);
}

const DESENHO_VEICULO = {
  VUC: { caixas: [[4, 18, 22, 20], [28, 14, 54, 24]], rodas: [14, 70] },
  TRES_QUARTOS: { caixas: [[4, 18, 24, 20], [30, 12, 62, 26]], rodas: [16, 80] },
  TOCO: { caixas: [[4, 18, 24, 20], [30, 8, 74, 30]], rodas: [16, 90] },
  TRUCK: { caixas: [[4, 18, 24, 20], [30, 8, 92, 30]], rodas: [16, 100, 112] },
  BITRUCK: { caixas: [[4, 18, 24, 20], [30, 8, 100, 30]], rodas: [12, 26, 108, 120] },
  CARRETA: { caixas: [[2, 14, 26, 24], [32, 8, 124, 30]], rodas: [12, 30, 42, 132, 144] },
  CARRETA_LS: { caixas: [[2, 14, 26, 24], [32, 8, 124, 30]], rodas: [12, 30, 42, 120, 132, 144] },
  VANDERLEIA: { caixas: [[2, 14, 26, 24], [32, 8, 124, 30]], rodas: [12, 30, 42, 108, 128, 146] },
  BITREM: { caixas: [[2, 14, 26, 24], [32, 8, 60, 30], [96, 8, 60, 30]], rodas: [12, 30, 42, 68, 80, 132, 144] },
  RODOTREM: { caixas: [[2, 14, 26, 24], [32, 8, 58, 30], [98, 8, 58, 30]], rodas: [12, 30, 42, 62, 74, 86, 122, 134, 146] },
};

async function construirVeiculo(c, { Tipo }) {
  c.resize(160, 56);
  c.clipsContent = false;
  const d = DESENHO_VEICULO[Tipo];
  for (const [x, y, w, h] of d.caixas) {
    const r = ret(w, h, null, 2);
    r.strokes = [P('texto')]; r.strokeWeight = 2; r.x = x; r.y = y; r.name = 'Caixa';
    c.appendChild(r);
  }
  for (const x of d.rodas) {
    const e = circulo(10, 'fundo', 'texto');
    e.x = x - 5; e.y = 40; e.name = 'Eixo';
    c.appendChild(e);
  }
  const chao = ret(156, 1, 'linha'); chao.x = 2; chao.y = 52; chao.name = 'Chão';
  c.appendChild(chao);
}

async function componentesComplementares(pg1) {
  let painel = pg1.children.find((n) => n.type === 'FRAME' && n.name === 'Componentes · complementares');
  if (!painel) {
    let baixo = 0;
    for (const n of pg1.children) baixo = Math.max(baixo, n.y + n.height);
    painel = AL('V', { nome: 'Componentes · complementares', pad: 48, gap: 32 });
    painel.fills = [P('claro/superficie')];
    painel.cornerRadius = 20;
    pg1.appendChild(painel);
    painel.x = 0; painel.y = baixo + 240;
    const tema = TEMA; TEMA = 'claro';
    add(painel, await T('Componentes · complementares', 'Desktop/H1', 'claro/texto'));
    add(painel, await T('Campo, segmentado, adiantamento, assinatura, QR Pix, toast, skeleton, estado vazio e silhuetas de veículo.', 'Corpo/Regular', 'claro/texto-secundario'));
    TEMA = tema;
  }
  const temas = ['Escuro', 'Claro'];
  await seguro('Componente Campo', () => criarSet(painel, 'campo', { Estado: ['Vazio', 'Foco', 'Preenchido', 'Erro', 'Desabilitado'], Tema: temas }, construirCampo,
    [{ nome: 'Rótulo', padrao: 'Rótulo', no: 'rotulo' }, { nome: 'Valor', padrao: 'Campinas/SP', no: 'valor' }, { nome: 'Ajuda', padrao: 'Texto de ajuda', no: 'ajuda' }],
    [{ nome: 'Mostrar ajuda', padrao: true, no: 'ajuda' }], 1800));
  await seguro('Componente Segmentado', () => criarSet(painel, 'segmentado', { Valor: ['Sim', 'Não', 'Tanto faz'], Tema: temas }, construirSegmentado, [], [], 1100));
  await seguro('Componente Seletor de adiantamento', () => criarSet(painel, 'adiant', { Tema: temas }, construirAdiantamento,
    [{ nome: 'Percentual', padrao: '40%', no: 'percentual' }, { nome: 'Valores', padrao: 'R$ 3.120 na saída · R$ 4.680 na entrega', no: 'valores' }], [], 1000));
  await seguro('Componente Área de assinatura', () => criarSet(painel, 'assinatura', { Estado: ['Vazia', 'Assinando', 'Assinada'], Tema: temas }, construirAssinatura, [], [], 1250));
  await seguro('Componente QR Code Pix', () => criarQR(painel));
  await seguro('Componente Toast', () => criarSet(painel, 'toast', { Tipo: ['Sucesso', 'Info'], Tema: temas }, construirToast,
    [{ nome: 'Texto', padrao: 'Proposta aceita! A Cerâmica Paulista fechou com você.', no: 'texto' }], [], 1000));
  await seguro('Componente Skeleton', () => criarSet(painel, 'skeleton', { Formato: ['Card', 'Linha'], Tema: temas }, construirSkeleton, [], [], 1500));
  await seguro('Componente Estado vazio', () => criarSet(painel, 'vazio', { Tema: temas }, construirVazio,
    [{ nome: 'Título', padrao: 'Nada por aqui ainda', no: 'titulo' }, { nome: 'Texto', padrao: 'Quando houver algo, aparece aqui.', no: 'texto' }], [], 1000));
  await seguro('Componente Silhueta de veículo', () => criarSet(painel, 'veiculo', { Tipo: VEICULOS.map((v) => v[0]), Tema: temas }, construirVeiculo, [], [], 1900));
}

// instâncias dos complementares
function inst2(chave, props) {
  const s = SETS[chave];
  if (!s) throw new Error('Componente não encontrado: ' + SET_NOMES[chave]);
  return s.type === 'COMPONENT' ? s.createInstance() : inst(chave, props);
}
function campo(rotulo, valor, estado = 'Preenchido', ajuda = null, o = {}) {
  const i = inst2('campo', { Estado: estado, Tema: TM() });
  prop(i, 'Rótulo', rotulo);
  prop(i, 'Valor', valor);
  if (ajuda) prop(i, 'Ajuda', ajuda); else prop(i, 'Mostrar ajuda', false);
  i.name = 'Campo · ' + rotulo;
  if (o.mono) { const t = i.findOne((n) => n.type === 'TEXT' && n.name === 'valor'); if (t) t.fontName = { family: 'JetBrains Mono', style: 'Medium' }; }
  return i;
}
function segmentado(valor) { return inst2('segmentado', { Valor: valor, Tema: TM() }); }
function adiantamento(pct, valores) { const i = inst2('adiant', { Tema: TM() }); prop(i, 'Percentual', pct); prop(i, 'Valores', valores); return i; }
function assinatura(estado) { return inst2('assinatura', { Estado: estado, Tema: TM() }); }
function toast(tipo, texto) { const i = inst2('toast', { Tipo: tipo, Tema: TM() }); prop(i, 'Texto', texto); return i; }
function skeleton(formato) { return inst2('skeleton', { Formato: formato, Tema: TM() }); }
function vazio(titulo, texto) { const i = inst2('vazio', { Tema: TM() }); prop(i, 'Título', titulo); prop(i, 'Texto', texto); return i; }
function veiculo(tipo) { return inst2('veiculo', { Tipo: tipo, Tema: TM() }); }
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
// ---------- Motorista · Mobile (modo escuro) ----------

function linhaQuebra(pai) {
  const l = AL('H', { gap: 8 });
  add(pai, l); fw(l);
  l.layoutWrap = 'WRAP';
  l.counterAxisSpacing = 8;
  return l;
}
async function passos(pai, n, nome) {
  const c = coluna(8);
  add(pai, c); fw(c);
  const barras = AL('H', { gap: 4 });
  add(c, barras); fw(barras);
  for (let i = 1; i <= 3; i++) { const r = ret(100, 4, i <= n ? 'faixa' : 'linha', 2); add(barras, r); r.layoutGrow = 1; }
  add(c, await T(`Passo ${n} de 3 · ${nome}`, 'Pequeno/SemiBold', 'texto-secundario'));
}
async function cartaoTitulo(pai, tituloTxt, o = {}) {
  const c = cartao(o);
  add(pai, c); fw(c);
  if (tituloTxt) await titulo(c, tituloTxt);
  return c;
}
async function linhaToggle(pai, rotulo, on) {
  const l = linhaH(12);
  add(pai, l); fw(l);
  const t = await T(rotulo, 'Corpo/Regular'); add(l, t); t.layoutGrow = 1;
  add(l, toggle(on));
}
async function veiculoLinha(pai, tipo, placaTxt, desc, rntrc, o = {}) {
  const l = cartao({ nome: 'Caminhão · ' + placaTxt, borda: o.selecionado ? 'faixa' : 'linha', bw: o.selecionado ? 2 : 1 });
  l.layoutMode = 'HORIZONTAL'; l.counterAxisAlignItems = 'CENTER';
  add(pai, l); fw(l);
  const v = veiculo(tipo); v.rescale(0.6); add(l, v);
  const col = coluna(4); add(l, col); col.layoutGrow = 1;
  add(col, await placa(placaTxt));
  await TQ(col, desc, 'Pequeno/SemiBold');
  if (rntrc) await TQ(col, rntrc, 'Legenda/Regular', 'texto-secundario');
  if (o.motivo) await TQ(col, o.motivo, 'Legenda/SemiBold', 'alerta');
  if (o.desabilitado) l.opacity = 0.55;
  return l;
}

async function mDetalhe(aCombinar) {
  const { f, body, rodape } = await telaMobile('Motorista / Detalhe do frete' + (aCombinar ? ' / A combinar' : ''),
    { titulo: 'Frete #4821', sub: 'Publicado há 2 h · Cerâmica Paulista', voltar: true, acoes: ['calculadora'], rodape: true });
  add(body, mapa(358, 160));
  const r = await rota('Vertical', 'Campinas/SP', 'Rio de Janeiro/RJ', '430 km'); add(body, r); fw(r);
  const info = linhaQuebra(body);
  add(info, icone('map-pin', 'texto-secundario', 16), await T('a 23 km de você', 'Pequeno/SemiBold', 'texto-secundario'),
    icone('calendario', 'texto-secundario', 16), await T('Coleta sex, 23 out · 07:00', 'Pequeno/SemiBold', 'texto-secundario'));
  const cv = await cartaoTitulo(body, null, { nome: 'Valor' });
  if (!aCombinar) {
    const lv = linhaH(6, { alinha: 'MAX' }); add(cv, lv);
    add(lv, await T('R$', 'Mobile/H3', 'texto-secundario'), await T('7.800', 'Valor/G'));
    const l2 = linhaQuebra(cv);
    add(l2, await T('R$ 18,14/km', 'Corpo/SemiBold', 'texto-secundario'), piso('Normal', 'R$ 7.350'));
  } else {
    add(cv, await T('A combinar', 'Valor/M'));
    await TQ(cv, 'A empresa quer receber propostas. Piso ANTT desta rota: R$ 7.350.', 'Pequeno/Regular', 'texto-secundario');
  }
  add(cv, selo('Grande'));
  await TQ(cv, 'A empresa paga por Pix no aceite. O dinheiro fica guardado até você entregar.', 'Pequeno/Regular', 'texto-secundario');
  const cc = await cartaoTitulo(body, 'Carga');
  await kv(cc, 'Descrição', 'Pisos cerâmicos');
  await kv(cc, 'Espécie', 'Paletizada');
  await kv(cc, 'Tipo ANTT', 'Carga geral');
  await kv(cc, 'Peso', '24.000 kg');
  const cr = await cartaoTitulo(body, 'Requisitos');
  const tags = linhaQuebra(cr);
  add(tags, await tag('Carreta', 'texto', 'caminhao'), await tag('Carreta LS', 'texto', 'caminhao'), await tag('Baú', 'texto'), await tag('Sider', 'texto'), await tag('Rastreador obrigatório', 'info', 'rastreador'));
  const ce = await cartaoTitulo(body, null, { nome: 'Empresa' });
  const topo = linhaH(12); add(ce, topo);
  const ce2 = coluna(2); add(topo, await avatar('CP', 48), ce2);
  add(ce2, await T('Cerâmica Paulista Ltda', 'Corpo/SemiBold'), await T('Embarcador · na Fretaí desde mar 2025', 'Pequeno/Regular', 'texto-secundario'));
  const st = AL('H', { gap: 12 }); add(ce, st); fw(st);
  for (const [v, l, cor] of [['★ 4,8', '126 avaliações', 'texto'], ['312', 'fretes concluídos', 'texto'], ['96%', 'saldos pagos em dia', 'garantido']]) {
    const c = coluna(2); add(st, c); c.layoutGrow = 1;
    add(c, await T(v, 'Valor/M', cor)); await TQ(c, l, 'Legenda/Regular', 'texto-secundario');
  }
  add(ce, await T('Ver avaliações', 'Pequeno/SemiBold', 'info'));
  let aceitar = null, propor;
  if (!aCombinar) {
    propor = botao('Secundário', 'Fazer proposta'); add(rodape, propor);
    aceitar = botao('Primário', 'Aceitar por R$ 7.800'); add(rodape, aceitar); aceitar.layoutGrow = 1;
  } else {
    propor = botao('Primário', 'Fazer proposta'); add(rodape, propor); propor.layoutGrow = 1;
  }
  return { f, propor, aceitar };
}

async function mFiltros() {
  const { f, body } = await telaMobile('Motorista / Fretes (busca) / Filtros', { titulo: 'Perto de Campinas/SP', acoes: ['filtros', 'sino'], nav: 'Fretes' });
  for (let i = 0; i < 2; i++) { const c = inst('card', { Tipo: 'Com valor' }); add(body, c); fw(c); }
  const s = sheetBase('Bottom sheet · Filtros');
  const h = linhaH(8); add(s, h); fw(h);
  const t = await T('Filtros', 'Mobile/H2'); add(h, t); t.layoutGrow = 1;
  add(h, await T('Limpar', 'Corpo/SemiBold', 'info'));
  const d = campo('Destino (opcional)', 'Cidade ou CEP', 'Vazio'); add(s, d); fw(d);
  add(s, await T('Tipo de veículo', 'Pequeno/SemiBold', 'texto-secundario'));
  const tv = linhaQuebra(s);
  for (const [r, a] of [['Carreta', true], ['Carreta LS', true], ['Bitrem', false], ['Truck', false], ['Bitruck', false], ['Toco', false]]) add(tv, chip(r, a));
  add(s, await T('Carroceria', 'Pequeno/SemiBold', 'texto-secundario'));
  const tc = linhaQuebra(s);
  for (const [r, a] of [['Baú', true], ['Sider', true], ['Graneleiro', false], ['Grade baixa', false]]) add(tc, chip(r, a));
  for (const [rot, val] of [['Exige rastreador', 'Tanto faz'], ['Publicado por agenciador', 'Não'], ['Com preço definido', 'Sim'], ['Complemento de carga', 'Tanto faz']]) {
    const c = coluna(6); add(s, c); fw(c);
    add(c, await T(rot, 'Pequeno/SemiBold', 'texto-secundario'));
    const sg = segmentado(val); add(c, sg); fw(sg);
  }
  const b = botao('Primário', 'Ver 18 fretes'); add(s, b); fw(b);
  montarSheet(f, s);
  return f;
}

async function mBuscaMapa() {
  const { f, body } = await telaMobile('Motorista / Fretes (busca) / Mapa', { titulo: 'Perto de Campinas/SP', acoes: ['filtros', 'sino'], nav: 'Fretes', pad: 0, gap: 0 });
  const chips = linhaH(8, { pad: [8, 16, 12, 16] }); add(body, chips); fw(chips);
  add(chips, chip('50 km'), chip('100 km', true), chip('200 km'), chip('Lista'), chip('Mapa', true));
  const m = mapa(390, 420); add(body, m); m.cornerRadius = 0;
  for (const [x, y] of [[120, 120], [250, 210], [90, 300]]) { const p = icone('map-pin', 'faixa', 28); m.appendChild(p); p.x = x; p.y = y; }
  const pe = coluna(8, { pad: [12, 16] }); add(body, pe); fw(pe);
  add(pe, await T('3 fretes no mapa · toque num pino', 'Pequeno/SemiBold', 'texto-secundario'));
  const c = inst('card', { Tipo: 'Com valor' }); add(pe, c); fw(c);
  return f;
}

async function mProposta() {
  const { f, body } = await telaMobile('Motorista / Enviar proposta', { titulo: 'Frete #4821', sub: 'Publicado há 2 h · Cerâmica Paulista', voltar: true });
  add(body, mapa(358, 160));
  const s = sheetBase('Bottom sheet · Fazer proposta');
  const h = coluna(2); add(s, h); fw(h);
  add(h, await T('Fazer proposta', 'Mobile/H2'));
  await TQ(h, 'Campinas/SP → Rio de Janeiro/RJ · 430 km', 'Pequeno/Regular', 'texto-secundario');
  add(s, await T('Caminhão', 'Pequeno/SemiBold', 'texto-secundario'));
  await veiculoLinha(s, 'CARRETA', 'RIO2A19', 'Carreta · 5 eixos · Baú · rastreador', null, { selecionado: true });
  await veiculoLinha(s, 'TRUCK', 'QWE4F56', 'Truck · 3 eixos · Sider', null, { desabilitado: true, motivo: 'Este frete não aceita Truck' });
  const v = campo('Seu valor', 'R$ 7.800', 'Foco', 'R$ 18,14/km · R$ 450 acima do piso ANTT (R$ 7.350)'); add(s, v); fw(v);
  const a = adiantamento('40%', 'R$ 3.120 na saída · R$ 4.680 na entrega'); add(s, a); fw(a);
  const p = campo('Prazo de entrega', 'sáb, 24 out · até 18:00'); add(s, p); fw(p);
  const o = campo('Observação (opcional)', 'Ex.: posso carregar na quinta à tarde', 'Vazio'); add(s, o); fw(o);
  const b = botao('Primário', 'Enviar proposta'); add(s, b); fw(b);
  montarSheet(f, s);
  return { f, enviar: b };
}

async function mCalculadora(erro) {
  const { f, body, rodape } = await telaMobile('Motorista / Calculadora' + (erro ? ' / Erro' : ''), { titulo: 'Esse frete paga?', sub: 'Frete #4821 · Campinas/SP → Rio de Janeiro/RJ', voltar: true, rodape: true });
  if (erro) { const a = aviso('Perigo', 'Confira os campos', 'O consumo precisa ser maior que zero.'); add(body, a); fw(a); }
  const par = (a, b) => { const l = AL('H', { gap: 12 }); add(body, l); fw(l); add(l, a, b); a.layoutGrow = 1; b.layoutGrow = 1; };
  par(campo('Distância', '430 km'), campo('Eixos', '5'));
  par(erro ? campo('Consumo', '0', 'Erro', 'Informe um consumo maior que zero.') : campo('Consumo', '2,4 km/l'), campo('Diesel', 'R$ 6,29/l'));
  par(campo('Pedágio', 'R$ 412,00'), campo('Outros custos', 'R$ 250,00'));
  const tc = campo('Tipo de carga', 'Carga geral'); add(body, tc); fw(tc);
  const vf = campo('Valor do frete', 'R$ 7.800'); add(body, vf); fw(vf);
  if (!erro) {
    const r = await cartaoTitulo(body, null, { nome: 'Resultado', borda: 'garantido', bw: 2 });
    add(r, await T('Sobra para você', 'Pequeno/SemiBold', 'texto-secundario'));
    add(r, await T('R$ 6.011,04', 'Valor/G', 'garantido'));
    await kv(r, 'Combustível (179 l)', 'R$ 1.126,96');
    await kv(r, 'Pedágio', 'R$ 412,00');
    await kv(r, 'Outros custos', 'R$ 250,00');
    divisoria(r);
    await kv(r, 'Custo total', 'R$ 1.788,96');
    const lp = linhaH(8, { just: 'SPACE_BETWEEN' }); add(r, lp); fw(lp);
    add(lp, await T('Piso ANTT', 'Corpo/Regular', 'texto-secundario'), piso('Exemplo', 'R$ 7.350'));
    await TQ(r, 'Valores de referência de exemplo.', 'Legenda/Regular', 'texto-secundario');
  }
  const b = botao('Primário', 'Calcular'); add(rodape, b); b.layoutGrow = 1;
  return f;
}

async function mMeusFretes(aceita) {
  const { f, body } = await telaMobile('Motorista / Meus fretes' + (aceita ? ' / Proposta aceita' : ''), { titulo: 'Meus fretes', nav: 'Meus fretes' });
  const ab = await abas(['Propostas', 'Em andamento', 'Concluídos'], 'Propostas'); add(body, ab); fw(ab);
  const itens = [
    [aceita ? 'PROP_ACEITA' : 'PROP_ENVIADA', 'Campinas/SP → Rio de Janeiro/RJ', 'Sua proposta R$ 7.800 · 40% na saída', aceita ? 'Aceita agora há pouco' : 'Enviada há 12 min', !aceita],
    ['PROP_ENVIADA', 'Sorocaba/SP → Curitiba/PR', 'Sua proposta R$ 4.560 · 30% na saída', 'Enviada ontem', true],
    ['PROP_RECUSADA', 'Cuiabá/MT → Belém/PA', 'Sua proposta R$ 14.900 · 50% na saída', 'Recusada em 18 out', false],
    ['PROP_RETIRADA', 'Uberlândia/MG → Goiânia/GO', 'Sua proposta R$ 3.100', 'Você retirou em 15 out', false],
  ];
  let primeiro = null;
  for (const [st, rt, val, quando, retirar] of itens) {
    const c = await cartaoTitulo(body, null, { nome: 'Proposta · ' + rt, gap: 8 });
    if (!primeiro) primeiro = c;
    const l = linhaH(8); add(c, l); fw(l);
    const t = await T(rt, 'Corpo/SemiBold'); add(l, t); quebra(t);
    add(l, badge(st));
    await TQ(c, val, 'Pequeno/Regular');
    await TQ(c, quando, 'Legenda/Regular', 'texto-secundario');
    if (retirar) add(c, botao('Fantasma', 'Retirar proposta', 'M'));
  }
  let t = null;
  if (aceita) {
    t = toast('Sucesso', 'Proposta aceita! A Cerâmica Paulista fechou com você por R$ 7.800.');
    f.appendChild(t);
    t.layoutPositioning = 'ABSOLUTE';
    t.x = 16; t.y = 52;
    t.name = 'Toast · Proposta aceita';
  }
  return { f, toast: t, primeiro };
}

async function mAndamento(estado) {
  const pend = estado === 'Pendente';
  const { f, body, rodape } = await telaMobile('Motorista / Frete em andamento / ' + (pend ? 'Aguardando Pix' : 'Pagamento garantido'),
    { titulo: 'Frete #4821', sub: 'Cerâmica Paulista · RIO2A19', voltar: true, rodape: true, badge: badge('ACEITO') });
  const a = pend
    ? aviso('Alerta', 'Aguardando o Pix da empresa', 'Não carregue ainda. A gente avisa quando o dinheiro estiver guardado.')
    : aviso('Sucesso', 'Pagamento garantido', 'O dinheiro já está guardado. Pode carregar.');
  add(body, a); fw(a);
  const m = medidor(pend ? 'Pendente' : 'Retido'); add(body, m); fw(m);
  const tl = timeline('Vertical', 'ACEITO'); add(body, tl); fw(tl);
  const cc = await cartaoTitulo(body, 'Coleta');
  await TQ(cc, 'Rua Dr. Sales de Oliveira, 1.661 · Vila Industrial, Campinas/SP · 13050-000', 'Corpo/Regular');
  await kv(cc, 'Quando', 'sex, 23 out · 07:00');
  const cd = await cartaoTitulo(body, 'Documentos do frete');
  const tg = linhaQuebra(cd);
  add(tg, await tag('CNH enviada', 'garantido', 'shield-check'), await tag('CRLV pendente', 'alerta', 'documento'));
  add(cd, botao('Secundário', 'Enviar CRLV', 'M'));
  const b = botao(pend ? 'Secundário' : 'Primário', pend ? 'Iniciar viagem · após o Pix' : 'Iniciar viagem');
  add(rodape, b); b.layoutGrow = 1;
  if (pend) b.opacity = 0.5;
  return { f, acao: b, aviso: a };
}

async function mCanhoto1() {
  const { f, body, rodape } = await telaMobile('Motorista / Canhoto · 1 Foto', { titulo: 'Registrar entrega', sub: 'Frete #4821 · Rio de Janeiro/RJ', fechar: true, rodape: true });
  await passos(body, 1, 'Foto da entrega');
  const vis = AL('V', { nome: 'Visor da câmera', gap: 12, alinha: 'CENTER', just: 'CENTER', fill: 'superficie-elevada', r: 12, borda: 'linha' });
  add(body, vis); fw(vis); fh(vis);
  add(vis, icone('camera', 'texto-secundario', 48));
  const t = await T('Enquadre a carga entregue e a nota fiscal', 'Corpo/Regular', 'texto-secundario', { centro: true }); add(vis, t);
  rodape.primaryAxisAlignItems = 'CENTER';
  const disparo = AL('H', { nome: 'Botão · Tirar foto', just: 'CENTER', alinha: 'CENTER', fill: 'faixa' });
  WH(disparo, 72, 72); disparo.cornerRadius = 36;
  add(disparo, icone('camera', 'sobre-faixa', 32));
  add(rodape, disparo);
  return { f, acao: disparo };
}

async function mCanhoto2() {
  const { f, body, rodape } = await telaMobile('Motorista / Canhoto · 2 Assinatura', { titulo: 'Registrar entrega', sub: 'Frete #4821 · Rio de Janeiro/RJ', fechar: true, rodape: true });
  await passos(body, 2, 'Quem recebeu');
  const n = campo('Nome de quem recebeu', 'Roberto Lima'); add(body, n); fw(n);
  const a = assinatura('Assinada'); add(body, a); fw(a);
  await TQ(body, 'Peça para o recebedor assinar com o dedo. A assinatura vai junto com a foto e o GPS.', 'Pequeno/Regular', 'texto-secundario');
  add(rodape, botao('Secundário', 'Voltar'));
  const b = botao('Primário', 'Continuar'); add(rodape, b); b.layoutGrow = 1;
  return { f, acao: b };
}

async function mCanhoto3(ok) {
  const { f, body, rodape } = await telaMobile('Motorista / Canhoto · 3 Local' + (ok ? '' : ' / Longe do destino'), { titulo: 'Registrar entrega', sub: 'Frete #4821 · Rio de Janeiro/RJ', fechar: true, rodape: true });
  await passos(body, 3, 'Conferir local');
  add(body, mapa(358, 220, { raio: 110 }));
  const a = ok
    ? aviso('Sucesso', 'Você está a 60 m do destino ✓', 'Rua Uruguai, 1.250 · Tijuca, Rio de Janeiro/RJ. O canhoto vale até 500 m do endereço.')
    : aviso('Perigo', 'Você está a 3,2 km do destino', 'O canhoto só vale a até 500 m do endereço de entrega. Chegue mais perto e atualize.');
  add(body, a); fw(a);
  const r = await cartaoTitulo(body, 'Resumo do canhoto');
  await kv(r, 'Foto', '1 foto ✓');
  await kv(r, 'Recebedor', 'Roberto Lima');
  await kv(r, 'Assinatura', 'Coletada ✓');
  const b = ok ? botao('Primário', 'Enviar canhoto') : botao('Secundário', 'Atualizar localização');
  add(rodape, b); b.layoutGrow = 1;
  return { f, acao: b };
}

async function mCanhotoEnviado() {
  const { f, body, rodape } = await telaMobile('Motorista / Canhoto · Enviado', { rodape: true, pad: [48, 24, 24, 24] });
  body.counterAxisAlignItems = 'CENTER';
  const ok = AL('H', { just: 'CENTER', alinha: 'CENTER', fill: 'garantido-fundo' });
  WH(ok, 96, 96); ok.cornerRadius = 48;
  add(ok, icone('check', 'garantido', 48));
  add(body, ok);
  const t = await T('Entrega registrada', 'Mobile/H1', 'texto', { centro: true }); add(body, t); quebra(t);
  const s = await T('O saldo de R$ 4.680 sai em 24 h se ninguém contestar.', 'Corpo/Regular', 'texto-secundario', { centro: true }); add(body, s); quebra(s);
  const c = await cartaoTitulo(body, null, { nome: 'Contagem' });
  c.counterAxisAlignItems = 'CENTER';
  add(c, await T('Prazo de contestação termina em', 'Pequeno/SemiBold', 'texto-secundario'));
  add(c, await T('23:59:12', 'Valor/G'));
  const m = medidor('Adiantamento liberado'); add(body, m); fw(m);
  add(rodape, botao('Fantasma', 'Meus fretes'));
  const b = botao('Primário', 'Avaliar a empresa'); add(rodape, b); b.layoutGrow = 1;
  return { f, acao: b };
}

async function mRetorno() {
  const { f, body } = await telaMobile('Motorista / Fretes de retorno', { titulo: 'Fretes de retorno', sub: 'Saindo perto de Rio de Janeiro/RJ · para sua Carreta Baú', voltar: true, nav: 'Fretes' });
  const a = aviso('Info', 'Não volte vazio', '3 fretes saindo até 100 km de onde você entrega, compatíveis com seu caminhão.'); add(body, a); fw(a);
  const ch = linhaH(8); add(body, ch);
  add(ch, chip('50 km'), chip('100 km', true), chip('200 km'));
  for (const [dest, km] of [['São Paulo/SP', '430 km'], ['Belo Horizonte/MG', '440 km'], ['Vitória/ES', '520 km']]) {
    const c = inst('card', { Tipo: 'Com valor' }); add(body, c); fw(c);
    await txt(c, 'origem', 'Rio de Janeiro/RJ'); await txt(c, 'destino', dest); await txt(c, 'km', km);
  }
  return f;
}

async function mCarteira(semPix) {
  const { f, body } = await telaMobile('Motorista / Carteira' + (semPix ? ' / Sem chave Pix' : ''), { titulo: 'Carteira', nav: 'Carteira' });
  const r = await cartaoTitulo(body, null, { nome: 'A receber' });
  add(r, await T('A receber', 'Pequeno/SemiBold', 'texto-secundario'));
  const lv = linhaH(6, { alinha: 'MAX' }); add(r, lv);
  add(lv, await T('R$', 'Mobile/H3', 'texto-secundario'), await T('9.240', 'Valor/G'));
  await TQ(r, 'Em 2 fretes. Cada saldo sai depois da entrega comprovada.', 'Pequeno/Regular', 'texto-secundario');
  await kv(r, 'Já recebido em outubro', 'R$ 7.220', { cor: 'garantido' });
  if (semPix) {
    const a = aviso('Alerta', 'Cadastre sua chave Pix', 'Sem chave Pix a empresa não consegue gerar o pagamento.'); add(body, a); fw(a);
    const b = botao('Primário', 'Cadastrar chave Pix'); add(body, b); fw(b);
  } else {
    const p = await cartaoTitulo(body, null, { nome: 'Chave Pix' });
    p.layoutMode = 'HORIZONTAL'; p.counterAxisAlignItems = 'CENTER';
    add(p, icone('pix', 'texto', 24));
    const col = coluna(2); add(p, col); col.layoutGrow = 1;
    add(col, await T('Chave Pix · CPF', 'Pequeno/SemiBold', 'texto-secundario'), await T('***.482.917-**', 'Mono/M'));
    add(p, await T('Trocar', 'Pequeno/SemiBold', 'info'));
  }
  await titulo(body, 'Por frete');
  for (const [rt, st, med, linhas] of [
    ['#4821 · Campinas/SP → Rio de Janeiro/RJ', 'PAG_ADIANTAMENTO', 'Adiantamento liberado', [['Recebido na saída', 'R$ 3.120', 'garantido'], ['A receber na entrega', 'R$ 4.680', 'texto']]],
    ['#4790 · Sorocaba/SP → Curitiba/PR', 'PAG_RETIDO', 'Retido', [['Guardado', 'R$ 4.560', 'garantido'], ['Sai na saída (30%)', 'R$ 1.368', 'texto']]],
    ['#4655 · Ribeirão Preto/SP → Belo Horizonte/MG', 'PAG_LIBERADO', 'Liberado', [['Recebido', 'R$ 4.100', 'garantido'], ['Saldo pago em', '14 out', 'texto']]],
  ]) {
    const c = await cartaoTitulo(body, null, { nome: rt });
    const l = linhaH(8); add(c, l); fw(l);
    const t = await T(rt, 'Pequeno/SemiBold'); add(l, t); quebra(t);
    add(l, badge(st));
    const m = medidor(med); add(c, m); fw(m);
    for (const [k, v, cor] of linhas) await kv(c, k, v, { cor });
  }
  const b = botao('Fantasma', 'Calculadora: esse frete paga?'); add(body, b); fw(b);
  return f;
}

async function mPerfil() {
  const { f, body } = await telaMobile('Motorista / Perfil', { titulo: 'Perfil', nav: 'Perfil' });
  const topo = linhaH(16); add(body, topo); fw(topo);
  add(topo, await avatar('JA', 64));
  const col = coluna(4); add(topo, col); col.layoutGrow = 1;
  add(col, await T('José Almeida', 'Mobile/H2'), await T('Na Fretaí desde jan 2025', 'Pequeno/Regular', 'texto-secundario'));
  const nt = linhaH(6); add(col, nt); add(nt, estrelas(5, 16), await T('4,9 · 58 avaliações', 'Pequeno/SemiBold'));
  const st = AL('H', { gap: 12 }); add(body, st); fw(st);
  for (const [v, l] of [['41', 'fretes concluídos'], ['4,9', 'nota média']]) {
    const c = cartao({ gap: 2 }); add(st, c); c.layoutGrow = 1;
    add(c, await T(v, 'Valor/M')); await TQ(c, l, 'Legenda/Regular', 'texto-secundario');
  }
  await titulo(body, 'Documentos verificados');
  const dv = linhaQuebra(body);
  add(dv, await tag('CNH verificada', 'garantido', 'shield-check'), await tag('CRLV verificado', 'garantido', 'shield-check'));
  const ft = linhaH(8); add(body, ft); fw(ft);
  const tf = await T('Frota', 'Mobile/H3'); add(ft, tf); tf.layoutGrow = 1;
  add(ft, await T('Adicionar caminhão', 'Pequeno/SemiBold', 'info'));
  await veiculoLinha(body, 'CARRETA', 'RIO2A19', 'Carreta · 5 eixos · Baú', 'RNTRC 048213976 · com rastreador');
  await veiculoLinha(body, 'TRUCK', 'QWE4F56', 'Truck · 3 eixos · Sider', 'RNTRC 048213976 · sem rastreador');
  const pr = await cartaoTitulo(body, 'Preferências');
  await kv(pr, 'Base', 'Campinas/SP');
  await kv(pr, 'Aviso de frete novo', 'até 100 km');
  await linhaToggle(pr, 'Aceito frete em feriado', true);
  await kv(pr, 'Chave Pix', 'CPF ***.482.917-**');
  const b = botao('Fantasma', 'Sair da conta'); add(body, b); fw(b);
  return f;
}

async function mAvaliar() {
  const { f, body, rodape } = await telaMobile('Motorista / Avaliar', { titulo: 'Avaliar empresa', fechar: true, rodape: true, pad: [24, 16] });
  body.counterAxisAlignItems = 'CENTER';
  add(body, await avatar('CP', 72));
  const t = await T('Como foi com a Cerâmica Paulista?', 'Mobile/H1', 'texto', { centro: true }); add(body, t); quebra(t);
  const s = await T('Frete #4821 · Campinas/SP → Rio de Janeiro/RJ', 'Pequeno/Regular', 'texto-secundario', { centro: true }); add(body, s); quebra(s);
  add(body, estrelas(4, 48));
  add(body, await T('Muito bom', 'Corpo/SemiBold', 'faixa'));
  const c = campo('Comentário (opcional)', 'Pagou certinho e a descarga foi rápida.', 'Preenchido', 'Aparece no perfil público da empresa.'); add(body, c); fw(c);
  const b = botao('Primário', 'Enviar avaliação'); add(rodape, b); b.layoutGrow = 1;
  return f;
}

async function motorista(pg) {
  TEMA = 'escuro';
  const sec = novaSecao(pg, 'Gerado · Motorista');
  const g = new Grade(sec);
  const R = {};
  const E = (base, o) => estadosMobile('Motorista / ' + base, o);

  await seguro('Motorista · Fretes (busca)', async () => {
    const est = await E('Fretes (busca)', { titulo: 'Perto de Campinas/SP', nav: 'Fretes',
      vazio: ['Nenhum frete nesse raio agora', 'Aumente para 200 km ou ative o aviso de frete novo.', 'Aumentar para 200 km'],
      erro: ['Não deu para buscar fretes', 'Confira sua conexão. Os fretes que você já viu continuam salvos.'] });
    await g.linha('Motorista / Fretes (busca) · mapa, filtros e estados', 'GET /api/fretes/busca?origemLat&origemLng&raioKm&exigeRastreador&agenciador&comPreco&complemento',
      [await mBuscaMapa(), await mFiltros()].concat(est));
  });
  await seguro('Motorista · Detalhe', async () => {
    const d = await mDetalhe(false); R.detalhe = d;
    const d2 = await mDetalhe(true);
    const est = await E('Detalhe do frete', { titulo: 'Frete #4821', voltar: true, erro: ['Não deu para abrir este frete', 'Ele pode ter sido cancelado. Volte para a lista e tente de novo.'] });
    await g.linha('Motorista / Detalhe do frete', 'GET /api/fretes/{id} · GET /api/empresas/{id}/perfil · POST /api/fretes/{id}/aceite', [d.f, d2.f].concat(est));
  });
  await seguro('Motorista · Enviar proposta', async () => {
    R.proposta = await mProposta();
    await g.linha('Motorista / Enviar proposta (bottom sheet)', 'POST /api/fretes/{freteId}/propostas · GET /api/motoristas/{motoristaId}/veiculos', [R.proposta.f]);
  });
  await seguro('Motorista · Calculadora', async () => {
    await g.linha('Motorista / Calculadora "esse frete paga?"', 'POST /api/calculadora/frete', [await mCalculadora(false), await mCalculadora(true)]);
  });
  await seguro('Motorista · Meus fretes', async () => {
    R.meus = await mMeusFretes(false);
    R.meusAceita = await mMeusFretes(true);
    const est = await E('Meus fretes', { titulo: 'Meus fretes', nav: 'Meus fretes',
      vazio: ['Você ainda não mandou proposta', 'Abra um frete e toque em Fazer proposta.', 'Ver fretes perto de mim'] });
    await g.linha('Motorista / Meus fretes', 'GET /api/propostas/minhas · POST /api/propostas/{id}/retirada', [R.meus.f, R.meusAceita.f].concat(est),
      'Abas Em andamento e Concluídos: precisa de API (listar fretes do motorista).');
  });
  await seguro('Motorista · Frete em andamento', async () => {
    R.aguardando = await mAndamento('Pendente');
    R.garantido = await mAndamento('Retido');
    const est = await E('Frete em andamento', { titulo: 'Frete #4821', voltar: true });
    await g.linha('Motorista / Frete em andamento · antes da viagem', 'GET /api/fretes/{id} · GET /api/fretes/{freteId}/pagamento · POST /api/fretes/{id}/inicio · POST /api/fretes/{freteId}/documentos',
      [R.aguardando.f, R.garantido.f].concat(est));
  });
  await seguro('Motorista · Canhoto', async () => {
    R.c1 = await mCanhoto1(); R.c2 = await mCanhoto2(); R.c3 = await mCanhoto3(true);
    const c3e = await mCanhoto3(false);
    R.enviado = await mCanhotoEnviado();
    await g.linha('Motorista / Canhoto digital (3 passos)', 'POST /api/fretes/{freteId}/canhoto (multipart: foto, assinatura PNG, latitude, longitude)',
      [R.c1.f, R.c2.f, R.c3.f, c3e.f, R.enviado.f]);
  });
  await seguro('Motorista · Avaliar', async () => {
    R.avaliar = await mAvaliar();
    await g.linha('Motorista / Avaliar', 'POST /api/fretes/{freteId}/avaliacoes', [R.avaliar]);
  });
  await seguro('Motorista · Fretes de retorno', async () => {
    R.retorno = await mRetorno();
    const est = await E('Fretes de retorno', { titulo: 'Fretes de retorno', voltar: true, nav: 'Fretes',
      vazio: ['Nenhum frete de volta por enquanto', 'Ative o aviso e a gente te chama quando aparecer um perto de Rio de Janeiro/RJ.', 'Ativar aviso'] });
    await g.linha('Motorista / Fretes de retorno', 'GET /api/fretes/{id}/retorno', [R.retorno].concat(est));
  });
  await seguro('Motorista · Carteira', async () => {
    const est = await E('Carteira', { titulo: 'Carteira', nav: 'Carteira',
      vazio: ['Nada a receber agora', 'Quando você fechar um frete, o adiantamento e o saldo aparecem aqui.', 'Ver fretes'] });
    await g.linha('Motorista / Carteira', 'GET /api/fretes/{freteId}/pagamento · PUT /api/motoristas/{id}/chave-pix',
      [await mCarteira(false), await mCarteira(true)].concat(est), 'Lista de pagamentos do motorista: precisa de API.');
  });
  await seguro('Motorista · Perfil', async () => {
    const est = await E('Perfil', { titulo: 'Perfil', nav: 'Perfil' });
    await g.linha('Motorista / Perfil', 'GET /api/motoristas/{id} · GET /api/motoristas/{id}/perfil · GET /api/motoristas/{motoristaId}/veiculos · PATCH /api/motoristas/{id}/preferencias',
      [await mPerfil()].concat(est));
  });
  g.fechar();
  return R;
}
// ---------- Empresa · Desktop e Admin (modo claro) ----------

async function celula(conteudo, largura, estilo = 'Pequeno/Regular', cor = 'texto') {
  const c = AL('H', { alinha: 'CENTER', gap: 8 });
  c.name = 'Célula';
  if (largura) W(c, largura);
  const n = typeof conteudo === 'string' ? await T(conteudo, estilo, cor) : conteudo;
  add(c, n);
  if (typeof conteudo === 'string' && largura) quebra(n);
  return c;
}
async function tabela(pai, colunas, linhas, o = {}) {
  const t = cartao({ nome: o.nome || 'Tabela', pad: 0, gap: 0 });
  t.clipsContent = true;
  add(pai, t); fw(t);
  const cab = AL('H', { nome: 'Cabeçalho da tabela', pad: [12, 16], gap: 16, fill: 'fundo', alinha: 'CENTER' });
  add(t, cab); fw(cab);
  for (const [tt, w] of colunas) {
    const c = await celula(tt.toUpperCase(), w, 'Legenda/SemiBold', 'texto-secundario');
    add(cab, c); if (!w) c.layoutGrow = 1;
  }
  const linhasNos = [];
  for (const l of linhas) {
    const r = AL('H', { nome: 'Linha', pad: [14, 16], gap: 16, alinha: 'CENTER' });
    bordaLado(r, 'topo');
    add(t, r); fw(r);
    for (let i = 0; i < colunas.length; i++) {
      const v = l[i];
      const c = await celula(v == null ? '' : v, colunas[i][1], i === 0 && o.primeiraMono ? 'Mono/P' : 'Pequeno/Regular');
      add(r, c);
      if (!colunas[i][1]) { c.layoutGrow = 1; const tx = c.children[0]; if (tx && tx.type === 'TEXT') quebra(tx); }
    }
    linhasNos.push(r);
  }
  return { t, linhas: linhasNos };
}
function montarModal(f, modal) {
  overlay(f, 'claro/texto', 0.45);
  f.appendChild(modal);
  modal.layoutPositioning = 'ABSOLUTE';
  modal.x = Math.round((f.width - modal.width) / 2);
  modal.y = Math.round((f.height - modal.height) / 2);
}
async function cabecalhoDetalhe(main, abaAtiva, etapa, status) {
  const col = coluna(12); add(main, col); fw(col);
  add(col, await T('Fretes / #4821', 'Pequeno/Regular', 'texto-secundario'));
  const tl = linhaH(12); add(col, tl);
  add(tl, await T('Campinas/SP — Rio de Janeiro/RJ', 'Desktop/H1'), badge(status));
  const meta = linhaQuebra(col);
  add(meta, await tag('430 km', 'texto-secundario', 'mapa'), await tag('Coleta sex, 23 out · 07:00', 'texto-secundario', 'calendario'),
    await tag('Pisos cerâmicos · 24.000 kg', 'texto-secundario', 'carga'), await tag('Carreta · Carreta LS · Baú · Sider', 'texto-secundario', 'caminhao'));
  const t = timeline('Horizontal', etapa); add(col, t); fw(t);
  const ab = await abas(['Propostas', 'Pagamento', 'Entrega', 'Documentos', 'Histórico', 'Avaliar motorista'], abaAtiva, true);
  add(col, ab); fw(ab);
}
function colunaFixa(pai, w, g = 16) { const c = coluna(g); add(pai, c); W(c, w); return c; }
function corpoH(main, g = 24) { const c = AL('H', { gap: g }); add(main, c); fw(c); return c; }

async function ePainel() {
  const { f, main } = await telaDesk('Empresa / Painel', { menu: 'Painel', titulo: 'Bom dia, Carla', sub: 'Cerâmica Paulista · Embarcador', acoes: [botao('Primário', 'Publicar frete', 'M')] });
  const k = corpoH(main, 16);
  for (const [rot, val, sub, cor] of [
    ['Fretes publicados', '12', 'em outubro', 'texto'], ['Propostas aguardando', '3', 'responda para não perder o motorista', 'texto'],
    ['Em trânsito', '2', 'acompanhando agora', 'texto'], ['Valor retido agora', 'R$ 17.360', 'guardado no provedor de pagamento', 'garantido'],
    ['Saldos pagos em dia', '96%', 'é o número que os motoristas veem', 'garantido']]) {
    const c = cartao({ gap: 4, pad: 20 }); add(k, c); c.layoutGrow = 1;
    await TQ(c, rot, 'Pequeno/SemiBold', 'texto-secundario');
    add(c, await T(val, 'Valor/G', cor));
    await TQ(c, sub, 'Legenda/Regular', 'texto-secundario');
  }
  const corpo = corpoH(main);
  const acao = cartao({ pad: 24, gap: 0 }); add(corpo, acao); acao.layoutGrow = 1;
  const ht = await T('Precisa da sua ação', 'Desktop/H3'); add(acao, ht);
  const esp = AL('V'); WH(esp, 10, 12); add(acao, esp);
  for (const [ic, cor, t1, t2, rot] of [
    ['lista', 'info', '3 propostas para Campinas/SP → Rio de Janeiro/RJ', 'Melhor valor R$ 7.450 · melhor reputação ★ 4,9', 'Comparar'],
    ['pix', 'alerta', 'Pix pendente · frete #4833', 'R$ 6.200 · vence hoje às 18:00', 'Pagar'],
    ['documento', 'info', 'Entrega registrada · frete #4802', 'Confira até 22 out · 14:30. Depois disso o saldo sai sozinho.', 'Conferir'],
    ['star', 'texto-secundario', 'Avalie Ana Paula Souza', 'Frete #4790 · entregue em 11 out', 'Avaliar']]) {
    const r = AL('H', { pad: [16, 0], gap: 16, alinha: 'CENTER' });
    bordaLado(r, 'topo');
    add(acao, r); fw(r);
    const b = AL('H', { just: 'CENTER', alinha: 'CENTER', fill: 'fundo' }); WH(b, 40, 40); b.cornerRadius = 20;
    add(b, icone(ic, cor, 20)); add(r, b);
    const col = coluna(2); add(r, col); col.layoutGrow = 1;
    await TQ(col, t1, 'Corpo/SemiBold'); await TQ(col, t2, 'Pequeno/Regular', 'texto-secundario');
    add(r, botao('Secundário', rot, 'M'));
  }
  const dir = colunaFixa(corpo, 400);
  const tr = cartao({ pad: 24 }); add(dir, tr); fw(tr);
  add(tr, await T('Em trânsito', 'Desktop/H3'));
  for (const [rt, med, sub] of [['#4815 · Jundiaí/SP → Vitória/ES', 'Adiantamento liberado', 'Saiu 20 out · previsão 22 out'], ['#4809 · Campinas/SP → Londrina/PR', 'Adiantamento liberado', 'Saiu 21 out · previsão 22 out']]) {
    const c = coluna(8); add(tr, c); fw(c);
    await TQ(c, rt, 'Corpo/SemiBold');
    await TQ(c, sub, 'Legenda/Regular', 'texto-secundario');
    const m = medidor(med); add(c, m); fw(m);
  }
  return f;
}

async function ePublicar(erro) {
  const { f, main } = await telaDesk('Empresa / Publicar frete' + (erro ? ' / Erro' : ''), { menu: 'Publicar frete', altura: 1640, titulo: 'Publicar frete', sub: 'Preencha de cima para baixo. O resumo ao lado atualiza sozinho.' });
  if (erro) { const a = aviso('Perigo', 'Confira os campos', '2 campos precisam de ajuste antes de publicar.'); add(main, a); fw(a); }
  const corpo = corpoH(main);
  const form = coluna(16); add(corpo, form); form.layoutGrow = 1;
  const par = (pai, a, b, wb) => { const l = AL('H', { gap: 16 }); add(pai, l); fw(l); add(l, a, b); a.layoutGrow = 1; if (wb) largura(b, wb); else b.layoutGrow = 1; };
  const sec = async (t) => { const c = cartao({ pad: 24, gap: 16 }); add(form, c); fw(c); add(c, await T(t, 'Desktop/H3')); return c; };
  const s1 = await sec('1 · Coleta e entrega');
  par(s1, erro ? campo('CEP da coleta', '13050-999', 'Erro', 'CEP não encontrado. Confira os números.') : campo('CEP da coleta', '13050-000', 'Preenchido', 'Rua Dr. Sales de Oliveira · Vila Industrial, Campinas/SP'), campo('Número', '1.661'), 160);
  par(s1, campo('CEP da entrega', '20510-060', 'Preenchido', 'Rua Uruguai · Tijuca, Rio de Janeiro/RJ'), campo('Número', '1.250'), 160);
  par(s1, campo('Data da coleta', '23/10/2026 · 07:00', 'Preenchido', 'Sexta-feira · dia útil'), campo('Quem recebe', 'Roberto Lima · (21) 98877-6655'));
  const s2 = await sec('2 · Carga');
  par(s2, campo('Descrição', 'Pisos cerâmicos'), campo('Espécie', 'Paletizada'));
  par(s2, campo('Tipo de carga ANTT', 'Carga geral'), erro ? campo('Peso', '', 'Erro', 'Informe o peso em kg.') : campo('Peso', '24.000 kg'));
  const s3 = await sec('3 · Requisitos');
  add(s3, await T('Tipos de veículo aceitos', 'Pequeno/SemiBold', 'texto-secundario'));
  const gv = linhaQuebra(s3);
  gv.itemSpacing = 12; gv.counterAxisSpacing = 12;
  for (const [tipo, nome, eixos] of VEICULOS) {
    const sel = tipo === 'CARRETA' || tipo === 'CARRETA_LS';
    const c = cartao({ pad: 12, gap: 6, borda: sel ? 'faixa' : 'linha', bw: sel ? 2 : 1 });
    W(c, 152);
    const v = veiculo(tipo); v.rescale(0.75); add(c, v);
    add(c, await T(`${nome} · ${eixos} eixos`, 'Legenda/SemiBold', sel ? 'texto' : 'texto-secundario'));
    add(gv, c);
  }
  add(s3, await T('Carrocerias', 'Pequeno/SemiBold', 'texto-secundario'));
  const gc = linhaQuebra(s3);
  for (const [r, a] of [['Baú', true], ['Sider', true], ['Baú frigorífico', false], ['Caçamba', false], ['Grade baixa', false], ['Graneleiro', false], ['Prancha', false], ['Tanque', false], ['Cegonha', false]]) add(gc, chip(r, a));
  await linhaToggle(s3, 'Exige rastreador', true);
  await linhaToggle(s3, 'Aceita complemento de carga', false);
  const s4 = await sec('4 · Valor');
  const op = linhaH(8); add(s4, op); add(op, chip('Valor definido', true), chip('A combinar'));
  const vv = campo('Valor do frete', 'R$ 7.800', 'Preenchido', 'R$ 18,14/km · acima do piso ANTT'); add(s4, vv); largura(vv, 320);
  const dir = colunaFixa(corpo, 380);
  const r = cartao({ pad: 24, gap: 16 }); add(dir, r); fw(r);
  add(r, await T('Resumo', 'Desktop/H3'));
  const rt = await rota('Vertical', 'Campinas/SP', 'Rio de Janeiro/RJ', '430 km'); add(r, rt); fw(rt);
  await kv(r, 'Distância', '430 km (estimada)');
  await kv(r, 'Valor', 'R$ 7.800');
  await kv(r, 'R$/km', 'R$ 18,14');
  const lp = linhaH(8, { just: 'SPACE_BETWEEN' }); add(r, lp); fw(lp);
  add(lp, await T('Piso ANTT', 'Corpo/Regular', 'texto-secundario'), piso('Exemplo', 'R$ 7.350'));
  const a = aviso('Info', 'Coeficientes de exemplo', 'O piso usa valores de referência de exemplo até a tabela da ANTT ser preenchida.'); add(r, a); fw(a);
  const pub = botao('Primário', 'Publicar frete'); add(r, pub); fw(pub);
  await TQ(r, 'O Pix só é cobrado depois que você aceitar um motorista.', 'Legenda/Regular', 'texto-secundario');
  return { f, publicar: pub };
}

async function eFretesTabela() {
  const vis = linhaH(8); add(vis, chip('Lista', true), chip('Quadro'));
  const { f, main } = await telaDesk('Empresa / Fretes · Lista', { menu: 'Fretes', titulo: 'Fretes', sub: '38 fretes · 7 em aberto', acoes: [vis, botao('Primário', 'Publicar frete', 'M')] });
  const fl = linhaQuebra(main);
  for (const [r, a] of [['Todos · 38', true], ['Aguardando propostas · 4'], ['Com propostas · 3'], ['Motorista a caminho · 1'], ['Em trânsito · 2'], ['Entregue · 1'], ['Concluído e pago · 26'], ['Cancelado · 1']]) add(fl, chip(r, !!a));
  const pn = (v) => piso('Normal', v);
  await tabela(main, [['#', 80], ['Rota', null], ['Coleta', 140], ['Valor', 120], ['Piso ANTT', 170], ['Status', 230], ['Propostas', 100]], [
    ['#4821', 'Campinas/SP → Rio de Janeiro/RJ', '23 out · 07:00', 'R$ 7.800', pn('R$ 7.350'), badge('PROPOSTA_ENVIADA'), '3'],
    ['#4840', 'Campinas/SP → Curitiba/PR', '25 out · 07:00', 'A combinar', pn('R$ 4.870'), badge('PUBLICADO'), '0'],
    ['#4838', 'Mogi Guaçu/SP → Porto Alegre/RS', '24 out · 09:00', 'R$ 9.100', piso('Abaixo do piso', 'R$ 9.480'), badge('PUBLICADO'), '1'],
    ['#4833', 'Jundiaí/SP → Belo Horizonte/MG', '22 out · 08:00', 'R$ 6.200', pn('R$ 5.980'), badge('ACEITO'), '—'],
    ['#4815', 'Jundiaí/SP → Vitória/ES', '20 out · 06:00', 'R$ 8.900', pn('R$ 8.410'), badge('EM_TRANSITO'), '—'],
    ['#4802', 'Campinas/SP → Goiânia/GO', '18 out · 07:00', 'R$ 7.300', pn('R$ 6.950'), badge('ENTREGUE'), '—'],
    ['#4790', 'Limeira/SP → Uberlândia/MG', '10 out · 07:00', 'R$ 5.600', pn('R$ 4.920'), badge('PAGO'), '—'],
    ['#4777', 'Campinas/SP → Salvador/BA', '08 out · 06:00', 'R$ 14.200', pn('R$ 13.600'), badge('CANCELADO'), '—'],
  ], { primeiraMono: true });
  return f;
}

async function eFretesQuadro() {
  const vis = linhaH(8); add(vis, chip('Lista'), chip('Quadro', true));
  const { f, main } = await telaDesk('Empresa / Fretes · Quadro', { menu: 'Fretes', titulo: 'Fretes', sub: '38 fretes · 7 em aberto', acoes: [vis, botao('Primário', 'Publicar frete', 'M')] });
  const q = corpoH(main, 12);
  let alvo = null;
  const dados = [
    ['PUBLICADO', [['#4840', 'Campinas/SP → Curitiba/PR', 'A combinar', '25 out'], ['#4838', 'Mogi Guaçu/SP → Porto Alegre/RS', 'R$ 9.100', '24 out']]],
    ['PROPOSTA_ENVIADA', [['#4821', 'Campinas/SP → Rio de Janeiro/RJ', 'R$ 7.800 · 3 propostas', '23 out']]],
    ['ACEITO', [['#4833', 'Jundiaí/SP → Belo Horizonte/MG', 'R$ 6.200 · Pix pendente', '22 out']]],
    ['EM_TRANSITO', [['#4815', 'Jundiaí/SP → Vitória/ES', 'R$ 8.900', '20 out'], ['#4809', 'Campinas/SP → Londrina/PR', 'R$ 5.400', '21 out']]],
    ['ENTREGUE', [['#4802', 'Campinas/SP → Goiânia/GO', 'R$ 7.300', '18 out']]],
    ['PAGO', [['#4790', 'Limeira/SP → Uberlândia/MG', 'R$ 5.600', '10 out'], ['#4781', 'Campinas/SP → Santos/SP', 'R$ 2.300', '07 out']]],
  ];
  for (const [st, cards] of dados) {
    const col = AL('V', { nome: 'Coluna · ' + st, pad: 8, gap: 8, r: 12, borda: 'linha' });
    add(q, col); col.layoutGrow = 1;
    const h = linhaH(8, { pad: [4, 4] }); add(col, h); fw(h);
    add(h, badge(st), await T(String(cards.length), 'Pequeno/SemiBold', 'texto-secundario'));
    for (const [id, rt, val, dt] of cards) {
      const c = cartao({ pad: 12, gap: 4, nome: 'Frete ' + id }); add(col, c); fw(c);
      add(c, await T(id, 'Mono/P', 'texto-secundario'));
      await TQ(c, rt, 'Pequeno/SemiBold');
      await TQ(c, val, 'Corpo/SemiBold');
      add(c, await T('Coleta ' + dt, 'Legenda/Regular', 'texto-secundario'));
      if (id === '#4821') alvo = c;
    }
  }
  return { f, alvo };
}

async function ePagamento(estado) {
  const rot = { Pendente: 'Aguardando Pix', Retido: 'Pagamento garantido', Liberado: 'Saldo pago' }[estado];
  const { f, main } = await telaDesk('Empresa / Detalhe do frete · Pagamento / ' + rot, { menu: 'Fretes' });
  const pago = estado === 'Liberado';
  await cabecalhoDetalhe(main, 'Pagamento', pago ? 'PAGO' : 'ACEITO', pago ? 'PAGO' : 'ACEITO');
  const corpo = corpoH(main);
  const esq = cartao({ pad: 24, gap: 16 }); add(corpo, esq); esq.layoutGrow = 1;
  let copiar = null;
  if (estado === 'Pendente') {
    add(esq, await T('Pague por Pix para garantir o frete', 'Desktop/H2'));
    await TQ(esq, 'O valor fica guardado até a entrega. O motorista só carrega depois que o Pix cair.', 'Corpo/Regular', 'texto-secundario');
    const l = AL('H', { gap: 24 }); add(esq, l); fw(l);
    add(l, inst2('qr'));
    const c = coluna(12); add(l, c); c.layoutGrow = 1;
    await kv(c, 'Valor', 'R$ 7.800', { estiloV: 'Valor/M' });
    await kv(c, 'Vencimento', 'hoje, 21 out · 18:00', { cor: 'alerta' });
    await kv(c, 'Motorista', 'José Almeida · RIO2A19');
    add(c, await T('Pix copia e cola', 'Pequeno/SemiBold', 'texto-secundario'));
    const box = AL('H', { pad: 12, fill: 'fundo', r: 6, borda: 'linha' }); add(c, box); fw(box);
    await TQ(box, '00020126580014br.gov.bcb.pix0136f3a1c2e4-9b7d-4e2a-8c51-2d6f0a9e7b3452040000530398654077800.005802BR5906FRETAI6008CAMPINAS62070503***6304B7E1', 'Mono/P');
    copiar = botao('Secundário', 'Copiar código', 'M'); add(c, copiar);
  } else {
    const a = pago
      ? aviso('Sucesso', 'Saldo pago ao motorista', 'Contestação encerrada. R$ 4.680 liberados para José Almeida em 26 out · 15:21.')
      : aviso('Sucesso', 'Pagamento garantido', 'R$ 7.800 guardados. O adiantamento de R$ 3.120 sai quando o motorista iniciar a viagem.');
    add(esq, a); fw(a);
    await kv(esq, 'Pago em', '21 out · 10:42');
    await kv(esq, 'Provedor', 'Asaas');
    await kv(esq, 'Cobrança', 'pay_8f2k1x7q');
    if (pago) await kv(esq, 'Saldo liberado em', '26 out · 15:21', { cor: 'garantido' });
  }
  const dir = colunaFixa(corpo, 420);
  const g = cartao({ pad: 24, gap: 12 }); add(dir, g); fw(g);
  add(g, await T('Garantia', 'Desktop/H3'));
  const m = medidor(estado); add(g, m); fw(m);
  await kv(g, 'Adiantamento (40%)', 'R$ 3.120');
  await kv(g, 'Saldo', 'R$ 4.680');
  await kv(g, 'Saldo liberável', '24 h após a entrega');
  return { f, copiar };
}

async function eEntrega(contestada) {
  const { f, main } = await telaDesk('Empresa / Detalhe do frete · Entrega' + (contestada ? ' / Contestada' : ''), { menu: 'Fretes' });
  await cabecalhoDetalhe(main, 'Entrega', 'ENTREGUE', 'ENTREGUE');
  let av = null;
  if (contestada) {
    av = aviso('Alerta', 'Entrega contestada · em análise', 'Motivo do recebedor: "3 caixas chegaram quebradas." O saldo de R$ 4.680 fica parado até a decisão da Fretaí.');
    add(main, av); fw(av);
  }
  const corpo = corpoH(main);
  const esq = cartao({ pad: 24, gap: 16 }); add(corpo, esq); esq.layoutGrow = 1;
  add(esq, await T('Canhoto', 'Desktop/H2'));
  const l = AL('H', { gap: 16 }); add(esq, l); fw(l);
  const foto = AL('V', { nome: 'Foto da entrega', gap: 8, just: 'CENTER', alinha: 'CENTER', fill: 'superficie-elevada', r: 12, borda: 'linha' });
  WH(foto, 260, 200);
  add(foto, icone('camera', 'texto-secundario', 32), await T('foto_entrega.jpg', 'Legenda/Regular', 'texto-secundario'));
  add(l, foto, assinatura('Assinada'));
  await kv(esq, 'Recebedor', 'Roberto Lima');
  await kv(esq, 'Registrado em', '24 out · 15:20');
  await kv(esq, 'Distância do destino', '60 m ✓', { cor: 'garantido' });
  await kv(esq, 'Contestação até', '25 out · 15:20');
  await TQ(esq, 'Foto e assinatura abrem por link que expira em 10 min.', 'Legenda/Regular', 'texto-secundario');
  const dir = colunaFixa(corpo, 460);
  add(dir, mapa(460, 240, { raio: 110 }));
  const p = cartao({ pad: 24, gap: 12 }); add(dir, p); fw(p);
  add(p, await T('Pagamento', 'Desktop/H3'));
  const m = medidor(contestada ? 'Bloqueado' : 'Adiantamento liberado'); add(p, m); fw(m);
  if (!contestada) {
    await TQ(p, 'Se não houver contestação até 25 out · 15:20, o saldo de R$ 4.680 sai sozinho.', 'Pequeno/Regular', 'texto-secundario');
    add(p, botao('Perigo', 'Contestar entrega', 'M'));
  }
  return { f, aviso: av };
}

async function eDocumentos(liberado) {
  const { f, main } = await telaDesk('Empresa / Detalhe do frete · Documentos' + (liberado ? '' : ' / Antes do aceite'), { menu: 'Fretes' });
  await cabecalhoDetalhe(main, 'Documentos', liberado ? 'ACEITO' : 'PUBLICADO', liberado ? 'ACEITO' : 'PROPOSTA_ENVIADA');
  if (!liberado) {
    const c = cartao({ pad: 48, gap: 12 }); add(main, c); fw(c);
    c.counterAxisAlignItems = 'CENTER';
    add(c, icone('lock', 'texto-secundario', 40), await T('Documentos liberados só depois do aceite', 'Desktop/H3'));
    add(c, await T('Assim que você aceitar um motorista, CNH e CRLV aparecem aqui por link temporário.', 'Corpo/Regular', 'texto-secundario'));
    return f;
  }
  const a = aviso('Info', 'Este acesso fica registrado', 'Cada vez que você abre um documento, a Fretaí guarda quem abriu e quando. O link expira em 10 min.');
  add(main, a); fw(a);
  const ok = async (t) => tag(t, 'garantido', 'shield-check');
  await tabela(main, [['Documento', 200], ['De', null], ['Situação', 220], ['Tamanho', 110], ['', 120]], [
    ['CNH', 'José Almeida', await ok('Verificado 20 out'), '1,2 MB', botao('Secundário', 'Abrir', 'M')],
    ['CRLV', 'Carreta RIO2A19', await ok('Verificado 20 out'), '840 KB', botao('Secundário', 'Abrir', 'M')],
    ['Comprovante', 'José Almeida', await tag('Aguardando verificação', 'alerta', 'relogio'), '2,4 MB', botao('Secundário', 'Abrir', 'M')],
  ]);
  return f;
}

async function eHistorico() {
  const { f, main } = await telaDesk('Empresa / Detalhe do frete · Histórico', { menu: 'Fretes' });
  await cabecalhoDetalhe(main, 'Histórico', 'ENTREGUE', 'ENTREGUE');
  const m = (t) => T(t, 'Mono/P');
  await tabela(main, [['Quando', 150], ['De → para', 360], ['Quem', 240], ['Observação', null]], [
    ['21 out · 09:02', await m('— → PUBLICADO'), 'Carla Mendes · Empresa', 'Frete publicado'],
    ['21 out · 09:47', await m('PUBLICADO → PROPOSTA_ENVIADA'), 'José Almeida · Motorista', 'Proposta de R$ 7.800, 40% na saída'],
    ['21 out · 10:30', await m('PROPOSTA_ENVIADA → ACEITO'), 'Carla Mendes · Empresa', 'Proposta de José Almeida aceita'],
    ['23 out · 07:12', await m('ACEITO → EM_TRANSITO'), 'José Almeida · Motorista', 'Viagem iniciada'],
    ['24 out · 15:20', await m('EM_TRANSITO → ENTREGUE'), 'José Almeida · Motorista', 'Canhoto registrado a 60 m do destino'],
  ]);
  return f;
}

async function eAvaliar() {
  const { f, main } = await telaDesk('Empresa / Detalhe do frete · Avaliar motorista', { menu: 'Fretes' });
  await cabecalhoDetalhe(main, 'Avaliar motorista', 'PAGO', 'PAGO');
  const md = AL('V', { nome: 'Modal · Avaliar', pad: 32, gap: 16, fill: 'superficie-elevada', r: 20, borda: 'linha', alinha: 'CENTER' });
  W(md, 520);
  add(md, await avatar('JA', 72));
  add(md, await T('Como foi com José Almeida?', 'Desktop/H2'));
  add(md, await T('Frete #4821 · Campinas/SP → Rio de Janeiro/RJ', 'Pequeno/Regular', 'texto-secundario'));
  add(md, estrelas(5, 40));
  const c = campo('Comentário (opcional)', 'Chegou no horário e o canhoto veio completo.', 'Preenchido', 'Aparece no perfil público do motorista.'); add(md, c); fw(c);
  const l = AL('H', { gap: 12, just: 'MAX' }); add(md, l); fw(l);
  add(l, botao('Fantasma', 'Agora não', 'M'), botao('Primário', 'Enviar avaliação', 'M'));
  montarModal(f, md);
  return f;
}

async function ePagamentos() {
  const { f, main } = await telaDesk('Empresa / Pagamentos', { menu: 'Pagamentos', titulo: 'Pagamentos', sub: 'Cobranças Pix dos seus fretes' });
  const k = corpoH(main, 16);
  for (const [r, v, s, cor] of [['Aguardando Pix', 'R$ 6.200', '1 cobrança · vence hoje', 'alerta'], ['Guardado agora', 'R$ 17.360', 'retido e saldos a liberar', 'garantido'], ['Pago em outubro', 'R$ 12.240', 'adiantamentos e saldos', 'texto']]) {
    const c = cartao({ gap: 4, pad: 20 }); add(k, c); c.layoutGrow = 1;
    add(c, await T(r, 'Pequeno/SemiBold', 'texto-secundario'), await T(v, 'Valor/G', cor), await T(s, 'Legenda/Regular', 'texto-secundario'));
  }
  await tabela(main, [['Frete', 80], ['Motorista', null], ['Valor', 110], ['Adiantamento', 150], ['Saldo', 110], ['Status', 220], ['Vencimento', 120], ['Pago em', 120]], [
    ['#4833', 'Marcos Vieira', 'R$ 6.200', '40% · R$ 2.480', 'R$ 3.720', badge('PAG_PENDENTE'), 'hoje 18:00', '—'],
    ['#4821', 'José Almeida', 'R$ 7.800', '40% · R$ 3.120', 'R$ 4.680', badge('PAG_RETIDO'), '21 out', '21 out 10:42'],
    ['#4815', 'Ana Paula Souza', 'R$ 8.900', '50% · R$ 4.450', 'R$ 4.450', badge('PAG_ADIANTAMENTO'), '19 out', '19 out 16:05'],
    ['#4802', 'Marcos Vieira', 'R$ 7.300', '30% · R$ 2.190', 'R$ 5.110', badge('PAG_ADIANTAMENTO'), '17 out', '17 out 11:20'],
    ['#4790', 'Ana Paula Souza', 'R$ 5.600', '40% · R$ 2.240', 'R$ 3.360', badge('PAG_LIBERADO'), '09 out', '09 out 09:30'],
    ['#4777', '—', 'R$ 14.200', '—', '—', badge('PAG_ESTORNADO'), '07 out', '07 out 14:00'],
  ], { primeiraMono: true });
  return f;
}

async function ePerfil() {
  const { f, main } = await telaDesk('Empresa / Perfil da empresa', { menu: 'Perfil da empresa', titulo: 'Perfil da empresa', sub: 'É assim que os motoristas veem você.' });
  const corpo = corpoH(main, 32);
  const esq = colunaFixa(corpo, 422, 12);
  add(esq, await T('Prévia no app do motorista', 'Pequeno/SemiBold', 'texto-secundario'));
  TEMA = 'escuro';
  const tel = AL('V', { nome: 'Prévia · celular', pad: 16, gap: 12, fill: 'fundo', r: 20 });
  add(esq, tel); fw(tel);
  const card = inst('card', { Tipo: 'Com valor' }); add(tel, card); fw(card);
  const ce = cartao({ nome: 'Empresa' }); add(tel, ce); fw(ce);
  const topo = linhaH(12); add(ce, topo);
  const c2 = coluna(2); add(topo, await avatar('CP', 48), c2);
  add(c2, await T('Cerâmica Paulista Ltda', 'Corpo/SemiBold'), await T('Embarcador · na Fretaí desde mar 2025', 'Pequeno/Regular', 'texto-secundario'));
  const st = AL('H', { gap: 12 }); add(ce, st); fw(st);
  for (const [v, l, cor] of [['★ 4,8', '126 avaliações', 'texto'], ['312', 'fretes concluídos', 'texto'], ['96%', 'saldos pagos em dia', 'garantido']]) {
    const c = coluna(2); add(st, c); c.layoutGrow = 1;
    add(c, await T(v, 'Valor/M', cor)); await TQ(c, l, 'Legenda/Regular', 'texto-secundario');
  }
  TEMA = 'claro';
  await TQ(esq, '"Saldos pagos em dia" considera 140 cobranças. Sem histórico, o card mostra "Novo na Fretaí".', 'Legenda/Regular', 'texto-secundario');
  const dir = cartao({ pad: 24, gap: 16 }); add(corpo, dir); dir.layoutGrow = 1;
  add(dir, await T('Dados públicos', 'Desktop/H3'));
  for (const c of [campo('Razão social', 'Cerâmica Paulista Ltda', 'Desabilitado', 'Vem da Receita Federal.'), campo('CNPJ', '12.345.678/0001-90', 'Desabilitado'),
    campo('Nome fantasia', 'Cerâmica Paulista', 'Foco'), campo('Telefone', '(19) 3232-4400')]) { add(dir, c); fw(c); }
  await kv(dir, 'Tipo', 'Embarcador');
  await kv(dir, 'Na Fretaí desde', 'mar 2025');
  add(dir, botao('Primário', 'Salvar alterações', 'M'));
  return f;
}

// ---------- Admin ----------
async function aDocumentos() {
  const { f, main } = await telaDesk('Admin / Documentos para verificar', { menu: 'Documentos', admin: true, titulo: 'Documentos para verificar', sub: '14 na fila · mais antigos primeiro' });
  const prev = () => { const p = AL('H', { just: 'CENTER', alinha: 'CENTER', fill: 'superficie-elevada', r: 6, borda: 'linha' }); WH(p, 64, 44); add(p, icone('documento', 'texto-secundario', 20)); return p; };
  await tabela(main, [['Prévia', 80], ['Motorista', null], ['Tipo', 140], ['Enviado em', 160], ['Tamanho', 100], ['', 130]], [
    [prev(), 'Ana Paula Souza', 'CNH', '21 out · 08:14', '1,2 MB', botao('Secundário', 'Verificar', 'M')],
    [prev(), 'Marcos Vieira', 'CRLV', '21 out · 08:40', '910 KB', botao('Secundário', 'Verificar', 'M')],
    [prev(), 'José Almeida', 'COMPROVANTE', '21 out · 09:05', '2,4 MB', botao('Secundário', 'Verificar', 'M')],
    [prev(), 'Luiz Fernando Costa', 'CNH', '21 out · 09:31', '1,4 MB', botao('Secundário', 'Verificar', 'M')],
    [prev(), 'Patrícia Ramos', 'CRLV', '21 out · 10:02', '780 KB', botao('Secundário', 'Verificar', 'M')],
    [prev(), 'Edson Barbosa', 'CNH', '21 out · 10:18', '1,1 MB', botao('Secundário', 'Verificar', 'M')],
  ]);
  return f;
}

async function aContestacoes() {
  const { f, main } = await telaDesk('Admin / Contestações', { menu: 'Contestações', admin: true, titulo: 'Contestações', sub: '3 entregas aguardando decisão' });
  const corpo = corpoH(main);
  const lista = colunaFixa(corpo, 340, 8);
  for (const [id, rt, mot, val, sel] of [['#4802', 'Campinas/SP → Goiânia/GO', '"3 caixas chegaram quebradas."', 'Aberta há 2 h · R$ 5.110 parados', true],
    ['#4768', 'Sorocaba/SP → Campo Grande/MS', '"Carga entregue no endereço errado."', 'Aberta há 6 h · R$ 3.900 parados', false],
    ['#4751', 'Campinas/SP → Recife/PE', '"Faltaram 2 paletes."', 'Aberta ontem · R$ 9.800 parados', false]]) {
    const c = cartao({ gap: 4, borda: sel ? 'faixa' : 'linha', bw: sel ? 2 : 1 }); add(lista, c); fw(c);
    await TQ(c, id + ' · ' + rt, 'Corpo/SemiBold'); await TQ(c, mot, 'Pequeno/Regular'); await TQ(c, val, 'Legenda/SemiBold', 'alerta');
  }
  const d = cartao({ pad: 24, gap: 16 }); add(corpo, d); d.layoutGrow = 1;
  add(d, await T('#4802 · Campinas/SP → Goiânia/GO', 'Desktop/H2'));
  const tg = linhaQuebra(d);
  add(tg, await tag('Empresa: Cerâmica Paulista', 'texto-secundario', 'empresa'), await tag('Motorista: Marcos Vieira', 'texto-secundario', 'usuario'));
  const av = aviso('Alerta', 'Motivo do recebedor', '"3 caixas chegaram quebradas." Enviado em 20 out · 09:12 com o código K7QM2XPR.'); add(d, av); fw(av);
  const l = AL('H', { gap: 16 }); add(d, l); fw(l);
  const foto = AL('V', { nome: 'Foto', gap: 8, just: 'CENTER', alinha: 'CENTER', fill: 'superficie-elevada', r: 12, borda: 'linha' });
  WH(foto, 220, 200); add(foto, icone('camera', 'texto-secundario', 28), await T('foto_entrega.jpg', 'Legenda/Regular', 'texto-secundario'));
  const as = assinatura('Assinada'); as.rescale(0.8);
  add(l, foto, as, mapa(240, 200, { raio: 80 }));
  await kv(d, 'Distância do destino', '120 m ✓', { cor: 'garantido' });
  await kv(d, 'Canhoto registrado', '19 out · 17:40');
  const m = medidor('Bloqueado'); add(d, m); fw(m);
  add(d, await T('Decisão', 'Desktop/H3'));
  const dec = AL('H', { gap: 12 }); add(d, dec); fw(dec);
  for (const [t, s, sel] of [['Entrega confirmada', 'Libera o saldo de R$ 5.110 ao motorista.', true], ['Contestação procedente', 'Mantém o saldo parado para acerto entre as partes.', false]]) {
    const c = cartao({ gap: 4, borda: sel ? 'faixa' : 'linha', bw: sel ? 2 : 1 }); add(dec, c); c.layoutGrow = 1;
    await TQ(c, t, 'Corpo/SemiBold'); await TQ(c, s, 'Pequeno/Regular', 'texto-secundario');
  }
  const ob = campo('Observação', 'Fotos mostram a carga íntegra na descarga.', 'Preenchido'); add(d, ob); fw(ob);
  const reg = botao('Primário', 'Registrar decisão', 'M'); add(d, reg);
  return { f, registrar: reg };
}

const TIPOS_CARGA = ['Granel sólido', 'Granel líquido', 'Frigorificada', 'Conteinerizada', 'Carga geral', 'Neogranel', 'Perigosa (granel sólido)',
  'Perigosa (granel líquido)', 'Perigosa (frigorificada)', 'Perigosa (conteinerizada)', 'Perigosa (carga geral)', 'Granel pressurizada'];
const EIXOS = [2, 3, 4, 5, 6, 7, 9];
const brl = (n, d = 2) => n.toFixed(d).replace('.', ',');

async function aPiso() {
  const { f, main } = await telaDesk('Admin / Tabela do piso ANTT', { menu: 'Piso ANTT', admin: true, altura: 1200, titulo: 'Tabela do piso ANTT', sub: 'CCD em R$/km · CC em R$ · por tipo de carga e número de eixos' });
  const a = aviso('Alerta', 'Coeficientes de exemplo', 'Estes coeficientes são de exemplo. Preencha com a tabela vigente da ANTT.'); add(main, a); fw(a);
  const linhas = [];
  for (let t = 0; t < TIPOS_CARGA.length; t++) {
    const l = [TIPOS_CARGA[t]];
    for (const e of EIXOS) {
      let ccd = 4.5 + e * 2.2 + t * 0.15, cc = Math.round(180 + e * 60 + t * 8);
      if (TIPOS_CARGA[t] === 'Carga geral' && e === 5) { ccd = 15.9; cc = 513; }
      const c = coluna(0);
      add(c, await T('CCD ' + brl(ccd), 'Pequeno/SemiBold'), await T('CC ' + cc, 'Legenda/Regular', 'texto-secundario'));
      if (TIPOS_CARGA[t] === 'Carga geral' && e === 5) { c.fills = [P('alerta-fundo')]; bd(c, 'faixa', 2); pad(c, 4); c.cornerRadius = 6; c.name = 'Célula em edição'; }
      l.push(c);
    }
    linhas.push(l);
  }
  await tabela(main, [['Tipo de carga', 220]].concat(EIXOS.map((e) => [e + ' eixos', 100])), linhas);
  const ed = cartao({ pad: 24, gap: 16 }); add(main, ed); W(ed, 760);
  add(ed, await T('Editando: Carga geral · 5 eixos', 'Desktop/H3'));
  const l = AL('H', { gap: 16 }); add(ed, l); fw(l);
  for (const c of [campo('CCD (R$/km)', '15,90'), campo('CC (R$)', '513,00'), campo('Fonte', 'EXEMPLO', 'Foco', 'Troque pelo número da resolução da ANTT.')]) { add(l, c); c.layoutGrow = 1; }
  const b = AL('H', { gap: 12 }); add(ed, b);
  add(b, botao('Fantasma', 'Cancelar', 'M'), botao('Primário', 'Salvar célula', 'M'));
  return f;
}

async function empresaAdmin(pg) {
  TEMA = 'claro';
  const Q = {};
  const sec = novaSecao(pg, 'Gerado · Empresa');
  const g = new Grade(sec);
  const E = (base, o) => estadosDesk('Empresa / ' + base, o);

  await seguro('Empresa · Painel', async () => {
    const est = await E('Painel', { menu: 'Painel', titulo: 'Bom dia, Carla', vazio: ['Nenhum frete publicado ainda', 'Publique o primeiro frete e receba propostas de caminhoneiros perto da coleta.', 'Publicar primeiro frete'] });
    await g.linha('Empresa / Painel', 'GET /api/fretes/empresa/{empresaId} · GET /api/empresas/{id}/perfil', [await ePainel()].concat(est), 'KPIs e lista "Precisa da sua ação": precisa de API (resumo do painel).');
  });
  await seguro('Empresa · Publicar frete', async () => {
    Q.publicar = await ePublicar(false);
    const er = await ePublicar(true);
    await g.linha('Empresa / Publicar frete', 'POST /api/fretes/empresa/{empresaId} · GET /api/calendario/verificacao', [Q.publicar.f, er.f]);
  });
  await seguro('Empresa · Fretes', async () => {
    Q.quadro = await eFretesQuadro();
    const est = await E('Fretes', { menu: 'Fretes', titulo: 'Fretes', vazio: ['Nenhum frete com esse filtro', 'Troque o status ou publique um frete novo.', 'Publicar frete'] });
    await g.linha('Empresa / Fretes (lista e quadro)', 'GET /api/fretes/empresa/{empresaId}', [await eFretesTabela(), Q.quadro.f].concat(est));
  });
  await seguro('Empresa · Pagamento', async () => {
    Q.pendente = await ePagamento('Pendente');
    Q.retido = await ePagamento('Retido');
    Q.liberado = await ePagamento('Liberado');
    await g.linha('Empresa / Detalhe do frete · Pagamento', 'POST /api/fretes/{freteId}/pagamento · GET /api/fretes/{freteId}/pagamento', [Q.pendente.f, Q.retido.f, Q.liberado.f]);
  });
  await seguro('Empresa · Entrega', async () => {
    const ok = await eEntrega(false);
    Q.contestada = await eEntrega(true);
    await g.linha('Empresa / Detalhe do frete · Entrega', 'GET /api/fretes/{freteId}/canhoto · POST /api/fretes/{freteId}/canhoto/contestacao', [ok.f, Q.contestada.f]);
  });
  await seguro('Empresa · Documentos', async () => {
    await g.linha('Empresa / Detalhe do frete · Documentos', 'GET /api/fretes/{freteId}/documentos · POST /api/documentos/{id}/link', [await eDocumentos(false), await eDocumentos(true)]);
  });
  await seguro('Empresa · Histórico e avaliação', async () => {
    await g.linha('Empresa / Detalhe do frete · Histórico e Avaliar', 'GET /api/fretes/{id}/eventos · POST /api/fretes/{freteId}/avaliacoes', [await eHistorico(), await eAvaliar()]);
  });
  await seguro('Empresa · Pagamentos', async () => {
    const est = await E('Pagamentos', { menu: 'Pagamentos', titulo: 'Pagamentos', vazio: ['Nenhuma cobrança ainda', 'A cobrança Pix aparece quando você aceita um motorista.'] });
    await g.linha('Empresa / Pagamentos', 'GET /api/fretes/{freteId}/pagamento (por frete)', [await ePagamentos()].concat(est), 'Lista de cobranças da empresa: precisa de API.');
  });
  await seguro('Empresa · Perfil', async () => {
    await g.linha('Empresa / Perfil da empresa', 'GET /api/empresas/{id}/perfil · PUT /api/empresas/{id}', [await ePerfil()]);
  });
  g.fechar();

  const secA = novaSecao(pg, 'Gerado · Admin');
  const ga = new Grade(secA);
  const EA = (base, o) => estadosDesk('Admin / ' + base, Object.assign({ admin: true }, o));
  await seguro('Admin · Documentos', async () => {
    const est = await EA('Documentos para verificar', { menu: 'Documentos', titulo: 'Documentos para verificar', vazio: ['Fila zerada', 'Nenhum documento esperando verificação.'] });
    await ga.linha('Admin / Documentos para verificar', 'POST /api/documentos/{id}/link · POST /api/documentos/{id}/verificacao', [await aDocumentos()].concat(est), 'Fila de documentos não verificados: precisa de API.');
  });
  await seguro('Admin · Contestações', async () => {
    Q.admin = await aContestacoes();
    const est = await EA('Contestações', { menu: 'Contestações', titulo: 'Contestações', vazio: ['Nenhuma contestação aberta', 'Quando um recebedor contestar uma entrega, ela aparece aqui.'] });
    await ga.linha('Admin / Contestações', 'GET /api/fretes/{freteId}/canhoto · POST /api/fretes/{freteId}/canhoto/resolucao', [Q.admin.f].concat(est), 'Lista de contestações abertas: precisa de API.');
  });
  await seguro('Admin · Piso ANTT', async () => {
    await ga.linha('Admin / Tabela do piso ANTT', 'GET /api/piso-antt · PUT /api/piso-antt/{tipoCarga}/{eixos}', [await aPiso()]);
  });
  ga.fechar();
  secA.y = sec.y + sec.height + 200;
  return Q;
}
// ---------- Público ----------

async function marco(n) {
  const m = AL('H', { just: 'CENTER', alinha: 'CENTER', fill: 'faixa', r: 6 });
  WH(m, 44, 44);
  add(m, await T(String(n), 'Mobile/H2', 'sobre-faixa'));
  return m;
}
function faixaPista(w) {
  const v = figma.createVector();
  v.vectorPaths = [{ windingRule: 'NONE', data: `M 0 0 L ${w} 0` }];
  v.strokes = [P('faixa')]; v.strokeWeight = 4; v.dashPattern = [24, 16]; v.fills = [];
  v.name = 'Faixa de pista';
  return v;
}
const PASSOS_COMO = [
  ['Publica', 'A empresa publica a carga com rota, data e valor. O piso ANTT aparece na hora.'],
  ['Propõe', 'Caminhoneiros perto da coleta mandam proposta ou aceitam o valor.'],
  ['Paga e retém', 'A empresa paga por Pix no aceite. O dinheiro fica guardado até a entrega.'],
  ['Entrega e recebe', 'Canhoto com foto, assinatura e GPS. Adiantamento na saída, saldo na entrega.'],
];

async function pLandingDesk() {
  TEMA = 'claro';
  const f = AL('V', { nome: 'Público / Landing · Desktop', fill: 'fundo' });
  W(f, 1440);
  TEMA = 'escuro';
  const nav = AL('H', { nome: 'Navegação', pad: [20, 80], gap: 32, alinha: 'CENTER', fill: 'fundo' });
  add(f, nav); fw(nav);
  add(nav, inst('logo', { Tema: 'Escuro' }));
  const m1 = mola(); add(nav, m1); m1.layoutGrow = 1;
  for (const t of ['Como funciona', 'Para empresas', 'Entrar']) add(nav, await T(t, 'Corpo/Medium'));
  add(nav, botao('Primário', 'Começar', 'M'));
  const hero = AL('H', { nome: 'Hero', pad: [96, 80, 112, 80], gap: 64, alinha: 'CENTER', fill: 'fundo' });
  add(f, hero); fw(hero);
  const hc = coluna(24); add(hero, hc); hc.layoutGrow = 1;
  add(hc, await T('PAGAMENTO GARANTIDO', 'Pequeno/SemiBold', 'faixa'));
  await TQ(hc, 'Frete com pagamento garantido antes de carregar.', 'Desktop/Display');
  await TQ(hc, 'A empresa paga por Pix no aceite e o dinheiro fica guardado. O caminhoneiro recebe o adiantamento na saída e o saldo na entrega comprovada.', 'Desktop/H3', 'texto-secundario');
  const bt = linhaH(16); add(hc, bt);
  add(bt, botao('Primário', 'Sou caminhoneiro'), botao('Secundário', 'Tenho carga'));
  add(hc, await T('Precisa de um frete avulso? (pessoa física)', 'Corpo/Medium', 'info'));
  const hv = colunaFixa(hero, 390, 16);
  const c = inst('card', { Tipo: 'Com valor' }); add(hv, c); fw(c);
  const md = medidor('Adiantamento liberado'); add(hv, md); fw(md);
  TEMA = 'claro';
  const como = AL('V', { nome: 'Como funciona', pad: [96, 80], gap: 40 });
  add(f, como); fw(como);
  add(como, await T('Como funciona', 'Desktop/H1'));
  add(como, faixaPista(1280));
  const ps = AL('H', { gap: 32 }); add(como, ps); fw(ps);
  for (let i = 0; i < 4; i++) {
    const c2 = coluna(12); add(ps, c2); c2.layoutGrow = 1;
    add(c2, await marco(i + 1), await T(PASSOS_COMO[i][0], 'Desktop/H3'));
    await TQ(c2, PASSOS_COMO[i][1], 'Corpo/Regular', 'texto-secundario');
  }
  const conf = AL('H', { nome: 'Números de confiança', pad: [64, 80], gap: 24, fill: 'superficie' });
  add(f, conf); fw(conf);
  for (const [v, l] of [['[N] fretes pagos', 'desde o lançamento'], ['[R$ X] guardados', 'com segurança no provedor de pagamento'], ['[N]% saldos pagos em dia', 'média das empresas na plataforma']]) {
    const k = cartao({ pad: 24, gap: 4 }); add(conf, k); k.layoutGrow = 1;
    await TQ(k, v, 'Desktop/H2'); await TQ(k, l, 'Corpo/Regular', 'texto-secundario');
  }
  const lados = AL('H', { nome: 'Dois lados', pad: [64, 80], gap: 24 });
  add(f, lados); fw(lados);
  for (const [t, itens, rot, tipo] of [
    ['Para o caminhoneiro', ['Saber antes de carregar que o dinheiro existe', 'Adiantamento na saída, saldo na entrega', 'Piso ANTT e R$/km em todo frete', 'Alerta de fretão e reputação da empresa'], 'Sou caminhoneiro', 'Primário'],
    ['Para a empresa', ['Propostas de motoristas com documentos verificados', 'Comparador lado a lado', 'Canhoto com foto, assinatura e GPS', 'Trilha de auditoria de cada frete'], 'Tenho carga', 'Secundário']]) {
    const k = cartao({ pad: 32, gap: 12 }); add(lados, k); k.layoutGrow = 1;
    add(k, await T(t, 'Desktop/H2'));
    for (const it of itens) { const l = linhaH(12); add(k, l); fw(l); add(l, icone('check', 'texto', 20)); await TQ(l, it, 'Corpo/Regular'); }
    add(k, botao(tipo, rot, 'M'));
  }
  TEMA = 'escuro';
  const rod = AL('H', { nome: 'Rodapé', pad: [32, 80], alinha: 'CENTER', fill: 'fundo' });
  add(f, rod); fw(rod);
  add(rod, inst('logo', { Tema: 'Escuro' }));
  const m2 = mola(); add(rod, m2); m2.layoutGrow = 1;
  add(rod, await T('Termos de uso · Privacidade · Contato', 'Pequeno/Regular', 'texto-secundario'));
  TEMA = 'claro';
  return f;
}

async function pLandingMobile() {
  TEMA = 'escuro';
  const f = AL('V', { nome: 'Público / Landing · Mobile', fill: 'fundo' });
  W(f, 390);
  const sb = await barraStatus(); add(f, sb); altura(sb, 44); fw(sb);
  const nav = AL('H', { pad: [8, 16], alinha: 'CENTER' }); add(f, nav); fw(nav);
  add(nav, inst('logo', { Tema: 'Escuro' }));
  const m1 = mola(); add(nav, m1); m1.layoutGrow = 1;
  add(nav, await T('Entrar', 'Corpo/SemiBold'));
  const hero = AL('V', { pad: [32, 16, 40, 16], gap: 16 }); add(f, hero); fw(hero);
  add(hero, await T('PAGAMENTO GARANTIDO', 'Legenda/SemiBold', 'faixa'));
  await TQ(hero, 'Frete com pagamento garantido antes de carregar.', 'Mobile/Display');
  await TQ(hero, 'A empresa paga por Pix no aceite. Você recebe o adiantamento na saída e o saldo na entrega.', 'Corpo/Regular', 'texto-secundario');
  for (const [t, r] of [['Primário', 'Sou caminhoneiro'], ['Secundário', 'Tenho carga']]) { const b = botao(t, r); add(hero, b); fw(b); }
  await TQ(hero, 'Precisa de um frete avulso? (pessoa física)', 'Pequeno/SemiBold', 'info');
  const c = inst('card', { Tipo: 'Com valor' }); add(hero, c); fw(c);
  TEMA = 'claro';
  const como = AL('V', { pad: [40, 16], gap: 20, fill: 'fundo' }); add(f, como); fw(como);
  add(como, await T('Como funciona', 'Mobile/H1'));
  for (let i = 0; i < 4; i++) {
    const l = AL('H', { gap: 16 }); add(como, l); fw(l);
    add(l, await marco(i + 1));
    const col = coluna(4); add(l, col); col.layoutGrow = 1;
    add(col, await T(PASSOS_COMO[i][0], 'Mobile/H3'));
    await TQ(col, PASSOS_COMO[i][1], 'Pequeno/Regular', 'texto-secundario');
  }
  const conf = AL('V', { pad: [32, 16], gap: 12, fill: 'superficie' }); add(f, conf); fw(conf);
  for (const v of ['[N] fretes pagos', '[R$ X] guardados com segurança', '[N]% saldos pagos em dia']) await TQ(conf, v, 'Mobile/H2');
  TEMA = 'escuro';
  const rod = AL('V', { pad: [24, 16], gap: 8, fill: 'fundo' }); add(f, rod); fw(rod);
  add(rod, inst('logo', { Tema: 'Escuro' }), await T('Termos de uso · Privacidade · Contato', 'Legenda/Regular', 'texto-secundario'));
  TEMA = 'claro';
  return f;
}

async function pEscolha() {
  TEMA = 'claro';
  const { f, main } = await telaDesk('Público / Escolha de perfil', { pad: [96, 80], gap: 32 });
  main.counterAxisAlignItems = 'CENTER';
  add(main, inst('logo', { Tema: 'Claro' }), await T('Como você vai usar a Fretaí?', 'Desktop/H1'));
  const l = AL('H', { gap: 24 }); add(main, l);
  for (const [ic, t, d, rot, tipo] of [['caminhao', 'Sou caminhoneiro', 'Encontre frete perto de você com o pagamento guardado antes de carregar.', 'Criar conta de motorista', 'Primário'],
    ['empresa', 'Tenho carga', 'Publique fretes, compare propostas e acompanhe a entrega com canhoto digital.', 'Criar conta de empresa', 'Secundário']]) {
    const c = cartao({ pad: 40, gap: 16 }); add(l, c); W(c, 440);
    add(c, icone(ic, 'texto', 48), await T(t, 'Desktop/H2'));
    await TQ(c, d, 'Corpo/Regular', 'texto-secundario');
    const b = botao(tipo, rot); add(c, b); fw(b);
  }
  add(main, await T('Já tem conta? Entrar', 'Corpo/SemiBold', 'info'));
  return f;
}

async function pCadMotorista(n, erro) {
  TEMA = 'escuro';
  const nomes = ['Seus dados', 'Seu caminhão', 'Pix e base'];
  const { f, body, rodape } = await telaMobile(`Público / Cadastro do motorista · ${n} ${nomes[n - 1]}` + (erro ? ' / Erro' : ''), { titulo: 'Criar conta', sub: 'Motorista', voltar: true, rodape: true });
  if (n === 2) f.resize(390, 1500);
  await passos(body, n, nomes[n - 1]);
  const C = (...a) => { const c = campo(...a); add(body, c); fw(c); return c; };
  if (n === 1) {
    if (erro) { const a = aviso('Perigo', 'Não deu para criar a conta', 'Este CPF já tem cadastro. Entre com sua senha.'); add(body, a); fw(a); }
    C('Nome completo', 'José Almeida');
    C('CPF', '391.482.917-05', erro ? 'Erro' : 'Preenchido', erro ? 'CPF já cadastrado.' : null);
    C('E-mail', 'jose.almeida@email.com');
    C('Telefone (WhatsApp)', '(19) 99812-3344', 'Preenchido', 'Os avisos de frete chegam por aqui.');
    C('Senha', '••••••••', 'Foco', 'Mínimo de 8 caracteres.');
  } else if (n === 2) {
    add(body, await T('Tipo de caminhão', 'Pequeno/SemiBold', 'texto-secundario'));
    const g = linhaQuebra(body);
    for (const [tipo, nome, eixos] of VEICULOS) {
      const sel = tipo === 'CARRETA';
      const c = cartao({ pad: 12, gap: 4, borda: sel ? 'faixa' : 'linha', bw: sel ? 2 : 1 }); W(c, 175);
      const v = veiculo(tipo); v.rescale(0.9); add(c, v);
      add(c, await T(nome, 'Pequeno/SemiBold'), await T(eixos + ' eixos', 'Legenda/Regular', 'texto-secundario'));
      add(g, c);
    }
    C('Carroceria', 'Baú');
    C('Placa', 'RIO2A19', 'Preenchido', null, { mono: true });
    C('RNTRC', '048213976', 'Preenchido', 'Registro na ANTT, 9 dígitos.', { mono: true });
    C('Número de eixos', '5');
    await linhaToggle(body, 'Tem rastreador', true);
  } else {
    C('Chave Pix', 'CPF · 391.482.917-05', 'Preenchido', 'O pagamento dos fretes cai nessa chave.');
    C('Cidade base', 'Campinas/SP');
    add(body, await T('Avisar frete novo até', 'Pequeno/SemiBold', 'texto-secundario'));
    const ch = linhaH(8); add(body, ch); add(ch, chip('50 km'), chip('100 km', true), chip('200 km'));
    await linhaToggle(body, 'Aceito frete em feriado', true);
  }
  const b = botao('Primário', n === 3 ? 'Criar conta' : 'Continuar'); add(rodape, b); b.layoutGrow = 1;
  TEMA = 'claro';
  return f;
}

async function pCadEmpresa() {
  TEMA = 'claro';
  const { f, main } = await telaDesk('Público / Cadastro da empresa', { altura: 1400, pad: [48, 80] });
  main.counterAxisAlignItems = 'CENTER';
  const c = cartao({ pad: 32, gap: 16 }); add(main, c); W(c, 680);
  add(c, inst('logo', { Tema: 'Claro' }), await T('Criar conta da empresa', 'Desktop/H1'));
  const cnpj = campo('CNPJ', '12.345.678/0001-90'); add(c, cnpj); fw(cnpj);
  const ok = AL('H', { pad: 12, gap: 8, alinha: 'CENTER', fill: 'garantido-fundo', r: 6 }); add(c, ok); fw(ok);
  add(ok, icone('check', 'garantido', 20), await T('Cerâmica Paulista Ltda · ATIVA ✓', 'Corpo/SemiBold', 'garantido'));
  add(c, await T('Tipo de empresa', 'Pequeno/SemiBold', 'texto-secundario'));
  const tp = AL('H', { gap: 12 }); add(c, tp); fw(tp);
  for (const [t, d, sel] of [['Embarcador', 'Dono da carga.', true], ['Agenciador', 'Intermediário. Seus fretes saem marcados como agenciados.', false]]) {
    const k = cartao({ gap: 4, borda: sel ? 'faixa' : 'linha', bw: sel ? 2 : 1 }); add(tp, k); k.layoutGrow = 1;
    await TQ(k, t, 'Corpo/SemiBold'); await TQ(k, d, 'Pequeno/Regular', 'texto-secundario');
  }
  const par = (a, b) => { const l = AL('H', { gap: 16 }); add(c, l); fw(l); add(l, a, b); a.layoutGrow = 1; b.layoutGrow = 1; };
  par(campo('Nome fantasia', 'Cerâmica Paulista'), campo('Telefone', '(19) 3232-4400'));
  add(c, await T('Responsável', 'Desktop/H3'));
  par(campo('Nome', 'Carla Mendes'), campo('CPF', '284.615.039-77'));
  par(campo('E-mail', 'carla.mendes@ceramicapaulista.com.br'), campo('Telefone', '(19) 99654-2210'));
  const s = campo('Senha', '••••••••', 'Preenchido', 'Mínimo de 8 caracteres.'); add(c, s); fw(s);
  const b = botao('Primário', 'Criar conta'); add(c, b); fw(b);
  add(c, await T('Já tem conta? Entrar', 'Corpo/SemiBold', 'info'));
  return f;
}

async function pLogin(bloqueado) {
  TEMA = 'claro';
  const f = AL('H', { nome: 'Público / Login' + (bloqueado ? ' / Bloqueado' : ''), fill: 'fundo' });
  WH(f, 1440, 1024);
  TEMA = 'escuro';
  const esq = AL('V', { pad: 64, gap: 32, fill: 'fundo', just: 'CENTER' }); add(f, esq); W(esq, 640); fh(esq);
  add(esq, inst('logo', { Tema: 'Escuro' }));
  await TQ(esq, 'Frete com pagamento garantido antes de carregar.', 'Desktop/Display');
  add(esq, faixaPista(512));
  TEMA = 'claro';
  const dir = AL('V', { just: 'CENTER', alinha: 'CENTER' }); add(f, dir); dir.layoutGrow = 1; fh(dir);
  const form = coluna(16); add(dir, form); W(form, 400);
  add(form, await T('Entrar', 'Desktop/H1'));
  if (bloqueado) { const a = aviso('Perigo', 'Muitas tentativas', 'Tente de novo em 12 minutos.'); add(form, a); fw(a); }
  for (const c of [campo('E-mail', 'carla.mendes@ceramicapaulista.com.br', bloqueado ? 'Desabilitado' : 'Preenchido'), campo('Senha', '••••••••', bloqueado ? 'Desabilitado' : 'Foco')]) { add(form, c); fw(c); }
  add(form, await T('Esqueci minha senha', 'Pequeno/SemiBold', 'info'));
  const b = botao('Primário', 'Entrar'); add(form, b); fw(b);
  if (bloqueado) b.opacity = 0.5;
  add(form, await T('Ainda não tem conta? Criar conta', 'Pequeno/Regular', 'texto-secundario'));
  return f;
}

async function pContestar(estado) { // 'Formulário' | 'Erro' | 'Enviado'
  TEMA = 'claro';
  const { f, body, rodape } = await telaMobile('Público / Contestar entrega' + (estado === 'Formulário' ? '' : ' / ' + estado), { rodape: estado !== 'Enviado', pad: [24, 16] });
  add(body, inst('logo', { Tema: 'Claro' }));
  if (estado === 'Enviado') {
    body.counterAxisAlignItems = 'CENTER';
    body.primaryAxisAlignItems = 'CENTER';
    const ok = AL('H', { just: 'CENTER', alinha: 'CENTER', fill: 'info-fundo' }); WH(ok, 88, 88); ok.cornerRadius = 44;
    add(ok, icone('check', 'info', 44)); add(body, ok);
    add(body, await T('Recebemos.', 'Mobile/H1'));
    const t = await T('O pagamento ao motorista fica parado até a análise.', 'Corpo/Regular', 'texto-secundario', { centro: true }); add(body, t); quebra(t);
    const t2 = await T('Frete #4802 · Campinas/SP → Goiânia/GO · código K7QM2XPR', 'Pequeno/Regular', 'texto-secundario', { centro: true }); add(body, t2); quebra(t2);
    return { f };
  }
  await TQ(body, 'Contestar entrega', 'Mobile/H1');
  await TQ(body, 'Digite o código de 8 letras que chegou no seu WhatsApp.', 'Corpo/Regular', 'texto-secundario');
  const cx = AL('H', { nome: 'Código', gap: 4 }); add(body, cx);
  for (const ch of 'K7QM2XPR') {
    const b = AL('H', { just: 'CENTER', alinha: 'CENTER', fill: 'superficie', r: 6, borda: estado === 'Erro' ? 'perigo' : 'linha', bw: estado === 'Erro' ? 2 : 1 });
    WH(b, 40, 52); add(b, await T(ch, 'Mono/M')); add(cx, b);
  }
  if (estado === 'Erro') await TQ(body, 'Código não encontrado ou fora do prazo de 24 h.', 'Pequeno/SemiBold', 'perigo');
  const m = campo('O que aconteceu?', '3 caixas chegaram quebradas.', 'Preenchido', 'Seja específico. A Fretaí analisa a foto e a assinatura do canhoto.'); add(body, m); fw(m);
  const e = botao('Perigo', 'Enviar contestação'); add(rodape, e); e.layoutGrow = 1;
  return { f, enviar: e };
}

async function publico(pg) {
  TEMA = 'claro';
  const Q = {};
  const sec = novaSecao(pg, 'Gerado · Público');
  const g = new Grade(sec);
  await seguro('Público · Landing', async () => { await g.linha('Público / Landing (desktop e mobile)', 'sem API (página estática)', [await pLandingDesk(), await pLandingMobile()]); });
  await seguro('Público · Escolha de perfil', async () => { await g.linha('Público / Escolha de perfil', 'sem API', [await pEscolha()]); });
  await seguro('Público · Cadastro do motorista', async () => {
    await g.linha('Público / Cadastro do motorista (3 passos)', 'POST /api/motoristas · POST /api/motoristas/{motoristaId}/veiculos · PUT /api/motoristas/{id}/chave-pix · PUT /api/motoristas/{id}/base',
      [await pCadMotorista(1), await pCadMotorista(1, true), await pCadMotorista(2), await pCadMotorista(3)]);
  });
  await seguro('Público · Cadastro da empresa', async () => { await g.linha('Público / Cadastro da empresa', 'GET /api/empresas/{cnpj} · POST /api/empresas', [await pCadEmpresa()]); });
  await seguro('Público · Login', async () => { await g.linha('Público / Login', 'POST /api/auth/login', [await pLogin(false), await pLogin(true)]); });
  await seguro('Público · Contestar entrega', async () => {
    Q.contestar = await pContestar('Formulário');
    Q.contestado = await pContestar('Enviado');
    await g.linha('Público / Contestar entrega (sem login)', 'POST /api/canhotos/contestacao', [Q.contestar.f, (await pContestar('Erro')).f, Q.contestado.f]);
  });
  g.fechar();
  return Q;
}

// ---------- protótipo ----------
async function conecta(origem, destino, gatilho) {
  if (!origem || !destino) { ERROS.push('Protótipo: ligação sem origem ou destino'); return; }
  const trigger = gatilho || { type: 'ON_CLICK' };
  const acao = { type: 'NODE', destinationId: destino.id, navigation: 'NAVIGATE', transition: { type: 'DISSOLVE', easing: { type: 'EASE_OUT' }, duration: 0.2 } };
  try { await origem.setReactionsAsync([{ trigger, actions: [acao] }]); return; } catch (e) { /* API antiga: tenta "action" */ }
  try { await origem.setReactionsAsync([{ trigger, action: Object.assign({ preserveScrollPosition: false }, acao) }]); }
  catch (e) { ERROS.push('Protótipo: não liguei ' + origem.name + ' → ' + destino.name + ' (' + e.message + ')'); }
}
function achaTexto(raiz, trecho) {
  if (!raiz) return null;
  const t = raiz.findOne((n) => n.type === 'TEXT' && n.characters.toUpperCase().includes(trecho.toUpperCase()));
  if (!t) { ERROS.push('Protótipo: texto "' + trecho + '" não achado em ' + raiz.name); return null; }
  let n = t;
  while (n.parent && n.parent !== raiz && n.type !== 'INSTANCE' && n.width < 300) n = n.parent;
  return n;
}
function inicios(pg, novos) {
  const antigos = (pg.flowStartingPoints || []).filter((p) => !/^\d · /.test(p.name));
  pg.flowStartingPoints = antigos.concat(novos.filter((x) => x.nodeId).map((x) => ({ nodeId: x.nodeId, name: x.name })));
}

async function fluxosMotorista(pg, R) {
  const busca = await figma.getNodeByIdAsync('7:482');
  const andamento = await figma.getNodeByIdAsync('7:829');
  let cardBusca = null;
  if (busca) cardBusca = busca.findOne((n) => n.type === 'INSTANCE' && n.mainComponent && n.mainComponent.parent && SETS.card && n.mainComponent.parent.id === SETS.card.id);
  // 1 · motorista encontra e fecha um frete
  if (R.detalhe) await conecta(cardBusca, R.detalhe.f);
  if (R.detalhe && R.proposta) await conecta(R.detalhe.propor, R.proposta.f);
  if (R.proposta && R.meus) await conecta(R.proposta.enviar, R.meus.f);
  if (R.meus && R.meusAceita) await conecta(R.meus.primeiro, R.meusAceita.f);
  if (R.meusAceita && R.aguardando) await conecta(R.meusAceita.toast, R.aguardando.f);
  if (R.aguardando && R.garantido) await conecta(R.aguardando.aviso, R.garantido.f);
  // 3 · viagem e entrega
  if (R.garantido) await conecta(R.garantido.acao, andamento);
  if (R.c1) await conecta(achaTexto(andamento, 'Registrar entrega'), R.c1.f);
  if (R.c1 && R.c2) await conecta(R.c1.acao, R.c2.f);
  if (R.c2 && R.c3) await conecta(R.c2.acao, R.c3.f);
  if (R.c3 && R.enviado) await conecta(R.c3.acao, R.enviado.f);
  if (R.enviado && R.avaliar) await conecta(R.enviado.acao, R.avaliar);
  // 5 · frete de retorno
  if (R.retorno) await conecta(achaTexto(andamento, 'volte vazio'), R.retorno);
  inicios(pg, [
    { nodeId: busca && busca.id, name: '1 · Motorista encontra e fecha um frete' },
    { nodeId: R.garantido && R.garantido.f.id, name: '3 · Viagem e entrega' },
    { nodeId: andamento && andamento.id, name: '5 · Frete de retorno' },
  ]);
}

async function fluxosEmpresa(pg, Q) {
  const propostas = await figma.getNodeByIdAsync('7:948');
  // 2 · empresa publica e contrata
  if (Q.publicar && Q.quadro) await conecta(Q.publicar.publicar, Q.quadro.f);
  if (Q.quadro) await conecta(Q.quadro.alvo, propostas);
  if (Q.pendente) await conecta(achaTexto(propostas, 'Aceitar'), Q.pendente.f);
  if (Q.pendente && Q.retido) await conecta(Q.pendente.copiar, Q.retido.f);
  // 4 · contestação
  if (Q.contestar && Q.contestado) await conecta(Q.contestar.enviar, Q.contestado.f);
  if (Q.contestado && Q.contestada) await conecta(Q.contestado.f, Q.contestada.f, { type: 'AFTER_TIMEOUT', timeout: 2 });
  if (Q.contestada && Q.admin) await conecta(Q.contestada.aviso, Q.admin.f);
  if (Q.admin && Q.liberado) await conecta(Q.admin.registrar, Q.liberado.f);
  inicios(pg, [
    { nodeId: Q.publicar && Q.publicar.f.id, name: '2 · Empresa publica e contrata' },
    { nodeId: Q.contestar && Q.contestar.f.id, name: '4 · Contestação' },
  ]);
}

// ---------- relatório e arranque ----------
async function relatorio(pg) {
  for (const n of pg.children.slice()) if (n.name === 'Relatório do plugin') n.remove();
  TEMA = 'claro';
  const f = AL('V', { nome: 'Relatório do plugin', pad: 32, gap: 8, fill: 'superficie', r: 12, borda: ERROS.length ? 'alerta' : 'garantido', bw: 2 });
  W(f, 720);
  pg.appendChild(f);
  f.x = -1000; f.y = 0;
  add(f, await T(`Fretaí · plugin: ${FEITOS.length} blocos gerados, ${ERROS.length} avisos`, 'Desktop/H3'));
  for (const e of ERROS.slice(0, 80)) await TQ(f, '• ' + e, 'Pequeno/Regular', 'alerta');
  if (!ERROS.length) await TQ(f, 'Tudo certo. Pode apagar este quadro.', 'Pequeno/Regular', 'texto-secundario');
}

async function principal() {
  figma.notify('Fretaí: gerando telas. Leva alguns minutos, não feche o arquivo.', { timeout: 10000 });
  await preparar();
  const pag = (p) => figma.root.children.find((x) => x.name.startsWith(p));
  const pg1 = pag('01') || figma.root.children[0];
  const pg2 = pag('02'), pg3 = pag('03');
  if (!pg2 || !pg3) throw new Error('Não achei as páginas "02 Motorista · Mobile" e "03 Empresa · Admin · Público".');
  await figma.setCurrentPageAsync(pg1);
  await carregarComponentes(pg1);
  TEMA = 'claro';
  await componentesComplementares(pg1);
  await seguro('Capa', () => capa(pg1));
  await figma.setCurrentPageAsync(pg2);
  const R = await motorista(pg2);
  await seguro('Protótipo · fluxos 1, 3 e 5', () => fluxosMotorista(pg2, R));
  await figma.setCurrentPageAsync(pg3);
  const Q = await empresaAdmin(pg3);
  Object.assign(Q, await publico(pg3));
  await seguro('Protótipo · fluxos 2 e 4', () => fluxosEmpresa(pg3, Q));
  await relatorio(pg3);
}

principal()
  .then(() => figma.closePlugin(`Fretaí: ${FEITOS.length} blocos gerados, ${ERROS.length} avisos. Veja o "Relatório do plugin" na página 03.`))
  .catch((e) => figma.closePlugin('Fretaí: parou com erro: ' + (e && e.message ? e.message : e)));
