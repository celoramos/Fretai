/*
 * Modo demonstração (npm run demo): responde no lugar da API, no mesmo formato dos DTOs,
 * para ver as telas sem PostgreSQL. Estado em memória; recarregar a página volta ao início.
 * Os números são de exemplo, coerentes com o briefing (rotas reais, valores plausíveis).
 */
import type {
  AcessoDocumento,
  Avaliacao,
  Canhoto,
  Cliente,
  Coeficiente,
  Documento,
  Empresa,
  Endereco,
  EventoFrete,
  FotoCarga,
  Frete,
  Motorista,
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
const U_ADMIN = 'c1000000-0000-0000-0000-000000000001'
const U_CLIENTE = 'd1000000-0000-0000-0000-000000000001'

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

/** Endereço de casa, para os fretes do cliente pessoa física (o de cima é de galpão). */
function casa(cidade: string, uf: string, cep: string, logradouro: string, numero: string, complemento: string | null, bairro: string, lat: number, lng: number): Endereco {
  return {
    cep, logradouro, numero, complemento, bairro, cidade, uf, pontoReferencia: null,
    enderecoCompleto: `${logradouro}, ${numero}${complemento ? `, ${complemento}` : ''} - ${bairro}, ${cidade}/${uf}`,
    latitude: lat, longitude: lng,
  }
}

const clientes = { [U_CLIENTE]: { id: U_CLIENTE, nome: 'Paula Andrade' } }

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

const caminhao = (modelo: string) => ({ categoria: 'CAMINHAO' as const, modelo })
const semCaminhao = { rntrc: null, tipo: null, carroceria: null, numeroEixos: null, rastreador: false }
const veiculos: Veiculo[] = [
  { id: 'v1', motoristaId: M1, placa: 'ABC1D23', ...caminhao('Scania R 450'), rntrc: '045821937', tipo: 'CARRETA', carroceria: 'SIDER', numeroEixos: 5, rastreador: true, criadoEm: iso(-300) },
  { id: 'v2', motoristaId: M1, placa: 'FRT2E45', ...caminhao('VW Constellation'), rntrc: '045821937', tipo: 'TRUCK', carroceria: 'BAU', numeroEixos: 3, rastreador: false, criadoEm: iso(-120) },
  { id: 'v3', motoristaId: M2, placa: 'QWE4R56', ...caminhao('Volvo FH 540'), rntrc: '051234880', tipo: 'CARRETA_LS', carroceria: 'SIDER', numeroEixos: 6, rastreador: true, criadoEm: iso(-200) },
  { id: 'v4', motoristaId: M3, placa: 'RTY7U89', ...caminhao('Mercedes Actros'), rntrc: '060011422', tipo: 'CARRETA', carroceria: 'SIDER', numeroEixos: 5, rastreador: false, criadoEm: iso(-30) },
  // Veículos pequenos: são eles que pegam a mudança e a entrega avulsa do cliente pessoa física.
  { id: 'v5', motoristaId: M3, placa: 'MUD5A12', categoria: 'VAN', modelo: 'Fiat Ducato', ...semCaminhao, criadoEm: iso(-20) },
  { id: 'v6', motoristaId: M2, placa: 'TRE3Q44', ...caminhao('Hyundai HR'), rntrc: '051234880', tipo: 'TRES_QUARTOS', carroceria: 'BAU', numeroEixos: 2, rastreador: false, criadoEm: iso(-90) },
  { id: 'v7', motoristaId: M1, placa: 'VAN7M01', categoria: 'VAN', modelo: 'Renault Master', ...semCaminhao, criadoEm: iso(-60) },
]
const resumoVeiculo = (id: string) => {
  const v = veiculos.find((x) => x.id === id)!
  return { id: v.id, placa: v.placa, categoria: v.categoria, modelo: v.modelo, tipo: v.tipo, carroceria: v.carroceria, numeroEixos: v.numeroEixos, rastreador: v.rastreador }
}

function frete(parcial: Partial<Frete> & Pick<Frete, 'id' | 'coleta' | 'entrega'>): Frete {
  const status = parcial.status ?? 'PUBLICADO'
  return {
    status, statusDescricao: status, cliente: null, empresa: empresas[E1], motorista: null, veiculo: null,
    nomeDestinatario: 'Recebimento - Doca 3', telefoneDestinatario: '(21) 3333-4410',
    descricaoCarga: 'Pisos cerâmicos paletizados', especieCarga: 'Paletes', tipoCargaAntt: 'CARGA_GERAL', categoriaVeiculo: null, tipoCarga: null, pesoKg: 27000,
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
const joinville = endereco('Joinville', 'SC', '89219-000', 'Rua Dona Francisca', -26.26, -48.85)
const araucaria = endereco('Araucária', 'PR', '83707-000', 'Rod. do Xisto, km 18', -25.59, -49.4)

const exemplo = { coeficientesDeExemplo: true, eixosConsiderados: 5 }

const cambui = casa('Campinas', 'SP', '13025-320', 'Rua Coronel Quirino', '850', 'Apto 42', 'Cambuí', -22.896, -47.055)
const vergueiro = casa('Sorocaba', 'SP', '18035-400', 'Rua Padre Luiz', '311', null, 'Jardim Vergueiro', -23.49, -47.47)
const perdizes = casa('São Paulo', 'SP', '05014-000', 'Rua Monte Alegre', '1200', 'Apto 81', 'Perdizes', -23.536, -46.677)
const anhangabau = casa('Jundiaí', 'SP', '13208-090', 'Rua do Retiro', '47', 'Casa 2', 'Anhangabaú', -23.18, -46.89)

/** Frete pontual do cliente: qualquer veículo, sem carga ANTT e sem piso, como o da API. */
function freteCliente(parcial: Partial<Frete> & Pick<Frete, 'id' | 'coleta' | 'entrega'>): Frete {
  return frete({ empresa: null, cliente: clientes[U_CLIENTE], especieCarga: null, tipoCargaAntt: null, veiculosAceitos: [], carroceriasAceitas: [],
    exigeRastreador: false, preco: null, ...parcial })
}

const fretes: Frete[] = [
  frete({ id: 'f1', coleta: campinas, entrega: rio, valor: 4850, valorTotal: 4850, distanciaKm: 430, status: 'PROPOSTA_ENVIADA',
    preco: { ...exemplo, pisoMinimo: 3920, abaixoDoPiso: false, acimaDaMedia: false, mediaRotaPorKm: 10.9 } }),
  frete({ id: 'f2', coleta: jundiai, entrega: curitiba, valor: 5200, valorTotal: 5200, valorAcordado: 5100, adiantamentoPercentual: 40,
    distanciaKm: 470, status: 'EM_TRANSITO', motorista: { id: M1, nome: 'João Batista Ferreira', tipoVeiculo: 'CAMINHAO', placa: 'ABC1D23' },
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
    distanciaKm: 260, status: 'ACEITO', motorista: { id: M1, nome: 'João Batista Ferreira', tipoVeiculo: 'CAMINHAO', placa: 'ABC1D23' },
    veiculo: resumoVeiculo('v1'), aceitoEm: iso(-0.2), dataColeta: data(1), prazoEntrega: data(2),
    preco: { ...exemplo, pisoMinimo: 2510, abaixoDoPiso: false, acimaDaMedia: false, mediaRotaPorKm: 11.1 } }),
  frete({ id: 'f7', coleta: campinas, entrega: curitiba, valor: 5600, valorTotal: 5600, valorAcordado: 5450, adiantamentoPercentual: 30,
    distanciaKm: 510, status: 'PAGO', motorista: { id: M2, nome: 'Marcos Vinícius Rocha', tipoVeiculo: 'CAMINHAO', placa: 'QWE4R56' },
    veiculo: resumoVeiculo('v3'), criadoEm: iso(-12), aceitoEm: iso(-11), concluidoEm: iso(-8), pagoEm: iso(-7), dataColeta: data(-10),
    preco: { ...exemplo, pisoMinimo: 4560, abaixoDoPiso: false, acimaDaMedia: false, mediaRotaPorKm: 10.8 } }),
  frete({ id: 'f8', coleta: sorocaba, entrega: santos, valor: 2300, valorTotal: 2300, valorAcordado: 2300, adiantamentoPercentual: 40,
    distanciaKm: 120, status: 'ENTREGUE', motorista: { id: M1, nome: 'João Batista Ferreira', tipoVeiculo: 'CAMINHAO', placa: 'ABC1D23' },
    veiculo: resumoVeiculo('v1'), criadoEm: iso(-3), aceitoEm: iso(-2.5), concluidoEm: iso(-0.2), dataColeta: data(-1),
    descricaoCarga: 'Revestimentos cerâmicos', preco: { ...exemplo, pisoMinimo: 1490, abaixoDoPiso: false, acimaDaMedia: false, mediaRotaPorKm: 11.4 } }),
  frete({ id: 'f9', coleta: araucaria, entrega: joinville, empresa: empresas[E3], valor: 2650, valorTotal: 2650, distanciaKm: 140, dataColeta: data(2),
    descricaoCarga: 'Bobinas de papel', especieCarga: 'Bobinas', veiculosAceitos: ['CARRETA', 'CARRETA_LS'], carroceriasAceitas: ['SIDER', 'GRADE_BAIXA'],
    exigeRastreador: false, preco: { ...exemplo, pisoMinimo: 1720, abaixoDoPiso: false, acimaDaMedia: false, mediaRotaPorKm: 17.9 } }),
  frete({ id: 'f10', coleta: santos, entrega: campinas, valor: 2250, valorTotal: 2250, distanciaKm: 160, dataColeta: data(1),
    descricaoCarga: 'Contêiner de 20 pés vazio', especieCarga: 'Contêiner', tipoCargaAntt: 'CONTEINERIZADA', pesoKg: 2300,
    veiculosAceitos: ['CARRETA', 'CARRETA_LS'], carroceriasAceitas: [], exigeRastreador: true,
    preco: { ...exemplo, pisoMinimo: 1810, abaixoDoPiso: false, acimaDaMedia: false, mediaRotaPorKm: 13.6 } }),
  // De outra empresa e outro motorista: só aparece para o administrador, na fila de contestações.
  frete({ id: 'f11', coleta: curitiba, entrega: joinville, empresa: empresas[E2], publicadoPorAgenciador: true, valor: 3100, valorTotal: 3100,
    valorAcordado: 3100, adiantamentoPercentual: 30, distanciaKm: 130, status: 'ENTREGUE', descricaoCarga: 'Peças automotivas em caixas',
    motorista: { id: M2, nome: 'Marcos Vinícius Rocha', tipoVeiculo: 'CAMINHAO', placa: 'QWE4R56' }, veiculo: resumoVeiculo('v3'),
    criadoEm: iso(-4), aceitoEm: iso(-3.5), concluidoEm: iso(-1.2), dataColeta: data(-2),
    preco: { ...exemplo, pisoMinimo: 1640, abaixoDoPiso: false, acimaDaMedia: false, mediaRotaPorKm: 12.1 } }),
  // Os três fretes da cliente demo, um em cada momento em que ela tem de agir: propostas, Pix e entrega.
  freteCliente({ id: 'f12', coleta: cambui, entrega: vergueiro, status: 'PROPOSTA_ENVIADA', categoriaVeiculo: 'VAN', tipoCarga: 'MUDANCA', valor: 900, valorTotal: 900, distanciaKm: 92,
    distanciaEstimada: true, descricaoCarga: 'Mudança: geladeira, fogão, sofá e 15 caixas', pesoKg: 450, dataColeta: data(4),
    nomeDestinatario: 'Paula Andrade', telefoneDestinatario: '15988776655', criadoEm: iso(-0.6) }),
  freteCliente({ id: 'f13', coleta: perdizes, entrega: cambui, status: 'ACEITO', categoriaVeiculo: 'VAN', tipoCarga: 'MOVEIS', valor: 750, valorTotal: 750, valorAcordado: 750,
    adiantamentoPercentual: 30, distanciaKm: 98, distanciaEstimada: true, descricaoCarga: 'Piano vertical', pesoKg: 280, dataColeta: data(2),
    nomeDestinatario: 'Paula Andrade', telefoneDestinatario: '19988776655', prazoEntrega: data(2), criadoEm: iso(-2), aceitoEm: iso(-0.1),
    motorista: { id: M2, nome: 'Marcos Vinícius Rocha', tipoVeiculo: 'CAMINHAO', placa: 'TRE3Q44' }, veiculo: resumoVeiculo('v6') }),
  freteCliente({ id: 'f14', coleta: cambui, entrega: anhangabau, status: 'ENTREGUE', categoriaVeiculo: 'UTILITARIO', tipoCarga: 'MOVEIS', valor: 380, valorTotal: 380, valorAcordado: 380,
    adiantamentoPercentual: 30, distanciaKm: 42, distanciaEstimada: true, descricaoCarga: 'Máquina de lavar e 6 caixas', pesoKg: 120,
    dataColeta: data(-1), nomeDestinatario: 'Lúcia Andrade', telefoneDestinatario: '11977665544', criadoEm: iso(-5), aceitoEm: iso(-4.5),
    concluidoEm: iso(-0.3), motorista: { id: M3, nome: 'Ana Paula Siqueira', tipoVeiculo: 'VAN', placa: 'MUD5A12' }, veiculo: resumoVeiculo('v5') }),
  // Mais uma etapa cada: procurando motorista, em viagem, terminado e cancelado.
  freteCliente({ id: 'f15', coleta: perdizes, entrega: anhangabau, status: 'PUBLICADO', categoriaVeiculo: 'UTILITARIO', tipoCarga: 'CAIXAS',
    valor: 320, valorTotal: 320, distanciaKm: 61, distanciaEstimada: true, descricaoCarga: 'Seis caixas de livros e uma estante desmontada',
    pesoKg: 200, dataColeta: data(3), nomeDestinatario: 'Lúcia Andrade', telefoneDestinatario: '11977665544', criadoEm: iso(-0.05) }),
  freteCliente({ id: 'f16', coleta: cambui, entrega: perdizes, status: 'EM_TRANSITO', categoriaVeiculo: 'VAN', tipoCarga: 'MUDANCA',
    valor: 680, valorTotal: 680, valorAcordado: 680, adiantamentoPercentual: 30, distanciaKm: 96, distanciaEstimada: true,
    descricaoCarga: 'Mudança de quitinete: cama, geladeira e 10 caixas', pesoKg: 650, dataColeta: data(0), nomeDestinatario: 'Paula Andrade',
    telefoneDestinatario: '11988776655', prazoEntrega: data(0), criadoEm: iso(-3), aceitoEm: iso(-2.5),
    motorista: { id: M2, nome: 'Marcos Vinícius Rocha', tipoVeiculo: 'CAMINHAO', placa: 'TRE3Q44' }, veiculo: resumoVeiculo('v6') }),
  freteCliente({ id: 'f17', coleta: vergueiro, entrega: cambui, status: 'PAGO', categoriaVeiculo: 'UTILITARIO', tipoCarga: 'MOVEIS',
    valor: 260, valorTotal: 260, valorAcordado: 260, adiantamentoPercentual: 30, distanciaKm: 90, distanciaEstimada: true,
    descricaoCarga: 'Geladeira duplex', pesoKg: 150, dataColeta: data(-14), nomeDestinatario: 'Paula Andrade', telefoneDestinatario: '19988776655',
    criadoEm: iso(-16), aceitoEm: iso(-15.5), concluidoEm: iso(-14), pagoEm: iso(-13),
    motorista: { id: M3, nome: 'Ana Paula Siqueira', tipoVeiculo: 'VAN', placa: 'MUD5A12' }, veiculo: resumoVeiculo('v5') }),
  freteCliente({ id: 'f18', coleta: anhangabau, entrega: cambui, status: 'CANCELADO', categoriaVeiculo: 'CAMINHAO', tipoCarga: 'OBRA',
    valor: 540, valorTotal: 540, distanciaKm: 44, distanciaEstimada: true, descricaoCarga: 'Tijolos e 20 sacos de cimento', pesoKg: 1500,
    dataColeta: data(-8), nomeDestinatario: 'Paula Andrade', telefoneDestinatario: '19988776655', criadoEm: iso(-9),
    concluidoEm: iso(-8.8), motivoCancelamento: 'Vou mudar a data' }),
  // Perto da base e de bitrem: o motorista de exemplo vê o frete apagado, com o motivo.
  frete({ id: 'f19', coleta: campinas, entrega: santos, empresa: empresas[E3], valor: 3400, valorTotal: 3400, distanciaKm: 170,
    descricaoCarga: 'Farelo de soja', especieCarga: 'Granel', tipoCargaAntt: 'GRANEL_SOLIDO', pesoKg: 36000, dataColeta: data(2),
    veiculosAceitos: ['BITREM', 'RODOTREM'], carroceriasAceitas: ['GRANELEIRO'], exigeRastreador: false,
    preco: { coeficientesDeExemplo: true, eixosConsiderados: 7, pisoMinimo: 2980, abaixoDoPiso: false, acimaDaMedia: false, mediaRotaPorKm: null } }),
  // Fretes que o motorista de exemplo já terminou, de outras empresas: enchem a aba Concluídos e o extrato
  // (um pago há poucos dias, um pago no mês passado e um cancelado depois de fechado).
  frete({ id: 'f20', coleta: limeira, entrega: santos, empresa: empresas[E3], valor: 3200, valorTotal: 3200, valorAcordado: 3200, adiantamentoPercentual: 40,
    distanciaKm: 230, status: 'PAGO', descricaoCarga: 'Fardos de algodão', especieCarga: 'Fardos', exigeRastreador: false,
    motorista: { id: M1, nome: 'João Batista Ferreira', tipoVeiculo: 'CAMINHAO', placa: 'ABC1D23' }, veiculo: resumoVeiculo('v1'),
    criadoEm: iso(-9), aceitoEm: iso(-8.5), concluidoEm: iso(-6), pagoEm: iso(-5), dataColeta: data(-7),
    preco: { ...exemplo, pisoMinimo: 2240, abaixoDoPiso: false, acimaDaMedia: false, mediaRotaPorKm: 12.8 } }),
  frete({ id: 'f21', coleta: sorocaba, entrega: curitiba, empresa: empresas[E2], publicadoPorAgenciador: true, valor: 4100, valorTotal: 4100, valorAcordado: 4100,
    adiantamentoPercentual: 30, distanciaKm: 420, status: 'PAGO', descricaoCarga: 'Peças de reposição em caixas', especieCarga: 'Caixas', exigeRastreador: false,
    motorista: { id: M1, nome: 'João Batista Ferreira', tipoVeiculo: 'CAMINHAO', placa: 'ABC1D23' }, veiculo: resumoVeiculo('v1'),
    criadoEm: iso(-45), aceitoEm: iso(-44), concluidoEm: iso(-41), pagoEm: iso(-40), dataColeta: data(-42),
    preco: { ...exemplo, pisoMinimo: 3890, abaixoDoPiso: false, acimaDaMedia: false, mediaRotaPorKm: 9.9 } }),
  frete({ id: 'f22', coleta: jundiai, entrega: bh, empresa: empresas[E2], publicadoPorAgenciador: true, valor: 6800, valorTotal: 6800, valorAcordado: 6800,
    adiantamentoPercentual: 30, distanciaKm: 580, status: 'CANCELADO', descricaoCarga: 'Bobinas de aço', especieCarga: 'Bobinas', exigeRastreador: false,
    motorista: { id: M1, nome: 'João Batista Ferreira', tipoVeiculo: 'CAMINHAO', placa: 'ABC1D23' }, veiculo: resumoVeiculo('v1'),
    criadoEm: iso(-20), aceitoEm: iso(-19), concluidoEm: iso(-18), dataColeta: data(-17), motivoCancelamento: 'A carga não ficou pronta na data',
    preco: { ...exemplo, pisoMinimo: 5310, abaixoDoPiso: false, acimaDaMedia: false, mediaRotaPorKm: 11.6 } }),
]

/** Distância da base do motorista demo (Campinas) até a coleta de cada frete aberto. */
const distanciaDaBase: Record<string, number> = { f1: 6, f3: 1290, f4: 46, f5: 22, f10: 38, f12: 4, f15: 12, f19: 18 }

const propostas: Proposta[] = [
  proposta('p1', 'f1', M1, 'v1', 4850, 40, -0.5),
  proposta('p2', 'f1', M2, 'v3', 4600, 30, -0.3, 'Posso carregar amanhã cedo.'),
  proposta('p3', 'f1', M3, 'v4', 4390, 50, -0.1),
  { ...proposta('p4', 'f2', M1, 'v1', 5100, 40, -2.2), status: 'ACEITA', respondidaEm: iso(-2) },
  { ...proposta('p5', 'f6', M1, 'v1', 2900, 50, -0.4), status: 'ACEITA', respondidaEm: iso(-0.2) },
  { ...proposta('p6', 'f8', M1, 'v1', 2300, 40, -2.6), status: 'ACEITA', respondidaEm: iso(-2.5) },
  proposta('p7', 'f12', M3, 'v5', 850, 30, -0.4, 'Levo um ajudante para carregar. A geladeira vai em pé.'),
  proposta('p8', 'f12', M2, 'v6', 980, 0, -0.2),
  { ...proposta('p9', 'f13', M2, 'v6', 750, 30, -1.5), status: 'ACEITA', respondidaEm: iso(-0.1) },
  { ...proposta('p10', 'f14', M3, 'v5', 380, 30, -4.8), status: 'ACEITA', respondidaEm: iso(-4.5) },
  { ...proposta('p11', 'f20', M1, 'v1', 3200, 40, -8.8), status: 'ACEITA', respondidaEm: iso(-8.5) },
  { ...proposta('p12', 'f21', M1, 'v1', 4100, 30, -44.5), status: 'ACEITA', respondidaEm: iso(-44) },
  { ...proposta('p13', 'f22', M1, 'v1', 6800, 30, -19.5), status: 'ACEITA', respondidaEm: iso(-19) },
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
  // Datas na ordem do fluxo: Pix depois do aceite, adiantamento na saída, saldo depois da entrega.
  { ...pagamento('f6', 2900, 50, 'RETIDO'), pagoEm: iso(-0.1) },
  { ...pagamento('f7', 5450, 30, 'LIBERADO'), pagoEm: iso(-11), adiantamentoLiberadoEm: iso(-10) },
  { ...pagamento('f8', 2300, 40, 'ADIANTAMENTO_LIBERADO'), saldoLiberavelApos: iso(0.8) },
  { ...pagamento('f11', 3100, 30, 'ADIANTAMENTO_LIBERADO'), pagoEm: iso(-3.4), adiantamentoLiberadoEm: iso(-3), saldoLiberavelApos: iso(-0.2), saldoBloqueado: true },
  { ...pagamento('f14', 380, 30, 'ADIANTAMENTO_LIBERADO'), pagoEm: iso(-4.4), adiantamentoLiberadoEm: iso(-1), saldoLiberavelApos: iso(0.7) },
  { ...pagamento('f16', 680, 30, 'ADIANTAMENTO_LIBERADO'), pagoEm: iso(-2.4), adiantamentoLiberadoEm: iso(-0.1) },
  { ...pagamento('f17', 260, 30, 'LIBERADO'), pagoEm: iso(-15.4), adiantamentoLiberadoEm: iso(-14.5), saldoLiberadoEm: iso(-13) },
  { ...pagamento('f20', 3200, 40, 'LIBERADO'), pagoEm: iso(-8.4), adiantamentoLiberadoEm: iso(-7), saldoLiberadoEm: iso(-5) },
  { ...pagamento('f21', 4100, 30, 'LIBERADO'), pagoEm: iso(-43.9), adiantamentoLiberadoEm: iso(-42), saldoLiberadoEm: iso(-40) },
  // Cancelado antes da saída: o Pix voltou para a empresa e nada foi para o motorista.
  { ...pagamento('f22', 6800, 30, 'ESTORNADO'), pagoEm: iso(-18.8), estornadoEm: iso(-18) },
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
  f12: [ev(null, 'PUBLICADO', 'CLIENTE', -0.6), ev('PUBLICADO', 'PROPOSTA_ENVIADA', 'MOTORISTA', -0.4)],
  f13: [ev(null, 'PUBLICADO', 'CLIENTE', -2), ev('PUBLICADO', 'PROPOSTA_ENVIADA', 'MOTORISTA', -1.5), ev('PROPOSTA_ENVIADA', 'ACEITO', 'CLIENTE', -0.1)],
  f14: [ev(null, 'PUBLICADO', 'CLIENTE', -5), ev('PUBLICADO', 'PROPOSTA_ENVIADA', 'MOTORISTA', -4.8), ev('PROPOSTA_ENVIADA', 'ACEITO', 'CLIENTE', -4.5),
    ev('ACEITO', 'EM_TRANSITO', 'MOTORISTA', -1), ev('EM_TRANSITO', 'ENTREGUE', 'MOTORISTA', -0.3, 'Canhoto digital: recebido por Lúcia Andrade.')],
  f15: [ev(null, 'PUBLICADO', 'CLIENTE', -0.05)],
  f16: [ev(null, 'PUBLICADO', 'CLIENTE', -3), ev('PUBLICADO', 'ACEITO', 'MOTORISTA', -2.5), ev('ACEITO', 'EM_TRANSITO', 'MOTORISTA', -0.1, 'Saída da coleta às 8h.')],
  f17: [ev(null, 'PUBLICADO', 'CLIENTE', -16), ev('PUBLICADO', 'ACEITO', 'MOTORISTA', -15.5), ev('ACEITO', 'EM_TRANSITO', 'MOTORISTA', -14.2),
    ev('EM_TRANSITO', 'ENTREGUE', 'MOTORISTA', -14, 'Canhoto digital: recebido por Paula Andrade.'), ev('ENTREGUE', 'PAGO', null, -13)],
  f18: [ev(null, 'PUBLICADO', 'CLIENTE', -9), ev('PUBLICADO', 'CANCELADO', 'CLIENTE', -8.8, 'Vou mudar a data')],
  f19: [ev(null, 'PUBLICADO', 'EMPRESA', -0.4)],
  f20: [ev(null, 'PUBLICADO', 'EMPRESA', -9), ev('PUBLICADO', 'PROPOSTA_ENVIADA', 'MOTORISTA', -8.8), ev('PROPOSTA_ENVIADA', 'ACEITO', 'EMPRESA', -8.5),
    ev('ACEITO', 'EM_TRANSITO', 'MOTORISTA', -7), ev('EM_TRANSITO', 'ENTREGUE', 'MOTORISTA', -6, 'Canhoto digital: recebido por Sérgio Nunes.'), ev('ENTREGUE', 'PAGO', null, -5)],
  f21: [ev(null, 'PUBLICADO', 'EMPRESA', -45), ev('PUBLICADO', 'PROPOSTA_ENVIADA', 'MOTORISTA', -44.5), ev('PROPOSTA_ENVIADA', 'ACEITO', 'EMPRESA', -44),
    ev('ACEITO', 'EM_TRANSITO', 'MOTORISTA', -42), ev('EM_TRANSITO', 'ENTREGUE', 'MOTORISTA', -41, 'Canhoto digital: recebido por Débora Lins.'), ev('ENTREGUE', 'PAGO', null, -40)],
  f22: [ev(null, 'PUBLICADO', 'EMPRESA', -20), ev('PUBLICADO', 'PROPOSTA_ENVIADA', 'MOTORISTA', -19.5), ev('PROPOSTA_ENVIADA', 'ACEITO', 'EMPRESA', -19),
    ev('ACEITO', 'CANCELADO', 'EMPRESA', -18, 'A carga não ficou pronta na data')],
  f8: [ev(null, 'PUBLICADO', 'EMPRESA', -3), ev('PUBLICADO', 'PROPOSTA_ENVIADA', 'MOTORISTA', -2.6), ev('PROPOSTA_ENVIADA', 'ACEITO', 'EMPRESA', -2.5),
    ev('ACEITO', 'EM_TRANSITO', 'MOTORISTA', -1), ev('EM_TRANSITO', 'ENTREGUE', 'MOTORISTA', -0.2, 'Canhoto digital: recebido por Carlos Mendes.')],
}
function ev(de: StatusFrete | null, para: StatusFrete, papel: EventoFrete['autorPapel'], quando: number, observacao: string | null = null): EventoFrete {
  return { de, para, autorId: null, autorPapel: papel, observacao, ocorridoEm: iso(quando) }
}

// ---------- canhoto ----------

/** Imagens de exemplo desenhadas aqui mesmo, para a empresa ver como o canhoto aparece. */
const svg = (corpo: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">${corpo}</svg>`)}`
const FOTO_EXEMPLO = svg('<rect width="400" height="300" fill="#C9C4B8"/><rect x="60" y="90" width="280" height="150" fill="#9C8F78"/><text x="200" y="60" font-family="sans-serif" font-size="22" text-anchor="middle" fill="#2A2F38">Foto da entrega (exemplo)</text>')
const ASSINATURA_EXEMPLO = svg('<rect width="400" height="300" fill="#fff"/><path d="M40 190 C80 120 110 230 150 160 S210 120 230 190 S300 150 360 170" fill="none" stroke="#1C1F24" stroke-width="5" stroke-linecap="round"/>')

/** Fotos que o cliente mandou com o pedido; o motorista vê antes de aceitar. */
const fotoCarga = (texto: string) => svg(`<rect width="400" height="300" fill="#D8D2C4"/><rect x="70" y="80" width="120" height="150" fill="#A89B82"/><rect x="210" y="120" width="120" height="110" fill="#8E826B"/><text x="200" y="50" font-family="sans-serif" font-size="20" text-anchor="middle" fill="#2A2F38">${texto}</text>`)
const fotosCarga: Record<string, FotoCarga[]> = {
  f12: [{ id: 'fc1', url: fotoCarga('Geladeira e fogão (exemplo)') }, { id: 'fc2', url: fotoCarga('Sofá e caixas (exemplo)') }],
  f15: [{ id: 'fc3', url: fotoCarga('Caixas de livros (exemplo)') }],
}

/** Telefones de quem está nos fretes de exemplo, para o contato depois do aceite. */
const telefones: Record<string, string> = { [M1]: '19998765432', [M2]: '11987654321', [M3]: '19991234567', [U_CLIENTE]: '19988776655' }

/** Como na API: quem não participa do frete vê só bairro, cidade e UF, e não vê quem recebe. */
function publico(f: Frete): Frete {
  const so = (e: Endereco): Endereco => ({ cep: null, logradouro: null, numero: null, complemento: null, bairro: e.bairro, cidade: e.cidade,
    uf: e.uf, pontoReferencia: null, enderecoCompleto: null, latitude: null, longitude: null })
  return { ...f, coleta: so(f.coleta), entrega: so(f.entrega), nomeDestinatario: null, telefoneDestinatario: null }
}
const paraQuem = (f: Frete, token: string) => (token === 'demo-motorista' && f.motorista?.id !== M1 ? publico(f) : f)

/** Na demonstração o Pix confirma sozinho na terceira consulta, como se o banco tivesse respondido. */
const consultasPix: Record<string, number> = {}

/**
 * Esqueci a senha: o link da demonstração usa o token "demo" e troca a senha da última conta que pediu.
 * O e-mail fica no localStorage porque o link abre a página de novo, como o link de um e-mail abriria.
 */
const CHAVE_LINK = 'fretai.demo.emailDoLink'
const emailDoLink = {
  ler: () => localStorage.getItem(CHAVE_LINK),
  gravar: (email: string) => localStorage.setItem(CHAVE_LINK, email),
}

/** Código que o recebedor recebe por mensagem. Na demonstração ele é fixo, e a página pública diz qual é. */
const CODIGO_CONTESTACAO_DEMO = 'ENTREGA8'
const codigos: Record<string, string> = { [CODIGO_CONTESTACAO_DEMO]: 'f8' }
const canhotos: Record<string, Canhoto> = {
  f8: {
    id: 'c-f8', freteId: 'f8', nomeRecebedor: 'Carlos Mendes', latitude: santos.latitude! + 0.001, longitude: santos.longitude!,
    distanciaDestinoKm: 0.11, localConferido: true, registradoEm: iso(-0.2), contestacaoAte: iso(0.8), contestado: false,
    motivoContestacao: null, resolucao: null, fotoUrl: FOTO_EXEMPLO, assinaturaUrl: ASSINATURA_EXEMPLO,
  },
  f11: {
    id: 'c-f11', freteId: 'f11', nomeRecebedor: 'Paulo Henrique Dias', latitude: joinville.latitude! + 0.0005, longitude: joinville.longitude!,
    distanciaDestinoKm: 0.06, localConferido: true, registradoEm: iso(-1.2), contestacaoAte: iso(-0.2), contestado: true,
    motivoContestacao: 'Duas caixas chegaram amassadas e a quantidade não bate com a nota.', resolucao: null,
    fotoUrl: FOTO_EXEMPLO, assinaturaUrl: ASSINATURA_EXEMPLO,
  },
  f14: {
    id: 'c-f14', freteId: 'f14', nomeRecebedor: 'Lúcia Andrade', latitude: anhangabau.latitude! + 0.0004, longitude: anhangabau.longitude!,
    distanciaDestinoKm: 0.04, localConferido: true, registradoEm: iso(-0.3), contestacaoAte: iso(0.7), contestado: false,
    motivoContestacao: null, resolucao: null, fotoUrl: FOTO_EXEMPLO, assinaturaUrl: ASSINATURA_EXEMPLO,
  },
}

function contestar(c: Canhoto, motivo: string): Response | null {
  if (new Date(c.contestacaoAte).getTime() < Date.now()) return problema(422, 'Fora do prazo', 'O prazo para contestar esta entrega terminou.')
  if (c.contestado) return problema(422, 'Já contestada', 'Esta entrega já foi contestada.')
  if (!motivo.trim()) return json({ title: 'Dados inválidos', detail: 'Conte o que houve com a entrega.', status: 400, erros: { motivo: 'Conte o que houve com a entrega.' } }, 400)
  Object.assign(c, { contestado: true, motivoContestacao: motivo.trim() })
  const pg = pagamentos.find((x) => x.freteId === c.freteId)
  if (pg) pg.saldoBloqueado = true
  return null
}

// ---------- avaliações ----------

const avaliacoes: Avaliacao[] = [
  { id: 'av1', freteId: 'f17', lado: 'CONTRATANTE', avaliadoTipo: 'MOTORISTA', avaliadoId: M3, nota: 5, comentario: null, criadaEm: iso(-13) },
]

// ---------- perfil do motorista ----------

const motoristaDemo: Motorista = {
  id: M1, nome: 'João Batista Ferreira', email: 'motorista@demo.fretai', telefone: '(19) 99876-5432', tipoVeiculo: 'CAMINHAO',
  placa: 'ABC1D23', aceitaFeriado: true, temChavePix: true, criadoEm: '2025-06-01T12:00:00Z',
}
/** O cadastro do cliente de exemplo, que a tela "Meus dados" lê e corrige. O telefone vem só com dígitos, como na API. */
const clienteDemo: Cliente = {
  id: U_CLIENTE, nome: clientes[U_CLIENTE].nome, email: 'cliente@demo.fretai', telefone: telefones[U_CLIENTE], criadoEm: '2026-04-12T12:00:00Z',
}
const TELEFONE = /^(\+?55)?\s?\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/
const PLACA = /^[A-Za-z]{3}-?\d[A-Za-z0-9]\d{2}$/
/** As regras de VeiculoRequest: tipo obrigatório, modelo até 60, dados de caminhão conferidos só quando vêm. */
function dadosDoVeiculo(b: Record<string, unknown>, erros: Record<string, string>) {
  const categoria = String(b.categoria ?? '')
  if (!['UTILITARIO', 'VAN', 'CAMINHAO'].includes(categoria)) erros.categoria = 'Escolha o tipo do veículo.'
  const modelo = String(b.modelo ?? '').trim()
  if (modelo.length > 60) erros.modelo = 'O modelo deve ter até 60 caracteres.'
  const rntrc = b.rntrc == null || String(b.rntrc).trim() === '' ? null : String(b.rntrc)
  if (rntrc != null && !/^\d{8,9}$/.test(rntrc)) erros.rntrc = 'RNTRC inválido. Deve ter 8 ou 9 dígitos.'
  const eixos = b.numeroEixos == null || b.numeroEixos === '' ? null : Number(b.numeroEixos)
  if (eixos != null && !(eixos >= 2 && eixos <= 9)) erros.numeroEixos = 'O veículo deve ter de 2 a 9 eixos.'
  return {
    categoria: categoria as Veiculo['categoria'], modelo: modelo || null, rntrc, tipo: (b.tipo as string | null) || null,
    carroceria: (b.carroceria as string | null) || null, numeroEixos: eixos, rastreador: Boolean(b.rastreador),
  }
}
const invalido = (erros: Record<string, string>) => json({ title: 'Dados inválidos', detail: 'Confira os campos marcados.', status: 400, erros }, 400)

/** A mesma conta da API (precificacao): diesel pelo consumo, mais pedágio e outros; piso com o coeficiente de exemplo. */
function calcular(b: Record<string, unknown>) {
  const km = Number(b.distanciaKm)
  const consumo = Number(b.consumoKmPorLitro)
  const diesel = Number(b.precoDieselLitro)
  const erros: Record<string, string> = {}
  if (!(km > 0)) erros.distanciaKm = 'A distância deve ser maior que zero.'
  if (!(consumo > 0)) erros.consumoKmPorLitro = 'O consumo deve ser maior que zero.'
  if (!(diesel > 0)) erros.precoDieselLitro = 'O preço do diesel deve ser maior que zero.'
  if (Object.keys(erros).length) return { erros }
  const litros = Math.round((km / consumo) * 100) / 100
  const combustivel = Math.round(litros * diesel * 100) / 100
  const pedagio = Number(b.pedagio ?? 0)
  const outros = Number(b.outrosCustos ?? 0)
  const total = Math.round((combustivel + pedagio + outros) * 100) / 100
  const eixos = b.numeroEixos == null ? null : Number(b.numeroEixos)
  const piso = b.tipoCargaAntt && eixos
    ? { valor: Math.round(km * (1.2 + eixos * 1.05) + 480), tipoCarga: String(b.tipoCargaAntt), numeroEixos: eixos, distanciaKm: km, fonte: 'Exemplo', coeficientesDeExemplo: true }
    : null
  const oferecido = b.valorOferecido == null ? null : Number(b.valorOferecido)
  return {
    resultado: {
      custo: { distanciaKm: km, litros, combustivel, pedagio, outros, total }, piso, valorOferecido: oferecido,
      margem: oferecido == null ? null : Math.round((oferecido - total) * 100) / 100, abaixoDoPiso: piso != null && oferecido != null && oferecido < piso.valor,
    },
  }
}

// ---------- documentos ----------

// Platform fact: aba nova não navega para endereço data:, então o exemplo vira blob:, como o arquivo enviado.
// O arquivo de exemplo é SVG, mas os metadados dizem PNG: a API só aceita PDF, PNG e JPEG.
const DOC_EXEMPLO = (titulo: string) => URL.createObjectURL(new Blob([`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#F2F0EA"/><rect x="20" y="20" width="360" height="260" fill="none" stroke="#5B6270" stroke-width="3"/><text x="200" y="150" font-family="sans-serif" font-size="26" text-anchor="middle" fill="#1C1F24">${titulo} (exemplo)</text></svg>`], { type: 'image/svg+xml' }))
/** Os sete primeiros nasceram sem recusa; d8 foi recusado, para o motorista ver como a recusa chega. */
const semRecusa = { recusadoEm: null, motivoRecusa: null }
const documentos: (Documento & { url: string })[] = [
  { id: 'd1', motoristaId: M1, freteId: 'f1', tipo: 'CNH', contentType: 'image/png', tamanhoBytes: 48_000, verificado: true, verificadoEm: iso(-200), ...semRecusa, criadoEm: iso(-0.5), url: DOC_EXEMPLO('CNH') },
  { id: 'd2', motoristaId: M1, freteId: 'f1', tipo: 'CRLV', contentType: 'image/png', tamanhoBytes: 52_000, verificado: true, verificadoEm: iso(-200), ...semRecusa, criadoEm: iso(-0.5), url: DOC_EXEMPLO('CRLV') },
  { id: 'd3', motoristaId: M2, freteId: 'f1', tipo: 'CNH', contentType: 'image/png', tamanhoBytes: 45_000, verificado: true, verificadoEm: iso(-90), ...semRecusa, criadoEm: iso(-0.3), url: DOC_EXEMPLO('CNH') },
  { id: 'd4', motoristaId: M1, freteId: 'f8', tipo: 'CNH', contentType: 'image/png', tamanhoBytes: 48_000, verificado: true, verificadoEm: iso(-200), ...semRecusa, criadoEm: iso(-2.6), url: DOC_EXEMPLO('CNH') },
  { id: 'd5', motoristaId: M1, freteId: 'f8', tipo: 'CRLV', contentType: 'image/png', tamanhoBytes: 52_000, verificado: true, verificadoEm: iso(-200), ...semRecusa, criadoEm: iso(-2.6), url: DOC_EXEMPLO('CRLV') },
  { id: 'd6', motoristaId: M3, freteId: 'f1', tipo: 'CRLV', contentType: 'image/png', tamanhoBytes: 61_000, verificado: false, verificadoEm: null, ...semRecusa, criadoEm: iso(-0.1), url: DOC_EXEMPLO('CRLV') },
  { id: 'd7', motoristaId: M1, freteId: 'f2', tipo: 'COMPROVANTE', contentType: 'image/png', tamanhoBytes: 233_000, verificado: false, verificadoEm: null, ...semRecusa, criadoEm: iso(-1.8), url: DOC_EXEMPLO('Comprovante de residência') },
  { id: 'd8', motoristaId: M1, freteId: 'f6', tipo: 'CRLV', contentType: 'image/jpeg', tamanhoBytes: 38_000, verificado: false, verificadoEm: null,
    recusadoEm: iso(-0.05), motivoRecusa: 'A foto cortou a placa e o ano do licenciamento. Mande o documento inteiro.', criadoEm: iso(-0.15), url: DOC_EXEMPLO('CRLV') },
]
/** A regra da API (Documento.podeSerVistoPor): admin vê tudo, o motorista vê os dele, quem contratou só os do motorista aceito. */
const CONTRATANTE_VE: StatusFrete[] = ['ACEITO', 'EM_TRANSITO', 'ENTREGUE', 'PAGO']
/** O frete é de quem tem este token? A empresa demo é a E1; a cliente demo, a U_CLIENTE. */
const contratou = (f: Frete, token: string | undefined) =>
  token === 'demo-empresa' ? f.empresa?.id === E1 : token === 'demo-cliente' ? f.cliente?.id === U_CLIENTE : false
function podeVer(doc: Documento, token: string | undefined) {
  if (token === 'demo-admin') return true
  if (token === 'demo-motorista') return doc.motoristaId === M1
  const f = fretes.find((x) => x.id === doc.freteId)
  return f != null && contratou(f, token) && f.motorista?.id === doc.motoristaId && CONTRATANTE_VE.includes(f.status) && !doc.recusadoEm
}
const acessos: Record<string, AcessoDocumento[]> = {
  // A empresa abriu a CNH do frete aceito (f8): no f1 ela ainda não pode ver nada.
  d4: [{ usuarioId: U_EMPRESA, papel: 'EMPRESA', origem: '187.45.10.2', acessadoEm: iso(-2.4) }],
}
const semUrl = ({ url: _url, ...doc }: Documento & { url: string }): Documento => doc

// ---------- dados da empresa ----------

const dadosEmpresa: Record<string, Empresa> = {
  [E1]: { id: E1, cnpj: '11222333000181', razaoSocial: empresas[E1].razaoSocial, nomeFantasia: empresas[E1].nomeFantasia,
    tipo: 'EMBARCADOR', telefone: '1932104400', ativa: true, criadoEm: '2025-03-11T12:00:00Z' },
}

// ---------- publicar frete ----------

/** Feriados nacionais de data fixa (a API consulta a BrasilAPI; aqui basta para a demonstração). */
const FERIADOS: Record<string, string> = {
  '01-01': 'Confraternização Universal', '04-21': 'Tiradentes', '05-01': 'Dia do Trabalho', '09-07': 'Independência do Brasil',
  '10-12': 'Nossa Senhora Aparecida', '11-02': 'Finados', '11-15': 'Proclamação da República', '11-20': 'Dia da Consciência Negra',
  '12-25': 'Natal',
}
function verificarData(dataIso: string) {
  const d = new Date(`${dataIso}T12:00:00`)
  const nomeFeriado = FERIADOS[dataIso.slice(5)] ?? null
  const domingo = d.getDay() === 0
  return { data: dataIso, feriado: nomeFeriado != null, nomeFeriado, domingo, diaUtil: !nomeFeriado && !domingo && d.getDay() !== 6 }
}

/** A API resolve o CEP num serviço de endereço; a demonstração usa a região pelo começo do CEP. */
const REGIOES: [RegExp, string, string, number, number][] = [
  [/^0/, 'São Paulo', 'SP', -23.55, -46.63], [/^11/, 'Santos', 'SP', -23.95, -46.33], [/^12/, 'São José dos Campos', 'SP', -23.2, -45.88],
  [/^13/, 'Campinas', 'SP', -22.9, -47.06], [/^1/, 'Sorocaba', 'SP', -23.5, -47.46], [/^2[0-8]/, 'Rio de Janeiro', 'RJ', -22.9, -43.2],
  [/^29/, 'Vitória', 'ES', -20.32, -40.34], [/^3/, 'Belo Horizonte', 'MG', -19.92, -43.94], [/^4/, 'Salvador', 'BA', -12.97, -38.5],
  [/^5/, 'Recife', 'PE', -8.05, -34.9], [/^6/, 'Fortaleza', 'CE', -3.73, -38.52], [/^7[0-3]/, 'Brasília', 'DF', -15.79, -47.88],
  [/^7/, 'Goiânia', 'GO', -16.68, -49.25], [/^8[0-7]/, 'Curitiba', 'PR', -25.43, -49.27], [/^8/, 'Florianópolis', 'SC', -27.6, -48.55],
  [/^9/, 'Porto Alegre', 'RS', -30.03, -51.23],
]
function enderecoDoCep(pedido: Record<string, unknown>): Endereco {
  const cep = String(pedido.cep ?? '')
  const [, cidade, uf, lat, lng] = REGIOES.find(([r]) => r.test(cep)) ?? REGIOES[0]
  const numero = (pedido.numero as string | null) ?? null
  return {
    cep, logradouro: null, numero, complemento: (pedido.complemento as string | null) ?? null, bairro: null, cidade, uf,
    pontoReferencia: (pedido.pontoReferencia as string | null) ?? null,
    enderecoCompleto: `CEP ${cep}${numero ? `, ${numero}` : ''} - ${cidade}/${uf}`, latitude: lat, longitude: lng,
  }
}
function errosDaPublicacao(b: Record<string, unknown>) {
  const erros: Record<string, string> = {}
  const cep = (x: unknown) => /^\d{5}-?\d{3}$/.test(String((x as Record<string, unknown> | undefined)?.cep ?? ''))
  if (!cep(b.coleta)) erros['coleta.cep'] = 'CEP inválido. Use 00000-000 ou 00000000.'
  if (!cep(b.entrega)) erros['entrega.cep'] = 'CEP inválido. Use 00000-000 ou 00000000.'
  if (!b.dataColeta) erros.dataColeta = 'A data da coleta é obrigatória.'
  else if (String(b.dataColeta) < data(0)) erros.dataColeta = 'A data da coleta não pode estar no passado.'
  if (!String(b.descricaoCarga ?? '').trim()) erros.descricaoCarga = 'A descrição da carga é obrigatória.'
  if (!String(b.especieCarga ?? '').trim()) erros.especieCarga = 'A espécie da carga é obrigatória.'
  if (!(Number(b.pesoKg) > 0)) erros.pesoKg = 'O peso deve ser maior que zero.'
  else if (Number(b.pesoKg) > 74000) erros.pesoKg = 'Peso acima do maior peso bruto total permitido (74 t).'
  if (b.valorACombinar !== (b.valor == null)) erros.valorCoerente = 'Informe o valor ou marque como "a combinar" (um dos dois, nunca ambos).'
  return erros
}
const EIXOS: Record<string, number> = { RODOTREM: 9, BITREM: 7, CARRETA_LS: 6, VANDERLEIA: 6, CARRETA: 5, BITRUCK: 4, TRUCK: 3, TOCO: 2, VUC: 2, TRES_QUARTOS: 2 }
/**
 * Os campos do frete que saem do pedido de publicar ou editar, com distância e piso recalculados.
 * Na edição, CEP igual ao de antes mantém o endereço (a região pelo prefixo do CEP é grosseira e
 * trocaria Limeira por Campinas), e rota e caminhões iguais mantêm distância e piso, como na API.
 */
function montarFrete(b: Record<string, unknown>, anterior?: Frete) {
  const ponta = (pedido: Record<string, unknown>, antes: Endereco | undefined): Endereco =>
    antes && antes.cep === pedido.cep
      ? { ...antes, numero: (pedido.numero as string | null) ?? null, complemento: (pedido.complemento as string | null) ?? null,
          pontoReferencia: (pedido.pontoReferencia as string | null) ?? null }
      : enderecoDoCep(pedido)
  const coleta = ponta(b.coleta as Record<string, unknown>, anterior?.coleta)
  const entrega = ponta(b.entrega as Record<string, unknown>, anterior?.entrega)
  const mesmaRota = anterior != null && coleta.cep === anterior.coleta.cep && entrega.cep === anterior.entrega.cep
  const reta = Math.hypot((coleta.latitude! - entrega.latitude!) * 111, (coleta.longitude! - entrega.longitude!) * 102)
  const distanciaKm = mesmaRota && anterior.distanciaKm != null ? anterior.distanciaKm : Math.max(30, Math.round(reta * 1.25))
  const tipos = (b.veiculosAceitos as string[] | undefined) ?? []
  const eixos = tipos.length ? Math.max(...tipos.map((t) => EIXOS[t] ?? 5)) : 5
  const mesmosCaminhoes = anterior != null && [...tipos].sort().join() === [...anterior.veiculosAceitos].sort().join()
  const pisoMinimo = mesmaRota && mesmosCaminhoes && anterior.preco?.pisoMinimo != null
    ? anterior.preco.pisoMinimo : Math.round(distanciaKm * (1.2 + eixos * 1.05) + 480)
  const valor = b.valorACombinar ? null : Number(b.valor)
  const dia = verificarData(String(b.dataColeta))
  return {
    coleta, entrega, dataColeta: String(b.dataColeta),
    descricaoCarga: String(b.descricaoCarga), especieCarga: String(b.especieCarga), tipoCargaAntt: String(b.tipoCargaAntt), pesoKg: Number(b.pesoKg),
    valor, valorTotal: valor, valorACombinar: Boolean(b.valorACombinar), veiculosAceitos: tipos,
    carroceriasAceitas: (b.carroceriasAceitas as string[] | undefined) ?? [], exigeRastreador: Boolean(b.exigeRastreador), complemento: Boolean(b.complemento),
    feriado: dia.feriado, nomeFeriado: dia.nomeFeriado, domingo: dia.domingo, distanciaKm, distanciaEstimada: mesmaRota ? anterior.distanciaEstimada : true,
    preco: { coeficientesDeExemplo: true, eixosConsiderados: eixos, pisoMinimo, abaixoDoPiso: valor != null && valor < pisoMinimo, acimaDaMedia: false, mediaRotaPorKm: null },
  } satisfies Partial<Frete>
}
function publicar(b: Record<string, unknown>): Frete {
  const novo = frete({ id: `f${fretes.length + 1}`, status: 'PUBLICADO', criadoEm: iso(0), ...montarFrete(b) })
  fretes.push(novo)
  eventos[novo.id] = [ev(null, 'PUBLICADO', 'EMPRESA', 0)]
  return novo
}

// ---------- pedir frete (cliente pessoa física) ----------

/** As mesmas mensagens de SolicitarFreteRequest. */
function errosDoPedido(b: Record<string, unknown>) {
  const erros: Record<string, string> = {}
  const cep = (x: unknown) => /^\d{5}-?\d{3}$/.test(String((x as Record<string, unknown> | undefined)?.cep ?? ''))
  if (!cep(b.coleta)) erros['coleta.cep'] = 'CEP inválido. Use 00000-000 ou 00000000.'
  if (!cep(b.entrega)) erros['entrega.cep'] = 'CEP inválido. Use 00000-000 ou 00000000.'
  if (!String(b.nomeDestinatario ?? '').trim()) erros.nomeDestinatario = 'O nome do destinatário é obrigatório.'
  if (!String(b.telefoneDestinatario ?? '').trim()) erros.telefoneDestinatario = 'O telefone do destinatário é obrigatório.'
  if (!String(b.descricaoCarga ?? '').trim()) erros.descricaoCarga = 'A descrição da carga é obrigatória.'
  if (!(Number(b.pesoKg) > 0)) erros.pesoKg = 'O peso deve ser maior que zero.'
  else if (Number(b.pesoKg) > 50000) erros.pesoKg = 'Peso acima do limite da plataforma (50 t).'
  if (!(Number(b.valor) > 0)) erros.valor = 'O valor deve ser maior que zero.'
  if (!b.dataColeta) erros.dataColeta = 'A data da coleta é obrigatória.'
  else if (String(b.dataColeta) < data(0)) erros.dataColeta = 'A data da coleta não pode estar no passado.'
  if (!['UTILITARIO', 'VAN', 'CAMINHAO'].includes(String(b.categoriaVeiculo))) erros.categoriaVeiculo = 'Escolha o tamanho do veículo.'
  if (!['MUDANCA', 'MOVEIS', 'CAIXAS', 'OBRA', 'OUTRO'].includes(String(b.tipoCarga))) erros.tipoCarga = 'Escolha o que vai levar.'
  return erros
}
/** Feriado na coleta soma 20% ao valor, o adicional-feriado-percentual da API. */
function pedir(b: Record<string, unknown>): Frete {
  const coleta = enderecoDoCep(b.coleta as Record<string, unknown>)
  const entrega = enderecoDoCep(b.entrega as Record<string, unknown>)
  const reta = Math.hypot((coleta.latitude! - entrega.latitude!) * 111, (coleta.longitude! - entrega.longitude!) * 102)
  const valor = Number(b.valor)
  const dia = verificarData(String(b.dataColeta))
  const adicionalFeriado = dia.feriado ? Math.round(valor * 20) / 100 : null
  const novo = freteCliente({
    id: `f${fretes.length + 1}`, status: 'PUBLICADO', criadoEm: iso(0), coleta, entrega, dataColeta: String(b.dataColeta),
    nomeDestinatario: String(b.nomeDestinatario).trim(), telefoneDestinatario: String(b.telefoneDestinatario).trim(),
    descricaoCarga: String(b.descricaoCarga).trim(), pesoKg: Number(b.pesoKg), valor, adicionalFeriado,
    categoriaVeiculo: b.categoriaVeiculo as Frete['categoriaVeiculo'], tipoCarga: b.tipoCarga as Frete['tipoCarga'],
    valorTotal: valor + (adicionalFeriado ?? 0), feriado: dia.feriado, nomeFeriado: dia.nomeFeriado, domingo: dia.domingo,
    distanciaKm: Math.max(5, Math.round(reta * 1.25)), distanciaEstimada: true,
  })
  fretes.push(novo)
  eventos[novo.id] = [ev(null, 'PUBLICADO', 'CLIENTE', 0)]
  return novo
}

// ---------- contas (login e cadastro) ----------

/**
 * Contas da demonstração. O cadastro acrescenta aqui; toda conta nova vê os dados do motorista ou da
 * empresa de exemplo. As novas ficam no localStorage para sobreviver a um F5 (o resto do demo não precisa).
 */
type ContaDemo = { senha: string | null; papel: 'MOTORISTA' | 'EMPRESA' | 'CLIENTE' | 'ADMIN' }
const CHAVE_CONTAS = 'fretai.demo.contas'
const contas: Record<string, ContaDemo> = {
  'motorista@demo.fretai': { senha: 'demo123', papel: 'MOTORISTA' },
  'empresa@demo.fretai': { senha: 'demo123', papel: 'EMPRESA' },
  'cliente@demo.fretai': { senha: 'demo123', papel: 'CLIENTE' },
  'admin@demo.fretai': { senha: 'demo123', papel: 'ADMIN' },
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

function tokensDe(papel: ContaDemo['papel']): Tokens {
  const usuario = { MOTORISTA: M1, EMPRESA: U_EMPRESA, CLIENTE: U_CLIENTE, ADMIN: U_ADMIN }[papel]
  return {
    accessToken: `demo-${papel.toLowerCase()}`, refreshToken: 'demo-refresh', tokenType: 'Bearer',
    expiresIn: 900, usuarioId: usuario, papel, empresaId: papel === 'EMPRESA' ? E1 : null,
  }
}
const soAdmin = (token: string | undefined) =>
  token === 'demo-admin' ? null : problema(403, 'Acesso negado', 'Só o administrador do Fretaí faz isso.')

// ---------- piso ANTT ----------

/** Os mesmos valores de exemplo da migração V8 (ccd = 1 + 0,5 × eixos; cc = 100 + 50 × eixos), para cada carga e eixo. */
const coeficientes: Coeficiente[] = ['CARGA_GERAL', 'GRANEL_SOLIDO', 'GRANEL_LIQUIDO', 'FRIGORIFICADA', 'CONTEINERIZADA', 'NEOGRANEL',
  'GRANEL_PRESSURIZADA', 'PERIGOSA_CARGA_GERAL', 'PERIGOSA_GRANEL_SOLIDO', 'PERIGOSA_GRANEL_LIQUIDO', 'PERIGOSA_FRIGORIFICADA',
  'PERIGOSA_CONTEINERIZADA'].flatMap((tipoCarga) => [2, 3, 4, 5, 6, 7, 9].map((numeroEixos) => ({
  tipoCarga, numeroEixos, ccd: 1 + numeroEixos * 0.5, cc: 100 + numeroEixos * 50, fonte: 'EXEMPLO', exemplo: true, atualizadoEm: iso(-30),
})))

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
  if (metodo === 'POST' && (p === '/api/motoristas' || p === '/api/empresas' || p === '/api/clientes')) {
    const papel = p === '/api/motoristas' ? 'MOTORISTA' : p === '/api/clientes' ? 'CLIENTE' : 'EMPRESA'
    const pessoa = (papel === 'EMPRESA' ? b.responsavel ?? {} : b) as Record<string, unknown>
    const google = pessoa.credencialGoogle === CREDENCIAL_GOOGLE_DEMO
    const email = google ? GOOGLE_DEMO.email : String(pessoa.email ?? '').toLowerCase()
    if (contas[email]) return problema(409, 'Conflito', 'Já existe uma conta com esse e-mail.')
    guardarConta(email, { senha: google ? null : String(pessoa.senha ?? ''), papel })
    return json({ id: { MOTORISTA: M1, CLIENTE: U_CLIENTE, EMPRESA: E1 }[papel], email }, 201)
  }
  if (metodo === 'GET' && (m = p.match(/^\/api\/empresas\/([0-9./-]{14,18})$/))) {
    return json({ cnpj: m[1].replace(/\D/g, ''), razaoSocial: 'Transportes Exemplo Ltda', nomeFantasia: 'Exemplo Cargas', situacaoCadastral: 'ATIVA' })
  }
  if (metodo === 'POST' && p === '/api/canhotos/contestacao') {
    const freteId = codigos[String(b.codigo ?? '').trim().toUpperCase()]
    if (!freteId) return problema(404, 'Código inválido', 'Código de contestação inválido.')
    return contestar(canhotos[freteId], String(b.motivo ?? '')) ?? new Response(null, { status: 202 })
  }
  if (metodo === 'POST' && p === '/api/auth/senha/link') {
    const email = String(b.email ?? '').trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return invalido({ email: 'Digite o e-mail da sua conta para receber o link.' })
    if (contas[email]) emailDoLink.gravar(email)
    return new Response(null, { status: 204 })
  }
  if (metodo === 'POST' && p === '/api/auth/senha/nova') {
    const senha = String(b.senha ?? '')
    if (senha.length < 8 || senha.length > 72) return invalido({ senha: 'A senha deve ter entre 8 e 72 caracteres.' })
    if (b.token !== 'demo') return problema(422, 'Regra de negócio', 'Este link não vale mais. Peça outro na tela de entrar.')
    const doLink = emailDoLink.ler()
    if (doLink && contas[doLink]) guardarConta(doLink, { ...contas[doLink], senha })
    return new Response(null, { status: 204 })
  }
  if (p === '/api/auth/logout') return new Response(null, { status: 204 })
  if (metodo === 'GET' && p === '/api/calendario/verificacao') return json(verificarData(url.searchParams.get('data') ?? data(0)))
  if (!token) return problema(401, 'Não autenticado', 'Faça login de novo.')

  if (metodo === 'GET' && p.startsWith('/api/enderecos/cep/')) {
    const cep = decodeURIComponent(p.slice('/api/enderecos/cep/'.length))
    if (!/^\d{5}-?\d{3}$/.test(cep)) return problema(400, 'Requisição inválida', 'CEP inválido. Deve conter 8 dígitos numéricos.')
    if (/^9{5}/.test(cep)) return problema(422, 'Regra de negócio', 'CEP não encontrado.')
    const [, cidade, uf] = REGIOES.find(([r]) => r.test(cep)) ?? REGIOES[0]
    return json({ cep, logradouro: null, bairro: 'Centro', cidade, uf })
  }
  if (metodo === 'GET' && p === '/api/auth/eu') {
    const papel = token.replace('demo-', '').toUpperCase() as ContaDemo['papel']
    const id = { MOTORISTA: M1, EMPRESA: U_EMPRESA, CLIENTE: U_CLIENTE, ADMIN: U_ADMIN }[papel]
    const nome = { MOTORISTA: motoristaDemo.nome, EMPRESA: 'Rafael Moreira', CLIENTE: clienteDemo.nome, ADMIN: 'Equipe Fretaí' }[papel]
    const email = Object.entries(contas).find(([, c]) => c.papel === papel)?.[0] ?? ''
    return json({ id, papel, empresaId: papel === 'EMPRESA' ? E1 : null, nome, email })
  }
  if (metodo === 'GET' && p === '/api/fretes/busca') {
    const raio = Number(url.searchParams.get('raioKm') ?? 100)
    const achados = fretes
      .filter((f) => (f.status === 'PUBLICADO' || f.status === 'PROPOSTA_ENVIADA') && distanciaDaBase[f.id] !== undefined)
      .map((f) => ({ distanciaOrigemKm: distanciaDaBase[f.id], frete: publico(f) }))
      .filter((a) => a.distanciaOrigemKm <= raio)
      .sort((a, z) => a.distanciaOrigemKm - z.distanciaOrigemKm)
    return json(pagina(achados))
  }
  if (metodo === 'POST' && (m = p.match(/^\/api\/fretes\/empresa\/([^/]+)$/))) {
    const erros = errosDaPublicacao(b)
    if (Object.keys(erros).length) return json({ title: 'Dados inválidos', detail: 'Confira os campos marcados.', status: 400, erros }, 400)
    return json(publicar(b), 201)
  }
  if (metodo === 'GET' && (m = p.match(/^\/api\/fretes\/empresa\/([^/]+)$/))) {
    return json(pagina(fretes.filter((f) => f.empresa?.id === m![1]).sort((a, z) => z.criadoEm.localeCompare(a.criadoEm))))
  }
  if (metodo === 'GET' && (m = p.match(/^\/api\/fretes\/cliente\/([^/]+)$/))) {
    if (token !== 'demo-admin' && !(token === 'demo-cliente' && m[1] === U_CLIENTE)) return problema(403, 'Acesso negado', 'Você não tem permissão para esta ação.')
    return json(pagina(fretes.filter((f) => f.cliente?.id === m![1]).sort((a, z) => z.criadoEm.localeCompare(a.criadoEm))))
  }
  if (metodo === 'POST' && p === '/api/fretes') {
    if (token !== 'demo-cliente' || b.clienteId !== U_CLIENTE) return problema(403, 'Acesso negado', 'Você não tem permissão para esta ação.')
    const erros = errosDoPedido(b)
    if (Object.keys(erros).length) return invalido(erros)
    return json(pedir(b), 201)
  }
  if (metodo === 'POST' && (m = p.match(/^\/api\/fretes\/([^/]+)\/canhoto\/contestacao$/))) {
    const c = canhotos[m[1]]
    if (!c) return problema(404, 'Sem canhoto', 'Este frete ainda não tem canhoto.')
    return contestar(c, String(b.motivo ?? '')) ?? json(c)
  }
  if ((m = p.match(/^\/api\/fretes\/([^/]+)(\/[a-z]+)?$/))) {
    const f = fretes.find((x) => x.id === m![1])
    if (!f) return problema(404, 'Frete não encontrado', 'Esse frete não existe ou foi removido.')
    const sub = m[2]
    if (metodo === 'GET' && !sub) return json(paraQuem(f, token))
    if (metodo === 'PUT' && !sub) {
      if (f.status !== 'PUBLICADO') return problema(409, 'Operação não permitida no status atual', 'O frete só pode ser editado antes de receber propostas.')
      const erros = errosDaPublicacao(b)
      if (Object.keys(erros).length) return invalido(erros)
      Object.assign(f, montarFrete(b, f))
      return json(f)
    }
    if (metodo === 'GET' && sub === '/eventos') return json(eventos[f.id] ?? [])
    if (metodo === 'GET' && sub === '/retorno') {
      const km = (a: Endereco, z: Endereco) => Math.round(Math.hypot((a.latitude! - z.latitude!) * 111, (a.longitude! - z.longitude!) * 102) * 1.2)
      const achados = fretes
        .filter((x) => x.id !== f.id && (x.status === 'PUBLICADO' || x.status === 'PROPOSTA_ENVIADA'))
        .map((x) => ({ distanciaOrigemKm: km(f.entrega, x.coleta), frete: publico(x) }))
        .filter((a) => a.distanciaOrigemKm <= 150)
        .sort((a, z) => a.distanciaOrigemKm - z.distanciaOrigemKm)
      return json(pagina(achados))
    }
    if (sub === '/avaliacoes') {
      if (metodo === 'GET') return json(avaliacoes.filter((a) => a.freteId === f.id))
      if (f.status !== 'ENTREGUE' && f.status !== 'PAGO') return problema(422, 'Ainda não', 'Só é possível avaliar depois da entrega.')
      const lado = token === 'demo-motorista' ? 'MOTORISTA' : 'CONTRATANTE'
      if (avaliacoes.some((a) => a.freteId === f.id && a.lado === lado)) return problema(409, 'Já avaliado', 'Este frete já foi avaliado por você.')
      const nota = Number(b.nota)
      if (!(nota >= 1 && nota <= 5)) return json({ title: 'Dados inválidos', detail: 'A nota vai de 1 a 5.', status: 400, erros: { nota: 'A nota vai de 1 a 5.' } }, 400)
      const nova: Avaliacao = {
        id: `av${avaliacoes.length + 1}`, freteId: f.id, lado, avaliadoTipo: lado === 'MOTORISTA' ? (f.empresa ? 'EMPRESA' : 'CLIENTE') : 'MOTORISTA',
        avaliadoId: lado === 'MOTORISTA' ? (f.empresa?.id ?? f.cliente?.id ?? '') : (f.motorista?.id ?? ''), nota,
        comentario: (b.comentario as string | null) ?? null, criadaEm: iso(0),
      }
      avaliacoes.push(nova)
      return json(nova, 201)
    }
    if (sub === '/documentos') {
      if (metodo === 'GET') return json(documentos.filter((x) => x.freteId === f.id && podeVer(x, token)).map(semUrl))
      if (token !== 'demo-motorista') return problema(403, 'Acesso negado', 'Só motoristas enviam documentos.')
      const dados = corpo as FormData
      const arquivo = dados.get('arquivo')
      if (!(arquivo instanceof Blob)) return problema(400, 'Sem arquivo', 'Envie PDF, PNG ou JPEG.')
      if (arquivo.size > 10 * 1024 * 1024) return problema(422, 'Arquivo grande', 'O arquivo deve ter até 10 MB.')
      const novo = {
        id: `d${documentos.length + 1}`, motoristaId: M1, freteId: f.id, tipo: String(dados.get('tipo')) as Documento['tipo'],
        contentType: arquivo.type, tamanhoBytes: arquivo.size, verificado: false, verificadoEm: null, ...semRecusa, criadoEm: iso(0), url: URL.createObjectURL(arquivo),
      }
      documentos.push(novo)
      return json(semUrl(novo), 201)
    }
    if (metodo === 'GET' && sub === '/canhoto') {
      return canhotos[f.id] ? json(canhotos[f.id]) : problema(404, 'Sem canhoto', 'Este frete ainda não tem canhoto.')
    }
    if (metodo === 'POST' && sub === '/canhoto') {
      if (f.status !== 'EM_TRANSITO') return problema(409, 'Fora da hora', 'O canhoto é registrado com a carga em trânsito, na chegada ao destino.')
      if (canhotos[f.id]) return problema(409, 'Conflito', 'Este frete já tem canhoto.')
      const dados = corpo as FormData
      const lat = Number(dados.get('latitude'))
      const lng = Number(dados.get('longitude'))
      const destinoKm = f.entrega.latitude != null && f.entrega.longitude != null
        ? Math.hypot((lat - f.entrega.latitude) * 111, (lng - f.entrega.longitude) * 102) : null
      if (destinoKm != null && destinoKm > 0.5) {
        return problema(422, 'Longe do destino', `O GPS está a ${destinoKm.toFixed(1)} km do endereço de entrega. O canhoto só vale a até 500 m.`)
      }
      const foto = dados.get('foto')
      const assinatura = dados.get('assinatura')
      const nome = String(dados.get('nomeRecebedor') ?? '').trim()
      const c: Canhoto = {
        id: `c-${f.id}`, freteId: f.id, nomeRecebedor: nome, latitude: lat, longitude: lng, distanciaDestinoKm: destinoKm,
        localConferido: destinoKm != null, registradoEm: iso(0), contestacaoAte: iso(1), contestado: false, motivoContestacao: null,
        resolucao: null, fotoUrl: foto instanceof Blob ? URL.createObjectURL(foto) : null,
        assinaturaUrl: assinatura instanceof Blob ? URL.createObjectURL(assinatura) : null,
      }
      canhotos[f.id] = c
      ;(eventos[f.id] ??= []).push(ev('EM_TRANSITO', 'ENTREGUE', 'MOTORISTA', 0, `Canhoto digital: recebido por ${nome}.`))
      Object.assign(f, { status: 'ENTREGUE', concluidoEm: iso(0) })
      const pg = pagamentos.find((x) => x.freteId === f.id)
      if (pg) pg.saldoLiberavelApos = c.contestacaoAte
      return json(c, 201)
    }
    if (sub === '/fotos') {
      if (metodo === 'GET') return json(fotosCarga[f.id] ?? [])
      if (token !== 'demo-cliente' || f.cliente?.id !== U_CLIENTE) return problema(403, 'Acesso negado', 'Só quem pediu o frete envia fotos.')
      if (f.status !== 'PUBLICADO' && f.status !== 'PROPOSTA_ENVIADA') return problema(422, 'Regra de negócio', 'As fotos entram antes de o frete fechar.')
      const lista = (fotosCarga[f.id] ??= [])
      if (lista.length >= 5) return problema(422, 'Regra de negócio', 'Até 5 fotos por pedido.')
      const foto = (corpo as FormData).get('foto')
      if (!(foto instanceof Blob) || !['image/jpeg', 'image/png'].includes(foto.type)) return problema(422, 'Regra de negócio', 'A foto da carga deve ser JPEG ou PNG.')
      const nova = { id: `fc${Date.now()}`, url: URL.createObjectURL(foto) }
      lista.push(nova)
      return json(nova, 201)
    }
    if (metodo === 'GET' && sub === '/contato') {
      const ehMotorista = token === 'demo-motorista' && f.motorista?.id === M1
      const ehContratante = (token === 'demo-cliente' && f.cliente?.id === U_CLIENTE) || (token === 'demo-empresa' && f.empresa?.id === E1)
      if (!ehMotorista && !ehContratante) return problema(403, 'Acesso negado', 'Só quem participa do frete vê o contato.')
      if (f.status === 'PUBLICADO' || f.status === 'PROPOSTA_ENVIADA') return problema(422, 'Regra de negócio', 'O contato aparece depois que o frete fecha.')
      if (f.status === 'PAGO' || f.status === 'CANCELADO') return problema(422, 'Regra de negócio', 'Este frete já terminou.')
      if (ehContratante) return json({ nome: f.motorista!.nome, telefone: telefones[f.motorista!.id] ?? '19998765432' })
      if (f.empresa) return json({ nome: f.empresa.nomeFantasia ?? f.empresa.razaoSocial, telefone: '1932104400' })
      return json({ nome: f.cliente!.nome, telefone: telefones[f.cliente!.id] })
    }
    if (metodo === 'GET' && sub === '/propostas') return json(propostas.filter((x) => x.freteId === f.id))
    if (metodo === 'GET' && sub === '/pagamento') {
      const pg = pagamentos.find((x) => x.freteId === f.id)
      if (pg?.status === 'PENDENTE' && (consultasPix[f.id] = (consultasPix[f.id] ?? 0) + 1) >= 3) {
        Object.assign(pg, { status: 'RETIDO', pagoEm: iso(0) })
      }
      return pg ? json(pg) : problema(404, 'Sem cobrança', 'Ainda não há cobrança para este frete.')
    }
    if (metodo === 'POST' && sub === '/pagamento') {
      const existente = pagamentos.find((x) => x.freteId === f.id)
      if (existente) return json(existente)
      const total = f.valorAcordado ?? f.valor ?? 0
      const novo = { ...pagamento(f.id, total, f.adiantamentoPercentual ?? 0, 'PENDENTE'), pixCopiaECola: `00020126580014br.gov.bcb.pix0136demo-${f.id}-fretai5204000053039865406${total.toFixed(2)}5802BR6304ABCD` }
      pagamentos.push(novo)
      return json(novo, 201)
    }
    const naoLeva = (veiculoId: unknown) => {
      const v = veiculos.find((x) => x.id === veiculoId) ?? veiculos.find((x) => x.motoristaId === M1)!
      const ordem = ['UTILITARIO', 'VAN', 'CAMINHAO']
      if (f.categoriaVeiculo && ordem.indexOf(v.categoria) < ordem.indexOf(f.categoriaVeiculo)) {
        const exigencia = { UTILITARIO: 'qualquer veículo', VAN: 'van, furgão ou caminhão', CAMINHAO: 'caminhão' }[f.categoriaVeiculo]
        return problema(422, 'Regra de negócio', `Este frete precisa de ${exigencia}.`)
      }
      return null
    }
    if (metodo === 'POST' && sub === '/propostas') {
      const recusa = naoLeva(b.veiculoId)
      if (recusa) return recusa
      const nova = proposta(`p${propostas.length + 1}`, f.id, M1, String(b.veiculoId ?? 'v1'), Number(b.valor), Number(b.adiantamentoPercentual ?? 0), 0)
      propostas.push(nova)
      if (f.status === 'PUBLICADO') { registrar(f.id, f.status, 'PROPOSTA_ENVIADA', 'MOTORISTA'); f.status = 'PROPOSTA_ENVIADA' }
      return json(nova, 201)
    }
    if (metodo === 'POST' && sub === '/aceite') {
      if (f.valorACombinar) return problema(422, 'Frete a combinar', 'Frete sem valor só fecha por proposta.')
      const recusa = naoLeva(b.veiculoId)
      if (recusa) return recusa
      registrar(f.id, f.status, 'ACEITO', 'MOTORISTA')
      const v = veiculos.find((x) => x.id === b.veiculoId) ?? veiculos[0]
      Object.assign(f, {
        status: 'ACEITO', aceitoEm: iso(0), valorAcordado: f.valor, veiculo: resumoVeiculo(v.id),
        motorista: { id: M1, nome: perfisMotorista[M1].nome, tipoVeiculo: v.categoria, placa: v.placa },
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
    if (metodo === 'POST' && sub === '/cancelamento') {
      if (!['PUBLICADO', 'PROPOSTA_ENVIADA', 'ACEITO'].includes(f.status)) {
        return problema(409, 'Transição inválida', 'Não é possível cancelar: o frete já saiu para entrega, foi concluído ou já está cancelado.')
      }
      const motivo = String(b.motivo ?? '').trim()
      if (!motivo) return json({ title: 'Dados inválidos', detail: 'Informe o motivo do cancelamento.', status: 400, erros: { motivo: 'Informe o motivo do cancelamento.' } }, 400)
      ;(eventos[f.id] ??= []).push(ev(f.status, 'CANCELADO', token === 'demo-motorista' ? 'MOTORISTA' : token === 'demo-cliente' ? 'CLIENTE' : 'EMPRESA', 0, motivo))
      Object.assign(f, { status: 'CANCELADO', motivoCancelamento: motivo, concluidoEm: iso(0) })
      const pg = pagamentos.find((x) => x.freteId === f.id)
      if (pg && pg.status !== 'PENDENTE') { pg.status = 'ESTORNADO'; pg.estornadoEm = iso(0) }
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
    registrar(f.id, f.status, 'ACEITO', f.cliente ? 'CLIENTE' : 'EMPRESA')
    Object.assign(f, {
      status: 'ACEITO', aceitoEm: iso(0), valorAcordado: pr.valor, adiantamentoPercentual: pr.adiantamentoPercentual,
      prazoEntrega: pr.prazoEntrega, veiculo: pr.veiculo,
      motorista: { id: pr.motorista.id, nome: pr.motorista.nome, tipoVeiculo: pr.veiculo?.categoria ?? null, placa: pr.veiculo?.placa ?? null },
    })
    return json(pr)
  }
  if (metodo === 'POST' && (m = p.match(/^\/api\/propostas\/([^/]+)\/retirada$/))) {
    const pr = propostas.find((x) => x.id === m![1])
    if (!pr) return problema(404, 'Proposta não encontrada', 'Essa proposta não existe.')
    if (pr.status !== 'ENVIADA') return problema(409, 'Proposta já respondida', 'Essa proposta já foi respondida.')
    Object.assign(pr, { status: 'RETIRADA', respondidaEm: iso(0) })
    // Como na API: sem nenhuma proposta em aberto, o frete volta para a vitrine.
    const f = fretes.find((x) => x.id === pr.freteId)
    if (f?.status === 'PROPOSTA_ENVIADA' && !propostas.some((x) => x.freteId === f.id && x.status === 'ENVIADA')) {
      registrar(f.id, f.status, 'PUBLICADO', 'MOTORISTA')
      f.status = 'PUBLICADO'
    }
    return json(pr)
  }
  if (metodo === 'GET' && p === '/api/propostas/minhas') return json(pagina(propostas.filter((x) => x.motorista.id === M1)))
  if ((m = p.match(/^\/api\/documentos\/([^/]+)\/(link|acessos)$/))) {
    const doc = documentos.find((x) => x.id === m![1])
    if (!doc) return problema(404, 'Documento não encontrado', 'Esse documento não existe.')
    if (metodo === 'GET' && m[2] === 'acessos') {
      if (token !== 'demo-admin' && !(token === 'demo-motorista' && doc.motoristaId === M1)) return problema(403, 'Acesso negado', 'Só o dono do documento vê quem o acessou.')
      return json(acessos[doc.id] ?? [])
    }
    if (metodo === 'POST' && m[2] === 'link') {
      if (!podeVer(doc, token)) return problema(403, 'Acesso negado', 'A empresa só vê os documentos do motorista depois de aceitar a proposta dele.')
      const papel = token === 'demo-motorista' ? 'MOTORISTA' : token === 'demo-admin' ? 'ADMIN' : token === 'demo-cliente' ? 'CLIENTE' : 'EMPRESA'
      ;(acessos[doc.id] ??= []).push({ usuarioId: { MOTORISTA: M1, ADMIN: U_ADMIN, CLIENTE: U_CLIENTE, EMPRESA: U_EMPRESA }[papel], papel, origem: '127.0.0.1', acessadoEm: iso(0) })
      return json({ url: doc.url, expiraEm: iso(10 / 1440) })
    }
  }
  // ---------- administrador ----------
  if (metodo === 'GET' && p === '/api/documentos/pendentes') {
    return soAdmin(token) ?? json(documentos.filter((d) => !d.verificado && !d.recusadoEm).sort((a, z) => a.criadoEm.localeCompare(z.criadoEm)).map(semUrl))
  }
  if (metodo === 'POST' && (m = p.match(/^\/api\/documentos\/([^/]+)\/verificacao$/))) {
    const negado = soAdmin(token)
    if (negado) return negado
    const doc = documentos.find((x) => x.id === m![1])
    if (!doc) return problema(404, 'Documento não encontrado', 'Esse documento não existe.')
    if (doc.recusadoEm) return problema(422, 'Regra de negócio', 'Este documento foi recusado. O motorista precisa enviar outro.')
    Object.assign(doc, { verificado: true, verificadoEm: iso(0) })
    const perfil = perfisMotorista[doc.motoristaId]
    if (perfil && doc.tipo !== 'COMPROVANTE' && !perfil.documentosVerificados.includes(doc.tipo)) perfil.documentosVerificados.push(doc.tipo)
    return json(semUrl(doc))
  }
  if (metodo === 'POST' && (m = p.match(/^\/api\/documentos\/([^/]+)\/recusa$/))) {
    const negado = soAdmin(token)
    if (negado) return negado
    const doc = documentos.find((x) => x.id === m![1])
    if (!doc) return problema(404, 'Documento não encontrado', 'Esse documento não existe.')
    if (doc.verificado) return problema(422, 'Regra de negócio', 'Este documento já foi verificado.')
    if (doc.recusadoEm) return problema(422, 'Regra de negócio', 'Este documento já foi recusado.')
    const motivo = String(b.motivo ?? '').trim()
    if (!motivo) return invalido({ motivo: 'Diga ao motorista por que o documento foi recusado.' })
    if (motivo.length > 300) return invalido({ motivo: 'O motivo deve ter até 300 caracteres.' })
    Object.assign(doc, { recusadoEm: iso(0), motivoRecusa: motivo })
    return json(semUrl(doc))
  }
  if (metodo === 'GET' && p === '/api/canhotos/contestacoes') {
    return soAdmin(token) ?? json(Object.values(canhotos).filter((c) => c.contestado && !c.resolucao))
  }
  if (metodo === 'POST' && (m = p.match(/^\/api\/fretes\/([^/]+)\/canhoto\/resolucao$/))) {
    const negado = soAdmin(token)
    if (negado) return negado
    const c = canhotos[m[1]]
    if (!c) return problema(404, 'Recurso não encontrado', 'Este frete ainda não tem canhoto.')
    if (b.resolucao !== 'ENTREGA_CONFIRMADA' && b.resolucao !== 'CONTESTACAO_PROCEDENTE') return invalido({ resolucao: 'Informe a resolução.' })
    c.resolucao = b.resolucao
    // Confirmada, o saldo destrava; a janela de contestação já passou, então ele sai na hora, como na API.
    const pg = pagamentos.find((x) => x.freteId === c.freteId)
    const f = fretes.find((x) => x.id === c.freteId)
    if (b.resolucao === 'ENTREGA_CONFIRMADA' && pg && f) {
      Object.assign(pg, { saldoBloqueado: false, status: 'LIBERADO', saldoLiberadoEm: iso(0) })
      registrar(f.id, f.status, 'PAGO', null)
      Object.assign(f, { status: 'PAGO', pagoEm: iso(0) })
    }
    return json(c)
  }
  if (metodo === 'GET' && p === '/api/piso-antt') return json(coeficientes)
  if (metodo === 'PUT' && (m = p.match(/^\/api\/piso-antt\/([A-Z_]+)\/(\d+)$/))) {
    const negado = soAdmin(token)
    if (negado) return negado
    const c = coeficientes.find((x) => x.tipoCarga === m![1] && x.numeroEixos === Number(m![2]))
    if (!c) return problema(404, 'Recurso não encontrado', 'Coeficiente não encontrado.')
    const erros: Record<string, string> = {}
    if (!(Number(b.ccd) >= 0)) erros.ccd = 'deve ser maior ou igual a 0'
    if (!(Number(b.cc) >= 0)) erros.cc = 'deve ser maior ou igual a 0'
    if (!String(b.fonte ?? '').trim()) erros.fonte = 'Informe a fonte dos coeficientes.'
    if (Object.keys(erros).length) return invalido(erros)
    const fonte = String(b.fonte).trim()
    Object.assign(c, { ccd: Number(b.ccd), cc: Number(b.cc), fonte, exemplo: fonte === 'EXEMPLO', atualizadoEm: iso(0) })
    return json(c)
  }
  if (metodo === 'POST' && p === '/api/calculadora/frete') {
    const { erros, resultado } = calcular(b)
    return erros ? invalido(erros) : json(resultado)
  }
  if ((m = p.match(/^\/api\/motoristas\/([^/]+)(\/chave-pix|\/base|\/preferencias)?$/)) && m[1] === M1) {
    if (metodo === 'GET' && !m[2]) return json(motoristaDemo)
    if (metodo === 'PUT' && !m[2]) {
      const erros: Record<string, string> = {}
      const nome = String(b.nome ?? '').trim()
      if (nome.length < 2) erros.nome = 'O nome deve ter entre 2 e 100 caracteres.'
      if (!TELEFONE.test(String(b.telefone ?? ''))) erros.telefone = 'Telefone inválido. Use DDD + número.'
      if (Object.keys(erros).length) return invalido(erros)
      Object.assign(motoristaDemo, { nome, telefone: String(b.telefone) })
      perfisMotorista[M1].nome = nome
      return json(motoristaDemo)
    }
    if (metodo === 'PUT' && m[2] === '/chave-pix') {
      if (!String(b.chavePix ?? '').trim()) return invalido({ chavePix: 'Informe a chave Pix.' })
      motoristaDemo.temChavePix = true
      return json(motoristaDemo)
    }
    if (metodo === 'PUT' && m[2] === '/base') {
      const raio = Number(b.raioKm)
      if (!(raio >= 1 && raio <= 1000)) return invalido({ raioKm: 'O raio vai de 1 a 1000 km.' })
      if (b.cep != null && !/^\d{5}-?\d{3}$/.test(String(b.cep))) return invalido({ cep: 'Digite os 8 números do CEP.' })
      if (b.cep == null && (b.latitude == null || b.longitude == null)) return invalido({ origemInformada: 'Informe o CEP ou use a sua localização.' })
      return json(motoristaDemo)
    }
    if (metodo === 'PATCH' && m[2] === '/preferencias') {
      motoristaDemo.aceitaFeriado = Boolean(b.aceitaFeriado)
      return json(motoristaDemo)
    }
  }
  if ((m = p.match(/^\/api\/clientes\/([^/]+)$/)) && (metodo === 'GET' || metodo === 'PUT')) {
    if (token !== 'demo-cliente' || m[1] !== U_CLIENTE) return problema(403, 'Acesso negado', 'Seu usuário não tem permissão para este recurso.')
    if (metodo === 'GET') return json(clienteDemo)
    const erros: Record<string, string> = {}
    const nome = String(b.nome ?? '').trim()
    if (!nome) erros.nome = 'O nome é obrigatório.'
    else if (nome.length < 2 || nome.length > 100) erros.nome = 'O nome deve ter entre 2 e 100 caracteres.'
    if (!String(b.telefone ?? '').trim()) erros.telefone = 'O telefone é obrigatório.'
    else if (!TELEFONE.test(String(b.telefone))) erros.telefone = 'Telefone inválido. Use DDD + número.'
    if (Object.keys(erros).length) return invalido(erros)
    const digitos = String(b.telefone).replace(/\D/g, '')
    Object.assign(clienteDemo, { nome, telefone: digitos })
    // Como na API: o nome novo aparece nos fretes, e o motorista de um frete fechado passa a receber o celular novo.
    clientes[U_CLIENTE].nome = nome
    telefones[U_CLIENTE] = digitos
    return json(clienteDemo)
  }
  if (metodo === 'POST' && (m = p.match(/^\/api\/motoristas\/([^/]+)\/veiculos$/))) {
    const placa = String(b.placa ?? '').toUpperCase().replace('-', '')
    const erros: Record<string, string> = {}
    if (!PLACA.test(placa)) erros.placa = 'Placa inválida. Use o formato ABC1234 ou ABC1D23.'
    else if (veiculos.some((v) => v.placa === placa)) erros.placa = 'Já existe um veículo com essa placa.'
    const dados = dadosDoVeiculo(b, erros)
    if (Object.keys(erros).length) return invalido(erros)
    const novo: Veiculo = { id: `v${veiculos.length + 1}`, motoristaId: m[1], placa, ...dados, criadoEm: iso(0) }
    veiculos.push(novo)
    return json(novo, 201)
  }
  if (metodo === 'PUT' && (m = p.match(/^\/api\/motoristas\/([^/]+)\/veiculos\/([^/]+)$/))) {
    const v = veiculos.find((x) => x.id === m![2] && x.motoristaId === m![1])
    if (!v) return problema(404, 'Veículo não encontrado', 'Esse veículo não existe.')
    const erros: Record<string, string> = {}
    const dados = dadosDoVeiculo(b, erros)
    if (Object.keys(erros).length) return invalido(erros)
    Object.assign(v, dados)
    return json(v)
  }
  if (metodo === 'DELETE' && (m = p.match(/^\/api\/motoristas\/([^/]+)\/veiculos\/([^/]+)$/))) {
    const i = veiculos.findIndex((v) => v.id === m![2] && v.motoristaId === m![1])
    if (i < 0) return problema(404, 'Veículo não encontrado', 'Esse caminhão não existe.')
    veiculos.splice(i, 1)
    return new Response(null, { status: 204 })
  }
  if ((m = p.match(/^\/api\/empresas\/([0-9a-f-]{36})$/))) {
    const e = dadosEmpresa[m[1]]
    if (!e) return problema(404, 'Recurso não encontrado', 'Empresa não encontrada.')
    if (metodo === 'GET') return json(e)
    if (metodo === 'PUT') {
      const fone = String(b.telefone ?? '').trim()
      const nomeFantasia = String(b.nomeFantasia ?? '').trim() || null
      if (!fone) return invalido({ telefone: 'O telefone é obrigatório.' })
      if (!TELEFONE.test(fone)) return invalido({ telefone: 'Telefone inválido. Use DDD + número.' })
      Object.assign(e, { nomeFantasia, telefone: fone.replace(/\D/g, '') })
      // O nome novo aparece nos fretes e no perfil público, como na API.
      Object.assign(empresas[e.id as keyof typeof empresas] as { nomeFantasia: string | null }, { nomeFantasia })
      Object.assign(perfisEmpresa[e.id], { nomeFantasia })
      return json(e)
    }
  }
  if (metodo === 'GET' && (m = p.match(/^\/api\/empresas\/([^/]+)\/perfil$/))) return json(perfisEmpresa[m[1]])
  if (metodo === 'GET' && (m = p.match(/^\/api\/motoristas\/([^/]+)\/perfil$/))) return json(perfisMotorista[m[1]])
  if (metodo === 'GET' && (m = p.match(/^\/api\/motoristas\/([^/]+)\/veiculos$/))) return json(veiculos.filter((v) => v.motoristaId === m![1]))

  return problema(404, 'Fora da demonstração', `O modo demo não cobre ${metodo} ${p}.`)
}
