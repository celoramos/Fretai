import type { Pagamento } from './api/tipos'

/** Uma parcela que saiu do Fretaí para a chave Pix do motorista. */
export interface Recebimento {
  parcela: 'Adiantamento' | 'Saldo'
  valor: number
  /** Quando caiu. Null só em dado antigo, sem a data registrada. */
  quando: string | null
}

/**
 * O que já saiu para o motorista neste pagamento: o adiantamento na saída da carga (quando houve um
 * combinado) e o saldo depois da entrega. Antes da saída, e em Pix devolvido, nada foi para ele.
 * O Extrato e o resumo de Meus fretes leem daqui, para os dois darem a mesma soma.
 */
export function recebimentos(pagamento: Pagamento): Recebimento[] {
  const parcelas: Recebimento[] = []
  const saiu = pagamento.status === 'ADIANTAMENTO_LIBERADO' || pagamento.status === 'LIBERADO'
  if (saiu && pagamento.valorAdiantamento > 0) {
    parcelas.push({ parcela: 'Adiantamento', valor: pagamento.valorAdiantamento, quando: pagamento.adiantamentoLiberadoEm })
  }
  if (pagamento.status === 'LIBERADO') {
    parcelas.push({ parcela: 'Saldo', valor: pagamento.valorSaldo, quando: pagamento.saldoLiberadoEm })
  }
  return parcelas
}

/**
 * Quanto caiu no mês de `agora` e de quantos fretes veio. Cada parcela conta no mês em que saiu: o
 * adiantamento de outubro e o saldo de novembro do mesmo frete ficam cada um no seu mês.
 */
export function recebidoNoMes(pagamentos: Pagamento[], agora: Date): { total: number; fretes: number } {
  let total = 0
  const fretes = new Set<string>()
  for (const pagamento of pagamentos) {
    for (const parcela of recebimentos(pagamento)) {
      if (!parcela.quando) continue
      const quando = new Date(parcela.quando)
      if (quando.getFullYear() === agora.getFullYear() && quando.getMonth() === agora.getMonth()) {
        total += parcela.valor
        fretes.add(pagamento.freteId)
      }
    }
  }
  return { total, fretes: fretes.size }
}
