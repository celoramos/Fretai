import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Pagamento, StatusPagamento } from '../src/api/tipos.ts'
import { recebidoNoMes, recebimentos } from '../src/recebimentos.ts'

/** Meio-dia na hora local: o teste dá o mesmo resultado em qualquer fuso. */
const dia = (ano: number, mes: number, d: number) => new Date(ano, mes - 1, d, 12).toISOString()

function pagamento(status: StatusPagamento, total: number, adiantamento: number,
  datas: { adiantamento?: string; saldo?: string } = {}, freteId = 'f1'): Pagamento {
  return {
    id: `pg-${freteId}`, freteId, status, valorTotal: total, valorAdiantamento: adiantamento, valorSaldo: total - adiantamento,
    gateway: 'FAKE', cobrancaId: `cob_${freteId}`, pixCopiaECola: null, pixQrCodeBase64: null, vencimento: dia(2026, 12, 1),
    pagoEm: status === 'PENDENTE' ? null : dia(2026, 10, 20), adiantamentoLiberadoEm: datas.adiantamento ?? null,
    saldoLiberavelApos: null, saldoBloqueado: false, saldoLiberadoEm: datas.saldo ?? null, estornadoEm: null,
  }
}

describe('o que já saiu para o motorista em um pagamento', () => {
  it('antes da saída da carga, nada', () => {
    for (const status of ['PENDENTE', 'RETIDO', 'ESTORNADO'] as const) {
      assert.deepEqual(recebimentos(pagamento(status, 1000, 300)), [], status)
    }
  })

  it('em viagem, só o adiantamento', () => {
    const p = pagamento('ADIANTAMENTO_LIBERADO', 1000, 300, { adiantamento: dia(2026, 11, 5) })
    assert.deepEqual(recebimentos(p), [{ parcela: 'Adiantamento', valor: 300, quando: dia(2026, 11, 5) }])
  })

  it('sem adiantamento combinado, a saída não gera recebimento', () => {
    assert.deepEqual(recebimentos(pagamento('ADIANTAMENTO_LIBERADO', 1000, 0, { adiantamento: dia(2026, 11, 5) })), [])
  })

  it('depois do saldo, o adiantamento e o saldo, cada um com a sua data', () => {
    const p = pagamento('LIBERADO', 1000, 300, { adiantamento: dia(2026, 10, 28), saldo: dia(2026, 11, 3) })
    assert.deepEqual(recebimentos(p), [
      { parcela: 'Adiantamento', valor: 300, quando: dia(2026, 10, 28) },
      { parcela: 'Saldo', valor: 700, quando: dia(2026, 11, 3) },
    ])
  })

  it('frete sem adiantamento que terminou: só o saldo, que é o frete inteiro', () => {
    const p = pagamento('LIBERADO', 380, 0, { saldo: dia(2026, 11, 3) })
    assert.deepEqual(recebimentos(p), [{ parcela: 'Saldo', valor: 380, quando: dia(2026, 11, 3) }])
  })
})

describe('recebido no mês', () => {
  const novembro = new Date(2026, 10, 9, 22)
  const outubro = new Date(2026, 9, 31, 8)

  it('cada parcela conta no mês em que caiu, não no mês em que o frete terminou', () => {
    const viradaDoMes = [pagamento('LIBERADO', 1000, 300, { adiantamento: dia(2026, 10, 28), saldo: dia(2026, 11, 3) })]
    assert.deepEqual(recebidoNoMes(viradaDoMes, novembro), { total: 700, fretes: 1 })
    assert.deepEqual(recebidoNoMes(viradaDoMes, outubro), { total: 300, fretes: 1 })
  })

  it('o adiantamento de um frete ainda em viagem já conta', () => {
    const emViagem = [pagamento('ADIANTAMENTO_LIBERADO', 5100, 2040, { adiantamento: dia(2026, 11, 8) })]
    assert.deepEqual(recebidoNoMes(emViagem, novembro), { total: 2040, fretes: 1 })
  })

  it('soma fretes diferentes e conta cada frete uma vez, mesmo com duas parcelas no mês', () => {
    const pagamentos = [
      pagamento('LIBERADO', 1000, 300, { adiantamento: dia(2026, 11, 2), saldo: dia(2026, 11, 6) }, 'f1'),
      pagamento('ADIANTAMENTO_LIBERADO', 2300, 920, { adiantamento: dia(2026, 11, 8) }, 'f2'),
      pagamento('RETIDO', 2900, 1450, {}, 'f3'),
    ]
    assert.deepEqual(recebidoNoMes(pagamentos, novembro), { total: 1920, fretes: 2 })
  })

  it('o mesmo mês de outro ano não conta', () => {
    const anoPassado = [pagamento('LIBERADO', 1000, 300, { adiantamento: dia(2025, 11, 2), saldo: dia(2025, 11, 6) })]
    assert.deepEqual(recebidoNoMes(anoPassado, novembro), { total: 0, fretes: 0 })
  })

  it('parcela sem data registrada fica de fora, em vez de cair no mês errado', () => {
    const semData = [pagamento('LIBERADO', 1000, 300, { adiantamento: dia(2026, 11, 2) })]
    assert.deepEqual(recebidoNoMes(semData, novembro), { total: 300, fretes: 1 })
  })
})
