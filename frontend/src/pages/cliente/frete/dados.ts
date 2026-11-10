import type { EventoFrete, Frete, Pagamento } from '../../../api/tipos'

export type DadosFrete = { frete: Frete; pagamento: Pagamento | null; eventos: EventoFrete[] }

/** O Pix entrou: o dinheiro está guardado (ou já saiu para o motorista). */
export const pixPago = (p: Pagamento | null) => p != null && ['RETIDO', 'ADIANTAMENTO_LIBERADO', 'LIBERADO'].includes(p.status)
