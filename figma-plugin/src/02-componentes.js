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
