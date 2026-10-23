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
