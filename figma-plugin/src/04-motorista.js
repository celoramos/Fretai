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
