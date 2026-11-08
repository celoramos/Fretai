import type { Papel, StatusFrete, StatusPagamento, StatusProposta } from './api/tipos'

const brl = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const brlCentavos = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const km = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

/** Só o número; o "R$" é desenhado à parte, menor e mais claro (briefing, seção 4). */
export const reais = (v: number) => brl.format(v)
export const reaisCentavos = (v: number) => brlCentavos.format(v)
export const quilometros = (v: number) => `${km.format(v)} km`
export const porKm = (valor: number, distancia: number) => brlCentavos.format(valor / distancia)

export const dataCurta = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
export const dataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export type Tom = 'info' | 'faixa' | 'garantido' | 'perigo' | 'neutro' | 'alerta'

/** Seção 6 do briefing: o mesmo status fala diferente com o motorista e com a empresa. */
export const STATUS_FRETE: Record<StatusFrete, { motorista: string; empresa: string; tom: Tom }> = {
  PUBLICADO: { motorista: 'Aberto', empresa: 'Aguardando propostas', tom: 'info' },
  PROPOSTA_ENVIADA: { motorista: 'Em negociação', empresa: 'Com propostas', tom: 'faixa' },
  ACEITO: { motorista: 'Fechado, vá para a coleta', empresa: 'Motorista a caminho da coleta', tom: 'info' },
  EM_TRANSITO: { motorista: 'Em viagem', empresa: 'Em trânsito', tom: 'faixa' },
  ENTREGUE: { motorista: 'Entregue, saldo em análise', empresa: 'Entregue', tom: 'garantido' },
  PAGO: { motorista: 'Pago', empresa: 'Concluído e pago', tom: 'garantido' },
  CANCELADO: { motorista: 'Cancelado', empresa: 'Cancelado', tom: 'perigo' },
}

/** Ordem dos marcos na estrada; CANCELADO sai da estrada e não é marco. */
export const MARCOS: StatusFrete[] = ['PUBLICADO', 'PROPOSTA_ENVIADA', 'ACEITO', 'EM_TRANSITO', 'ENTREGUE', 'PAGO']

export const STATUS_PAGAMENTO: Record<StatusPagamento, string> = {
  PENDENTE: 'Aguardando o Pix da empresa',
  RETIDO: 'Pagamento garantido',
  ADIANTAMENTO_LIBERADO: 'Adiantamento pago',
  LIBERADO: 'Saldo pago',
  ESTORNADO: 'Devolvido à empresa',
}

export const STATUS_PROPOSTA: Record<StatusProposta, { rotulo: string; tom: Tom }> = {
  ENVIADA: { rotulo: 'Aguardando resposta', tom: 'faixa' },
  ACEITA: { rotulo: 'Aceita', tom: 'garantido' },
  RECUSADA: { rotulo: 'Recusada', tom: 'neutro' },
  RETIRADA: { rotulo: 'Retirada', tom: 'neutro' },
}

export const PAPEL: Record<Papel, string> = {
  CLIENTE: 'Cliente', EMPRESA: 'Empresa', MOTORISTA: 'Motorista', ADMIN: 'Fretaí',
}

/** Tipos de caminhão da API (enum TipoVeiculo), do maior para o menor; eixos é o padrão do tipo. */
export const TIPOS_CAMINHAO = [
  { valor: 'RODOTREM', rotulo: 'Rodotrem', eixos: 9 },
  { valor: 'BITREM', rotulo: 'Bitrem', eixos: 7 },
  { valor: 'CARRETA_LS', rotulo: 'Carreta LS', eixos: 6 },
  { valor: 'VANDERLEIA', rotulo: 'Vanderleia', eixos: 6 },
  { valor: 'CARRETA', rotulo: 'Carreta', eixos: 5 },
  { valor: 'BITRUCK', rotulo: 'Bitruck', eixos: 4 },
  { valor: 'TRUCK', rotulo: 'Truck', eixos: 3 },
  { valor: 'TOCO', rotulo: 'Toco', eixos: 2 },
  { valor: 'VUC', rotulo: 'VUC', eixos: 2 },
  { valor: 'TRES_QUARTOS', rotulo: '3/4', eixos: 2 },
] as const

/** Carrocerias da API (enum TipoCarroceria). */
export const CARROCERIAS = [
  { valor: 'BAU', rotulo: 'Baú' },
  { valor: 'BAU_FRIGORIFICO', rotulo: 'Baú frigorífico' },
  { valor: 'SIDER', rotulo: 'Sider' },
  { valor: 'CACAMBA', rotulo: 'Caçamba' },
  { valor: 'GRADE_BAIXA', rotulo: 'Grade baixa' },
  { valor: 'GRANELEIRO', rotulo: 'Graneleiro' },
  { valor: 'PRANCHA', rotulo: 'Prancha' },
  { valor: 'TANQUE', rotulo: 'Tanque' },
  { valor: 'CEGONHA', rotulo: 'Cegonha' },
] as const

/** Tipos de carga da tabela ANTT (enum TipoCargaAntt), com o nome que a API usa. */
export const CARGAS_ANTT = [
  { valor: 'CARGA_GERAL', rotulo: 'Carga geral' },
  { valor: 'GRANEL_SOLIDO', rotulo: 'Granel sólido' },
  { valor: 'GRANEL_LIQUIDO', rotulo: 'Granel líquido' },
  { valor: 'FRIGORIFICADA', rotulo: 'Frigorificada ou aquecida' },
  { valor: 'CONTEINERIZADA', rotulo: 'Conteinerizada' },
  { valor: 'NEOGRANEL', rotulo: 'Neogranel' },
  { valor: 'GRANEL_PRESSURIZADA', rotulo: 'Carga granel pressurizada' },
  { valor: 'PERIGOSA_CARGA_GERAL', rotulo: 'Perigosa (carga geral)' },
  { valor: 'PERIGOSA_GRANEL_SOLIDO', rotulo: 'Perigosa (granel sólido)' },
  { valor: 'PERIGOSA_GRANEL_LIQUIDO', rotulo: 'Perigosa (granel líquido)' },
  { valor: 'PERIGOSA_FRIGORIFICADA', rotulo: 'Perigosa (frigorificada ou aquecida)' },
  { valor: 'PERIGOSA_CONTEINERIZADA', rotulo: 'Perigosa (conteinerizada)' },
] as const

const rotulo = (lista: readonly { valor: string; rotulo: string }[], v: string) => lista.find((x) => x.valor === v)?.rotulo ?? v
export const veiculo = (v: string) => rotulo(TIPOS_CAMINHAO, v)
export const carroceria = (c: string) => rotulo(CARROCERIAS, c)
export const carga = (c: string) => rotulo(CARGAS_ANTT, c)
