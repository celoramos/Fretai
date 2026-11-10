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

/**
 * Para quem não participa do frete (o motorista que ainda está olhando) a API manda só bairro, cidade e
 * UF: CEP, rua, número, coordenadas e o endereço completo vêm nulos.
 */
export interface Endereco {
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string
  uf: string
  pontoReferencia: string | null
  enderecoCompleto: string | null
  latitude: number | null
  longitude: number | null
}

/** Utilitário, van ou caminhão. Os dados de caminhão (tipo, carroceria, eixos) só o frete de empresa exige. */
export interface VeiculoResumo {
  id: string
  placa: string
  categoria: CategoriaVeiculo
  modelo: string | null
  tipo: string | null
  carroceria: string | null
  numeroEixos: number | null
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
  /** Frete de pessoa física: o menor veículo que leva a carga e o que vai. Nulos no frete de empresa. */
  categoriaVeiculo: CategoriaVeiculo | null
  tipoCarga: TipoCarga | null
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
  rntrc: string | null
  criadoEm: string
}

/** Foto que o cliente manda com o pedido (até 5). A url é assinada e expira. */
export interface FotoCarga {
  id: string
  url: string
}

/** GET /api/auth/eu: quem está logado, com o nome e o e-mail que o menu da conta mostra. */
export interface Eu {
  id: string
  papel: Papel
  empresaId: string | null
  nome: string
  email: string
}

/** GET /api/fretes/{id}/contato: o outro lado do frete, para o WhatsApp. Só depois do aceite. */
export interface Contato {
  nome: string
  telefone: string
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

/** Tamanho do veículo, do menor para o maior (enum CategoriaVeiculo da API). Carro e moto não fazem frete. */
export type CategoriaVeiculo = 'UTILITARIO' | 'VAN' | 'CAMINHAO'

/** O que a pessoa física vai levar (enum TipoCarga da API). */
export type TipoCarga = 'MUDANCA' | 'MOVEIS' | 'CAIXAS' | 'OBRA' | 'OUTRO'

export interface CadastroCliente {
  cpf: string
  nome: string
  email: string
  senha?: string
  telefone: string
  credencialGoogle?: string
}

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

/** Corpo de POST /api/fretes/empresa/{empresaId} (PublicarFreteRequest). A API resolve cidade e coordenadas pelo CEP. */
/** Frete pontual de cliente pessoa física (SolicitarFreteRequest): sem tipo de caminhão nem carga ANTT. */
export interface SolicitarFrete {
  clienteId: string
  coleta: EnderecoPedido
  entrega: EnderecoPedido
  nomeDestinatario: string
  telefoneDestinatario: string
  descricaoCarga: string
  pesoKg: number
  valor: number
  dataColeta: string
  categoriaVeiculo: CategoriaVeiculo
  tipoCarga: TipoCarga
}

/** GET /api/enderecos/cep/{cep}: o que o pedido mostra logo depois do CEP ("bairro, cidade"). */
export interface ConsultaCep {
  cep: string
  logradouro: string | null
  bairro: string | null
  cidade: string
  uf: string
}

export interface EnderecoPedido {
  cep: string
  numero: string | null
  complemento: string | null
  pontoReferencia: string | null
}

export interface PublicarFrete {
  coleta: EnderecoPedido
  entrega: EnderecoPedido
  descricaoCarga: string
  especieCarga: string
  tipoCargaAntt: string
  pesoKg: number
  /** null quando valorACombinar: um dos dois, nunca ambos. */
  valor: number | null
  valorACombinar: boolean
  dataColeta: string
  veiculosAceitos: string[]
  carroceriasAceitas: string[]
  exigeRastreador: boolean
  complemento: boolean
}

/** GET /api/calendario/verificacao?data=AAAA-MM-DD */
export interface VerificacaoData {
  data: string
  feriado: boolean
  nomeFeriado: string | null
  domingo: boolean
  diaUtil: boolean
}

export type ResolucaoCanhoto = 'ENTREGA_CONFIRMADA' | 'CONTESTACAO_PROCEDENTE'

/** Canhoto digital. fotoUrl e assinaturaUrl são links temporários: vencem em minutos. */
export interface Canhoto {
  id: string
  freteId: string
  nomeRecebedor: string
  latitude: number
  longitude: number
  distanciaDestinoKm: number | null
  /** false quando o destino não tinha coordenadas para comparar com o GPS. */
  localConferido: boolean
  registradoEm: string
  contestacaoAte: string
  contestado: boolean
  motivoContestacao: string | null
  resolucao: ResolucaoCanhoto | null
  fotoUrl: string | null
  assinaturaUrl: string | null
}

export interface Avaliacao {
  id: string
  freteId: string
  /** Quem avaliou: o motorista ou quem contratou. */
  lado: 'CONTRATANTE' | 'MOTORISTA'
  avaliadoTipo: 'EMPRESA' | 'CLIENTE' | 'MOTORISTA'
  avaliadoId: string
  nota: number
  comentario: string | null
  criadaEm: string
}

/** GET e PUT /api/clientes/{id}: o cadastro do cliente pessoa física, que só ele abre. O CPF não volta; o telefone vem só com dígitos. */
export interface Cliente {
  id: string
  nome: string
  email: string
  telefone: string
  criadoEm: string
}

/** GET /api/motoristas/{id}. A chave Pix em si não volta: só se existe. */
export interface Motorista {
  id: string
  nome: string
  email: string
  telefone: string
  tipoVeiculo: CategoriaVeiculo
  placa: string
  aceitaFeriado: boolean
  temChavePix: boolean
  criadoEm: string
}

/**
 * Cadastro e edição de veículo (VeiculoRequest). Tipo, modelo e placa bastam para frete de pessoa física;
 * os dados de caminhão completam o veículo para frete de empresa. Na edição a API ignora a placa.
 */
export interface NovoVeiculo {
  placa: string
  categoria: CategoriaVeiculo
  modelo?: string | null
  rntrc?: string | null
  tipo?: string | null
  carroceria?: string | null
  numeroEixos?: number | null
  rastreador: boolean
}

/** POST /api/calculadora/frete: "esse frete paga a viagem?". Tipo de carga e eixos trazem o piso ANTT. */
export interface PedidoCalculo {
  distanciaKm: number
  consumoKmPorLitro: number
  precoDieselLitro: number
  pedagio: number | null
  outrosCustos: number | null
  tipoCargaAntt: string | null
  numeroEixos: number | null
  valorOferecido: number | null
}

export interface ResultadoCalculo {
  custo: { distanciaKm: number; litros: number; combustivel: number; pedagio: number; outros: number; total: number }
  piso: { valor: number; tipoCarga: string; numeroEixos: number; distanciaKm: number; fonte: string; coeficientesDeExemplo: boolean } | null
  valorOferecido: number | null
  /** Valor oferecido menos o custo da viagem; null sem valor oferecido. */
  margem: number | null
  abaixoDoPiso: boolean
}

/** Metadados de um documento do motorista. O arquivo só abre por POST /api/documentos/{id}/link, que registra o acesso. */
export interface Documento {
  id: string
  motoristaId: string
  freteId: string
  tipo: 'CNH' | 'CRLV' | 'COMPROVANTE'
  contentType: string
  tamanhoBytes: number
  verificado: boolean
  verificadoEm: string | null
  /** Recusado pelo administrador: sai da fila, e o motorista lê o motivo e manda outro arquivo. */
  recusadoEm: string | null
  motivoRecusa: string | null
  criadoEm: string
}

/** Link temporário: depois de expiraEm é preciso pedir outro. */
export interface LinkDocumento {
  url: string
  expiraEm: string
}

export interface AcessoDocumento {
  usuarioId: string
  papel: Papel
  origem: string | null
  acessadoEm: string
}

/** GET e PUT /api/empresas/{id}. O CNPJ é dado público; os dados do responsável não voltam. Telefone só com dígitos. */
export interface Empresa {
  id: string
  cnpj: string
  razaoSocial: string
  nomeFantasia: string | null
  tipo: TipoEmpresa
  telefone: string
  ativa: boolean
  criadoEm: string
}

/** GET /api/piso-antt e PUT /api/piso-antt/{tipoCarga}/{eixos}. Piso = distância × ccd + cc. */
export interface Coeficiente {
  tipoCarga: string
  numeroEixos: number
  /** Custo de deslocamento, em R$ por km. */
  ccd: number
  /** Custo de carga e descarga, em R$. */
  cc: number
  fonte: string
  /** true enquanto a fonte for "EXEMPLO": valores de desenvolvimento, não os da ANTT. */
  exemplo: boolean
  atualizadoEm: string
}
