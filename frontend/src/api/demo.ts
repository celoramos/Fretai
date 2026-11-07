/*
 * Modo demonstração (npm run demo): responde no lugar da API, no mesmo formato dos DTOs,
 * para ver as telas sem PostgreSQL. Estado em memória; recarregar a página volta ao início.
 * Os números são de exemplo, coerentes com o briefing (rotas reais, valores plausíveis).
 */
import type {
  Endereco,
  EventoFrete,
  Frete,
  Pagamento,
  PerfilEmpresa,
  PerfilMotorista,
  Proposta,
  StatusFrete,
  Tokens,
  Veiculo,
} from './tipos'

const E1 = 'e1000000-0000-0000-0000-000000000001'
const E2 = 'e1000000-0000-0000-0000-000000000002'
const E3 = 'e1000000-0000-0000-0000-000000000003'
const M1 = 'a1000000-0000-0000-0000-000000000001'
const M2 = 'a1000000-0000-0000-0000-000000000002'
const M3 = 'a1000000-0000-0000-0000-000000000003'
const U_EMPRESA = 'b1000000-0000-0000-0000-000000000001'

const dia = (d: number) => new Date(Date.now() + d * 86_400_000)
const iso = (d: number) => dia(d).toISOString()
const data = (d: number) => dia(d).toISOString().slice(0, 10)

function endereco(cidade: string, uf: string, cep: string, logradouro: string, lat: number, lng: number): Endereco {
  return {
    cep, logradouro, numero: '1200', complemento: null, bairro: 'Distrito Industrial', cidade, uf,
    pontoReferencia: null, enderecoCompleto: `${logradouro}, 1200 - Distrito Industrial, ${cidade}/${uf}`,
    latitude: lat, longitude: lng,
  }
}

const empresas = {
  [E1]: { id: E1, razaoSocial: 'Cerâmica Paulista Ltda', nomeFantasia: 'Cerâmica Paulista', tipo: 'EMBARCADOR' as const },
  [E2]: { id: E2, razaoSocial: 'Rota Norte Agenciamento de Cargas Ltda', nomeFantasia: 'Rota Norte', tipo: 'AGENCIADOR' as const },
  [E3]: { id: E3, razaoSocial: 'Grãos do Cerrado S.A.', nomeFantasia: null, tipo: 'EMBARCADOR' as const },
}

const perfisEmpresa: Record<string, PerfilEmpresa> = {
  [E1]: { ...empresas[E1], naPlataformaDesde: '2025-03-11T12:00:00Z', mediaNotas: 4.8, quantidadeAvaliacoes: 112, fretesPublicados: 164, fretesConcluidos: 131, percentualSaldosPagosEmDia: 96, cobrancasConsideradas: 128 },
  [E2]: { ...empresas[E2], naPlataformaDesde: '2026-08-02T12:00:00Z', mediaNotas: 3.9, quantidadeAvaliacoes: 14, fretesPublicados: 40, fretesConcluidos: 12, percentualSaldosPagosEmDia: 71, cobrancasConsideradas: 12 },
  [E3]: { ...empresas[E3], naPlataformaDesde: '2026-10-20T12:00:00Z', mediaNotas: null, quantidadeAvaliacoes: 0, fretesPublicados: 2, fretesConcluidos: 0, percentualSaldosPagosEmDia: null, cobrancasConsideradas: 0 },
}

const perfisMotorista: Record<string, PerfilMotorista> = {
  [M1]: { id: M1, nome: 'João Batista Ferreira', naPlataformaDesde: '2025-06-01T12:00:00Z', mediaNotas: 4.9, quantidadeAvaliacoes: 58, fretesConcluidos: 61, documentosVerificados: ['CNH', 'CRLV'] },
  [M2]: { id: M2, nome: 'Marcos Vinícius Rocha', naPlataformaDesde: '2026-02-14T12:00:00Z', mediaNotas: 4.6, quantidadeAvaliacoes: 21, fretesConcluidos: 23, documentosVerificados: ['CNH', 'CRLV'] },
  [M3]: { id: M3, nome: 'Ana Paula Siqueira', naPlataformaDesde: '2026-09-30T12:00:00Z', mediaNotas: null, quantidadeAvaliacoes: 0, fretesConcluidos: 0, documentosVerificados: ['CNH'] },
}

const veiculos: Veiculo[] = [
  { id: 'v1', motoristaId: M1, placa: 'ABC1D23', rntrc: '045821937', tipo: 'CARRETA', carroceria: 'SIDER', numeroEixos: 5, rastreador: true, criadoEm: iso(-300) },
  { id: 'v2', motoristaId: M1, placa: 'FRT2E45', rntrc: '045821937', tipo: 'TRUCK', carroceria: 'BAU', numeroEixos: 3, rastreador: false, criadoEm: iso(-120) },
  { id: 'v3', motoristaId: M2, placa: 'QWE4R56', rntrc: '051234880', tipo: 'CARRETA_LS', carroceria: 'SIDER', numeroEixos: 6, rastreador: true, criadoEm: iso(-200) },
  { id: 'v4', motoristaId: M3, placa: 'RTY7U89', rntrc: '060011422', tipo: 'CARRETA', carroceria: 'SIDER', numeroEixos: 5, rastreador: false, criadoEm: iso(-30) },
]
const resumoVeiculo = (id: string) => {
  const v = veiculos.find((x) => x.id === id)!
  return { id: v.id, placa: v.placa, tipo: v.tipo, carroceria: v.carroceria, numeroEixos: v.numeroEixos, rastreador: v.rastreador }
}

function frete(parcial: Partial<Frete> & Pick<Frete, 'id' | 'coleta' | 'entrega'>): Frete {
  const status = parcial.status ?? 'PUBLICADO'
  return {
    status, statusDescricao: status, cliente: null, empresa: empresas[E1], motorista: null, veiculo: null,
    nomeDestinatario: 'Recebimento - Doca 3', telefoneDestinatario: '(21) 3333-4410',
    descricaoCarga: 'Pisos cerâmicos paletizados', especieCarga: 'Paletes', tipoCargaAntt: 'CARGA_GERAL', pesoKg: 27000,
    valor: null, valorACombinar: false, adicionalFeriado: null, valorTotal: null,
    veiculosAceitos: ['CARRETA', 'CARRETA_LS'], carroceriasAceitas: ['SIDER', 'BAU'], exigeRastreador: true,
    complemento: false, publicadoPorAgenciador: false, dataColeta: data(2), feriado: false, nomeFeriado: null,
    domingo: false, distanciaKm: null, distanciaEstimada: false, valorAcordado: null, adiantamentoPercentual: null,
    prazoEntrega: null, preco: null, motivoCancelamento: null, criadoEm: iso(-1), aceitoEm: null, concluidoEm: null,
    pagoEm: null, ...parcial,
  }
}

const campinas = endereco('Campinas', 'SP', '13069-380', 'Rod. Anhanguera, km 98', -22.85, -47.09)
const rio = endereco('Rio de Janeiro', 'RJ', '20931-000', 'Av. Brasil', -22.87, -43.26)
const jundiai = endereco('Jundiaí', 'SP', '13213-000', 'Av. Antonio Frederico Ozanan', -23.17, -46.9)
const curitiba = endereco('Curitiba', 'PR', '81460-000', 'Rod. BR-116', -25.5, -49.24)
const cuiaba = endereco('Cuiabá', 'MT', '78098-000', 'Av. Fernando Corrêa da Costa', -15.6, -56.06)
const belem = endereco('Belém', 'PA', '66640-000', 'Rod. Augusto Montenegro', -1.37, -48.45)
const sorocaba = endereco('Sorocaba', 'SP', '18087-000', 'Av. Ipanema', -23.47, -47.48)
const bh = endereco('Belo Horizonte', 'MG', '31270-000', 'Anel Rodoviário', -19.88, -43.97)
const limeira = endereco('Limeira', 'SP', '13486-000', 'Rod. Anhanguera, km 148', -22.58, -47.4)
const sjc = endereco('São José dos Campos', 'SP', '12238-000', 'Rod. Presidente Dutra, km 147', -23.2, -45.88)
const piracicaba = endereco('Piracicaba', 'SP', '13412-000', 'Av. Comendador Leopoldo Dedini', -22.73, -47.64)
const santos = endereco('Santos', 'SP', '11095-000', 'Av. Engenheiro Augusto Barata', -23.93, -46.33)

const exemplo = { coeficientesDeExemplo: true, eixosConsiderados: 5 }

const fretes: Frete[] = [
  frete({ id: 'f1', coleta: campinas, entrega: rio, valor: 4850, valorTotal: 4850, distanciaKm: 430, status: 'PROPOSTA_ENVIADA',
    preco: { ...exemplo, pisoMinimo: 3920, abaixoDoPiso: false, acimaDaMedia: false, mediaRotaPorKm: 10.9 } }),
  frete({ id: 'f2', coleta: jundiai, entrega: curitiba, valor: 5200, valorTotal: 5200, valorAcordado: 5100, adiantamentoPercentual: 40,
    distanciaKm: 470, status: 'EM_TRANSITO', motorista: { id: M1, nome: 'João Batista Ferreira', tipoVeiculo: 'CARRETA', placa: 'ABC1D23' },
    veiculo: resumoVeiculo('v1'), aceitoEm: iso(-2), dataColeta: data(-1), prazoEntrega: data(1),
    preco: { ...exemplo, pisoMinimo: 4210, abaixoDoPiso: false, acimaDaMedia: false, mediaRotaPorKm: 10.6 } }),
  frete({ id: 'f3', coleta: cuiaba, entrega: belem, empresa: empresas[E3], valorACombinar: true, distanciaKm: 2940, distanciaEstimada: true,
    descricaoCarga: 'Soja em grãos', especieCarga: 'Granel', tipoCargaAntt: 'GRANEL_SOLIDO', pesoKg: 37000,
    veiculosAceitos: ['BITREM', 'RODOTREM'], carroceriasAceitas: ['GRANELEIRO'], exigeRastreador: false, dataColeta: data(5),
    preco: { coeficientesDeExemplo: true, eixosConsiderados: 7, pisoMinimo: 24890, abaixoDoPiso: false, acimaDaMedia: false, mediaRotaPorKm: null } }),
  frete({ id: 'f4', coleta: sorocaba, entrega: bh, empresa: empresas[E2], publicadoPorAgenciador: true, valor: 11900, valorTotal: 11900,
    distanciaKm: 600, descricaoCarga: 'Eletrônicos', exigeRastreador: false, complemento: true,
    preco: { ...exemplo, pisoMinimo: 5180, abaixoDoPiso: false, acimaDaMedia: true, mediaRotaPorKm: 10.2 } }),
  frete({ id: 'f5', coleta: limeira, entrega: sjc, valor: 2100, valorTotal: 2100, distanciaKm: 240, dataColeta: data(3),
    feriado: true, nomeFeriado: 'Proclamação da República',
    preco: { ...exemplo, pisoMinimo: 2380, abaixoDoPiso: true, acimaDaMedia: false, mediaRotaPorKm: 10.4 } }),
  frete({ id: 'f6', coleta: piracicaba, entrega: santos, valor: 2900, valorTotal: 2900, valorAcordado: 2900, adiantamentoPercentual: 50,
    distanciaKm: 260, status: 'ACEITO', motorista: { id: M1, nome: 'João Batista Ferreira', tipoVeiculo: 'CARRETA', placa: 'ABC1D23' },
    veiculo: resumoVeiculo('v1'), aceitoEm: iso(-0.2), dataColeta: data(1), prazoEntrega: data(2),
    preco: { ...exemplo, pisoMinimo: 2510, abaixoDoPiso: false, acimaDaMedia: false, mediaRotaPorKm: 11.1 } }),
  frete({ id: 'f7', coleta: campinas, entrega: curitiba, valor: 5600, valorTotal: 5600, valorAcordado: 5450, adiantamentoPercentual: 30,
    distanciaKm: 510, status: 'PAGO', motorista: { id: M2, nome: 'Marcos Vinícius Rocha', tipoVeiculo: 'CARRETA_LS', placa: 'QWE4R56' },
    veiculo: resumoVeiculo('v3'), criadoEm: iso(-12), aceitoEm: iso(-11), concluidoEm: iso(-8), pagoEm: iso(-7), dataColeta: data(-10),
    preco: { ...exemplo, pisoMinimo: 4560, abaixoDoPiso: false, acimaDaMedia: false, mediaRotaPorKm: 10.8 } }),
]

/** Distância da base do motorista demo (Campinas) até a coleta de cada frete aberto. */
const distanciaDaBase: Record<string, number> = { f1: 6, f3: 1290, f4: 84, f5: 52 }

const propostas: Proposta[] = [
  proposta('p1', 'f1', M1, 'v1', 4850, 40, -0.5),
  proposta('p2', 'f1', M2, 'v3', 4600, 30, -0.3, 'Posso carregar amanhã cedo.'),
  proposta('p3', 'f1', M3, 'v4', 4390, 50, -0.1),
  { ...proposta('p4', 'f2', M1, 'v1', 5100, 40, -2.2), status: 'ACEITA', respondidaEm: iso(-2) },
  { ...proposta('p5', 'f6', M1, 'v1', 2900, 50, -0.4), status: 'ACEITA', respondidaEm: iso(-0.2) },
]

function proposta(id: string, freteId: string, motoristaId: string, veiculoId: string, valor: number, adiant: number, quando: number, obs: string | null = null): Proposta {
  return {
    id, freteId, motorista: { id: motoristaId, nome: perfisMotorista[motoristaId].nome }, veiculo: resumoVeiculo(veiculoId),
    autorPapel: 'MOTORISTA', valor, adiantamentoPercentual: adiant, valorAdiantamento: Math.round(valor * adiant) / 100,
    prazoEntrega: data(4), observacao: obs, status: 'ENVIADA', criadaEm: iso(quando), respondidaEm: null,
  }
}

const pagamentos: Pagamento[] = [
  pagamento('f2', 5100, 40, 'ADIANTAMENTO_LIBERADO'),
  pagamento('f6', 2900, 50, 'RETIDO'),
  pagamento('f7', 5450, 30, 'LIBERADO'),
]

function pagamento(freteId: string, total: number, adiant: number, status: Pagamento['status']): Pagamento {
  const adiantamento = Math.round(total * adiant) / 100
  return {
    id: `pg-${freteId}`, freteId, status, valorTotal: total, valorAdiantamento: adiantamento, valorSaldo: total - adiantamento,
    gateway: 'FAKE', cobrancaId: `cob_${freteId}`, pixCopiaECola: null, pixQrCodeBase64: null, vencimento: iso(1),
    pagoEm: status === 'PENDENTE' ? null : iso(-1.5), adiantamentoLiberadoEm: ['ADIANTAMENTO_LIBERADO', 'LIBERADO'].includes(status) ? iso(-1) : null,
    saldoLiberavelApos: null, saldoBloqueado: false, saldoLiberadoEm: status === 'LIBERADO' ? iso(-7) : null, estornadoEm: null,
  }
}

const eventos: Record<string, EventoFrete[]> = {
  f1: [ev(null, 'PUBLICADO', 'EMPRESA', -1), ev('PUBLICADO', 'PROPOSTA_ENVIADA', 'MOTORISTA', -0.5)],
  f2: [ev(null, 'PUBLICADO', 'EMPRESA', -3), ev('PUBLICADO', 'PROPOSTA_ENVIADA', 'MOTORISTA', -2.2), ev('PROPOSTA_ENVIADA', 'ACEITO', 'EMPRESA', -2), ev('ACEITO', 'EM_TRANSITO', 'MOTORISTA', -1, 'Saída da coleta às 6h10.')],
  f6: [ev(null, 'PUBLICADO', 'EMPRESA', -1), ev('PUBLICADO', 'PROPOSTA_ENVIADA', 'MOTORISTA', -0.4), ev('PROPOSTA_ENVIADA', 'ACEITO', 'EMPRESA', -0.2)],
  f7: [ev(null, 'PUBLICADO', 'EMPRESA', -12), ev('PUBLICADO', 'ACEITO', 'EMPRESA', -11), ev('ACEITO', 'EM_TRANSITO', 'MOTORISTA', -10), ev('EM_TRANSITO', 'ENTREGUE', 'MOTORISTA', -8), ev('ENTREGUE', 'PAGO', null, -7)],
}
function ev(de: StatusFrete | null, para: StatusFrete, papel: EventoFrete['autorPapel'], quando: number, observacao: string | null = null): EventoFrete {
  return { de, para, autorId: null, autorPapel: papel, observacao, ocorridoEm: iso(quando) }
}

// ---------- contas (login e cadastro) ----------

/**
 * Contas da demonstração. O cadastro acrescenta aqui; toda conta nova vê os dados do motorista ou da
 * empresa de exemplo. As novas ficam no localStorage para sobreviver a um F5 (o resto do demo não precisa).
 */
type ContaDemo = { senha: string | null; papel: 'MOTORISTA' | 'EMPRESA' }
const CHAVE_CONTAS = 'fretai.demo.contas'
const contas: Record<string, ContaDemo> = {
  'motorista@demo.fretai': { senha: 'demo123', papel: 'MOTORISTA' },
  'empresa@demo.fretai': { senha: 'demo123', papel: 'EMPRESA' },
  ...(JSON.parse(localStorage.getItem(CHAVE_CONTAS) ?? '{}') as Record<string, ContaDemo>),
}
function guardarConta(email: string, conta: ContaDemo) {
  contas[email] = conta
  const novas = JSON.parse(localStorage.getItem(CHAVE_CONTAS) ?? '{}') as Record<string, ContaDemo>
  localStorage.setItem(CHAVE_CONTAS, JSON.stringify({ ...novas, [email]: conta }))
}
// O botão do Google da demonstração (components/BotaoGoogle.tsx) manda esta mesma credencial.
const CREDENCIAL_GOOGLE_DEMO = 'demo-google'
const GOOGLE_DEMO = { email: 'voce@gmail.com', nome: 'Você (Google de demonstração)' }

function tokensDe(papel: 'MOTORISTA' | 'EMPRESA'): Tokens {
  const motorista = papel === 'MOTORISTA'
  return {
    accessToken: motorista ? 'demo-motorista' : 'demo-empresa', refreshToken: 'demo-refresh', tokenType: 'Bearer',
    expiresIn: 900, usuarioId: motorista ? M1 : U_EMPRESA, papel, empresaId: motorista ? null : E1,
  }
}

// ---------- roteamento ----------

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
const problema = (status: number, title: string, detail: string) => json({ title, detail, status }, status)
const pagina = <T,>(itens: T[]) => ({ content: itens, page: { size: 20, number: 0, totalElements: itens.length, totalPages: 1 } })
const espera = () => new Promise((r) => setTimeout(r, 350 + Math.random() * 300))

function registrar(id: string, de: StatusFrete, para: StatusFrete, papel: EventoFrete['autorPapel']) {
  ;(eventos[id] ??= []).push(ev(de, para, papel, 0))
}

export async function responderDemo(metodo: string, caminho: string, corpo: unknown, token?: string): Promise<Response> {
  await espera()
  const url = new URL(caminho, 'http://demo')
  const p = url.pathname
  const b = (corpo ?? {}) as Record<string, unknown>
  let m: RegExpMatchArray | null

  if (metodo === 'POST' && p === '/api/auth/login') {
    const email = String(b.email ?? '').toLowerCase()
    const conta = contas[email]
    if (!conta || conta.senha === null || b.senha !== conta.senha) {
      return problema(401, 'Login inválido', 'E-mail ou senha incorretos.')
    }
    return json(tokensDe(conta.papel))
  }
  // Google simulado: o botão da demonstração manda esta credencial, que vale por "voce@gmail.com".
  if (metodo === 'POST' && p === '/api/auth/google') {
    if (b.credencial !== CREDENCIAL_GOOGLE_DEMO) return problema(401, 'Login inválido', 'Não deu para confirmar sua conta Google. Tente de novo.')
    const conta = contas[GOOGLE_DEMO.email]
    if (!conta) {
      return json({ title: 'Conta não encontrada', detail: 'Ainda não existe conta com esse Google. Complete o cadastro para continuar.',
        status: 404, codigo: 'CADASTRO_NECESSARIO', email: GOOGLE_DEMO.email, nome: GOOGLE_DEMO.nome }, 404)
    }
    return json(tokensDe(conta.papel))
  }
  if (metodo === 'POST' && (p === '/api/motoristas' || p === '/api/empresas')) {
    const motorista = p === '/api/motoristas'
    const pessoa = (motorista ? b : b.responsavel ?? {}) as Record<string, unknown>
    const google = pessoa.credencialGoogle === CREDENCIAL_GOOGLE_DEMO
    const email = google ? GOOGLE_DEMO.email : String(pessoa.email ?? '').toLowerCase()
    if (contas[email]) return problema(409, 'Conflito', 'Já existe uma conta com esse e-mail.')
    guardarConta(email, { senha: google ? null : String(pessoa.senha ?? ''), papel: motorista ? 'MOTORISTA' : 'EMPRESA' })
    return json({ id: motorista ? M1 : E1, email }, 201)
  }
  if (metodo === 'GET' && (m = p.match(/^\/api\/empresas\/([0-9./-]{14,18})$/))) {
    return json({ cnpj: m[1].replace(/\D/g, ''), razaoSocial: 'Transportes Exemplo Ltda', nomeFantasia: 'Exemplo Cargas', situacaoCadastral: 'ATIVA' })
  }
  if (p === '/api/auth/logout') return new Response(null, { status: 204 })
  if (!token) return problema(401, 'Não autenticado', 'Faça login de novo.')

  if (metodo === 'GET' && p === '/api/fretes/busca') {
    const raio = Number(url.searchParams.get('raioKm') ?? 100)
    const achados = fretes
      .filter((f) => (f.status === 'PUBLICADO' || f.status === 'PROPOSTA_ENVIADA') && distanciaDaBase[f.id] !== undefined)
      .map((f) => ({ distanciaOrigemKm: distanciaDaBase[f.id], frete: f }))
      .filter((a) => a.distanciaOrigemKm <= raio)
      .sort((a, z) => a.distanciaOrigemKm - z.distanciaOrigemKm)
    return json(pagina(achados))
  }
  if (metodo === 'GET' && (m = p.match(/^\/api\/fretes\/empresa\/([^/]+)$/))) {
    return json(pagina(fretes.filter((f) => f.empresa?.id === m![1]).sort((a, z) => z.criadoEm.localeCompare(a.criadoEm))))
  }
  if ((m = p.match(/^\/api\/fretes\/([^/]+)(\/[a-z]+)?$/))) {
    const f = fretes.find((x) => x.id === m![1])
    if (!f) return problema(404, 'Frete não encontrado', 'Esse frete não existe ou foi removido.')
    const sub = m[2]
    if (metodo === 'GET' && !sub) return json(f)
    if (metodo === 'GET' && sub === '/eventos') return json(eventos[f.id] ?? [])
    if (metodo === 'GET' && sub === '/propostas') return json(propostas.filter((x) => x.freteId === f.id))
    if (metodo === 'GET' && sub === '/pagamento') {
      const pg = pagamentos.find((x) => x.freteId === f.id)
      return pg ? json(pg) : problema(404, 'Sem cobrança', 'Ainda não há cobrança para este frete.')
    }
    if (metodo === 'POST' && sub === '/pagamento') {
      const total = f.valorAcordado ?? f.valor ?? 0
      const novo = { ...pagamento(f.id, total, f.adiantamentoPercentual ?? 0, 'PENDENTE'), pixCopiaECola: `00020126580014br.gov.bcb.pix0136demo-${f.id}-fretai5204000053039865406${total.toFixed(2)}5802BR6304ABCD` }
      pagamentos.push(novo)
      return json(novo, 201)
    }
    if (metodo === 'POST' && sub === '/propostas') {
      const nova = proposta(`p${propostas.length + 1}`, f.id, M1, String(b.veiculoId ?? 'v1'), Number(b.valor), Number(b.adiantamentoPercentual ?? 0), 0)
      propostas.push(nova)
      if (f.status === 'PUBLICADO') { registrar(f.id, f.status, 'PROPOSTA_ENVIADA', 'MOTORISTA'); f.status = 'PROPOSTA_ENVIADA' }
      return json(nova, 201)
    }
    if (metodo === 'POST' && sub === '/aceite') {
      if (f.valorACombinar) return problema(422, 'Frete a combinar', 'Frete sem valor só fecha por proposta.')
      registrar(f.id, f.status, 'ACEITO', 'MOTORISTA')
      const v = veiculos.find((x) => x.id === b.veiculoId) ?? veiculos[0]
      Object.assign(f, {
        status: 'ACEITO', aceitoEm: iso(0), valorAcordado: f.valor, veiculo: resumoVeiculo(v.id),
        motorista: { id: M1, nome: perfisMotorista[M1].nome, tipoVeiculo: v.tipo, placa: v.placa },
      })
      return json(f)
    }
    if (metodo === 'POST' && sub === '/inicio') {
      if (f.status !== 'ACEITO') return problema(409, 'Transição inválida', 'Só dá para iniciar a viagem de um frete aceito.')
      registrar(f.id, f.status, 'EM_TRANSITO', 'MOTORISTA')
      f.status = 'EM_TRANSITO'
      const pg = pagamentos.find((x) => x.freteId === f.id)
      if (pg?.status === 'RETIDO') { pg.status = 'ADIANTAMENTO_LIBERADO'; pg.adiantamentoLiberadoEm = iso(0) }
      return json(f)
    }
  }
  if (metodo === 'POST' && (m = p.match(/^\/api\/propostas\/([^/]+)\/(aceite|recusa)$/))) {
    const pr = propostas.find((x) => x.id === m![1])
    if (!pr) return problema(404, 'Proposta não encontrada', 'Essa proposta não existe.')
    if (pr.status !== 'ENVIADA') return problema(409, 'Proposta já respondida', 'Essa proposta já foi respondida.')
    pr.respondidaEm = iso(0)
    if (m[2] === 'recusa') { pr.status = 'RECUSADA'; return json(pr) }
    const f = fretes.find((x) => x.id === pr.freteId)!
    pr.status = 'ACEITA'
    for (const outra of propostas) if (outra.freteId === f.id && outra.status === 'ENVIADA') { outra.status = 'RECUSADA'; outra.respondidaEm = iso(0) }
    registrar(f.id, f.status, 'ACEITO', 'EMPRESA')
    Object.assign(f, {
      status: 'ACEITO', aceitoEm: iso(0), valorAcordado: pr.valor, adiantamentoPercentual: pr.adiantamentoPercentual,
      prazoEntrega: pr.prazoEntrega, veiculo: pr.veiculo,
      motorista: { id: pr.motorista.id, nome: pr.motorista.nome, tipoVeiculo: pr.veiculo?.tipo ?? null, placa: pr.veiculo?.placa ?? null },
    })
    return json(pr)
  }
  if (metodo === 'GET' && p === '/api/propostas/minhas') return json(pagina(propostas.filter((x) => x.motorista.id === M1)))
  if (metodo === 'GET' && (m = p.match(/^\/api\/empresas\/([^/]+)\/perfil$/))) return json(perfisEmpresa[m[1]])
  if (metodo === 'GET' && (m = p.match(/^\/api\/motoristas\/([^/]+)\/perfil$/))) return json(perfisMotorista[m[1]])
  if (metodo === 'GET' && (m = p.match(/^\/api\/motoristas\/([^/]+)\/veiculos$/))) return json(veiculos.filter((v) => v.motoristaId === m![1]))

  return problema(404, 'Fora da demonstração', `O modo demo não cobre ${metodo} ${p}.`)
}
