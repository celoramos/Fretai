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

const VEICULO: Record<string, string> = {
  RODOTREM: 'Rodotrem', BITREM: 'Bitrem', CARRETA_LS: 'Carreta LS', CARRETA: 'Carreta', VANDERLEIA: 'Vanderleia',
  TRUCK: 'Truck', BITRUCK: 'Bitruck', TOCO: 'Toco', VUC: 'VUC', TRES_QUARTOS: '3/4',
}
const CARROCERIA: Record<string, string> = {
  BAU: 'Baú', BAU_FRIGORIFICO: 'Baú frigorífico', SIDER: 'Sider', CACAMBA: 'Caçamba', GRADE_BAIXA: 'Grade baixa',
  GRANELEIRO: 'Graneleiro', PRANCHA: 'Prancha', TANQUE: 'Tanque', CEGONHA: 'Cegonha',
}
const CARGA: Record<string, string> = {
  GRANEL_SOLIDO: 'Granel sólido', GRANEL_LIQUIDO: 'Granel líquido', FRIGORIFICADA: 'Frigorificada',
  CONTEINERIZADA: 'Conteinerizada', CARGA_GERAL: 'Carga geral', NEOGRANEL: 'Neogranel', GRANEL_PRESSURIZADA: 'Granel pressurizada',
}
export const veiculo = (v: string) => VEICULO[v] ?? v
export const carroceria = (c: string) => CARROCERIA[c] ?? c
export const carga = (c: string) => CARGA[c] ?? c.replaceAll('_', ' ').toLowerCase()
