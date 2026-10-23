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
