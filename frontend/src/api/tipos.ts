// Espelho dos DTOs da API Spring (pacotes */application/dto). Valores BigDecimal chegam como number no JSON.

export type Papel = 'CLIENTE' | 'EMPRESA' | 'MOTORISTA' | 'ADMIN'

export type StatusFrete =
  | 'PUBLICADO'
  | 'PROPOSTA_ENVIADA'
  | 'ACEITO'
  | 'EM_TRANSITO'
  | 'ENTREGUE'
  | 'PAGO'
  | 'CANCELADO'

export type StatusPagamento = 'PENDENTE' | 'RETIDO' | 'ADIANTAMENTO_LIBERADO' | 'LIBERADO' | 'ESTORNADO'
export type StatusProposta = 'ENVIADA' | 'ACEITA' | 'RECUSADA' | 'RETIRADA'
export type TipoEmpresa = 'EMBARCADOR' | 'AGENCIADOR'

export interface Tokens {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  usuarioId: string
  papel: Papel
  empresaId: string | null
}

export interface Endereco {
  cep: string
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string
  uf: string
  pontoReferencia: string | null
  enderecoCompleto: string
  latitude: number | null
  longitude: number | null
}

export interface VeiculoResumo {
  id: string
  placa: string
  tipo: string
  carroceria: string
  numeroEixos: number
  rastreador: boolean
}

export interface Preco {
  pisoMinimo: number | null
  eixosConsiderados: number | null
  coeficientesDeExemplo: boolean | null
  abaixoDoPiso: boolean
  acimaDaMedia: boolean
  mediaRotaPorKm: number | null
}

export interface Frete {
  id: string
  status: StatusFrete
  statusDescricao: string
  cliente: { id: string; nome: string } | null
  empresa: { id: string; razaoSocial: string; nomeFantasia: string | null; tipo: TipoEmpresa } | null
  motorista: { id: string; nome: string; tipoVeiculo: string | null; placa: string | null } | null
  veiculo: VeiculoResumo | null
  coleta: Endereco
  entrega: Endereco
  nomeDestinatario: string | null
  telefoneDestinatario: string | null
  descricaoCarga: string | null
  especieCarga: string | null
  tipoCargaAntt: string | null
  pesoKg: number | null
  valor: number | null
  valorACombinar: boolean
  adicionalFeriado: number | null
  valorTotal: number | null
  veiculosAceitos: string[]
  carroceriasAceitas: string[]
  exigeRastreador: boolean
  complemento: boolean
  publicadoPorAgenciador: boolean
  dataColeta: string
  feriado: boolean
  nomeFeriado: string | null
  domingo: boolean
  distanciaKm: number | null
  distanciaEstimada: boolean | null
  valorAcordado: number | null
  adiantamentoPercentual: number | null
  prazoEntrega: string | null
  preco: Preco | null
  motivoCancelamento: string | null
  criadoEm: string
  aceitoEm: string | null
  concluidoEm: string | null
  pagoEm: string | null
}

export interface FreteEncontrado {
  distanciaOrigemKm: number
  frete: Frete
}

export interface Proposta {
  id: string
  freteId: string
  motorista: { id: string; nome: string }
  veiculo: VeiculoResumo | null
  autorPapel: Papel
  valor: number
  adiantamentoPercentual: number
  valorAdiantamento: number
  prazoEntrega: string | null
  observacao: string | null
  status: StatusProposta
  criadaEm: string
  respondidaEm: string | null
}

export interface Pagamento {
  id: string
  freteId: string
  status: StatusPagamento
  valorTotal: number
  valorAdiantamento: number
  valorSaldo: number
  gateway: string
  cobrancaId: string | null
  pixCopiaECola: string | null
  pixQrCodeBase64: string | null
  vencimento: string | null
  pagoEm: string | null
  adiantamentoLiberadoEm: string | null
  saldoLiberavelApos: string | null
  saldoBloqueado: boolean
  saldoLiberadoEm: string | null
  estornadoEm: string | null
}

export interface EventoFrete {
  de: StatusFrete | null
  para: StatusFrete
  autorId: string | null
  autorPapel: Papel | null
  observacao: string | null
  ocorridoEm: string
}

export interface PerfilEmpresa {
  id: string
  razaoSocial: string
  nomeFantasia: string | null
  tipo: TipoEmpresa
  naPlataformaDesde: string
  mediaNotas: number | null
  quantidadeAvaliacoes: number
  fretesPublicados: number
  fretesConcluidos: number
  percentualSaldosPagosEmDia: number | null
  cobrancasConsideradas: number
}

export interface PerfilMotorista {
  id: string
  nome: string
  naPlataformaDesde: string
  mediaNotas: number | null
  quantidadeAvaliacoes: number
  fretesConcluidos: number
  documentosVerificados: string[]
}

export interface Veiculo extends VeiculoResumo {
  motoristaId: string
  rntrc: string
  criadoEm: string
}

export interface Pagina<T> {
  content: T[]
  page: { size: number; number: number; totalElements: number; totalPages: number }
}

/** Corpo de erro da API (ProblemDetail): title, detail, status e, em validação, erros por campo. */
export interface Problema {
  title: string
  detail: string
  status: number
  erros?: Record<string, string>
  /** CADASTRO_NECESSARIO: entrou com Google, mas ainda não tem conta. Vem com o e-mail e o nome do Google. */
  codigo?: string
  email?: string
  nome?: string | null
}

/** Categorias de veículo do cadastro de motorista (enum CategoriaVeiculo da API). */
export type CategoriaVeiculo = 'MOTO' | 'CARRO' | 'UTILITARIO' | 'VAN' | 'CAMINHAO'

export interface CadastroMotorista {
  cpf: string
  nome: string
  email: string
  senha?: string
  telefone: string
  tipoVeiculo: CategoriaVeiculo
  placa: string
  credencialGoogle?: string
}

export interface CadastroEmpresa {
  cnpj: string
  tipo: TipoEmpresa
  telefone: string
  nomeFantasia?: string
  responsavel: { cpf: string; nome: string; email: string; senha?: string; telefone: string; credencialGoogle?: string }
}

/** Consulta à Receita (GET /api/empresas/{cnpj}): o cadastro mostra a razão social antes de enviar. */
export interface DadosCnpj {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string | null
  situacaoCadastral: string
}
