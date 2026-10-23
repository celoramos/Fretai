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
