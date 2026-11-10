import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { calcularViagem, type Viagem } from '../src/calculo.ts'

/** O caso do canvas: R$ 380 por 22 km, 9 km/l, diesel a R$ 6,19, contando a volta vazio. */
const canvas: Viagem = { valor: 380, distanciaKm: 22, consumoKmL: 9, dieselLitro: 6.19, pedagio: 0, outros: 0, voltaVazio: true }
const perto = (obtido: number | null, esperado: number) => assert.ok(obtido != null && Math.abs(obtido - esperado) < 0.005, `${obtido} não é ${esperado}`)

describe('"Esse frete paga a viagem?"', () => {
  it('o caso do canvas: diesel de 44 km, sobra e reais por km rodado com carga', () => {
    const conta = calcularViagem(canvas)
    assert.ok(conta)
    perto(conta.diesel, 30.26)     // 44 km ÷ 9 km/l × 6,19
    perto(conta.custo, 30.26)
    perto(conta.sobra, 349.74)     // 380 − 30,26
    perto(conta.porKm, 17.27)      // 380 ÷ 22: a volta vazio não entra no divisor
  })

  it('sem contar a volta, o diesel é o de uma perna só', () => {
    perto(calcularViagem({ ...canvas, voltaVazio: false })!.diesel, 15.13)
  })

  it('pedágio e outros custos entram no custo; custo maior que o valor dá sobra negativa (a tela diz "Falta")', () => {
    const conta = calcularViagem({ ...canvas, pedagio: 18.4, outros: 400 })!
    perto(conta.pedagioEOutros, 418.4)
    perto(conta.custo, 448.66)
    perto(conta.sobra, -68.66)
  })

  it('sem distância, consumo ou preço do diesel não há conta', () => {
    assert.equal(calcularViagem({ ...canvas, distanciaKm: null }), null)
    assert.equal(calcularViagem({ ...canvas, consumoKmL: 0 }), null)
    assert.equal(calcularViagem({ ...canvas, dieselLitro: Number.NaN }), null)
  })

  it('sem o valor do frete, o custo sai e a sobra fica em branco', () => {
    const conta = calcularViagem({ ...canvas, valor: null })!
    perto(conta.custo, 30.26)
    assert.equal(conta.sobra, null)
    assert.equal(conta.porKm, null)
  })

  it('custo extra negativo ou ilegível conta como zero, em vez de baratear a viagem', () => {
    perto(calcularViagem({ ...canvas, pedagio: -50, outros: Number.NaN })!.custo, 30.26)
  })
})
