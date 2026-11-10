import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { contar, faixaDoPeso, iniciais, lerReais, telefone } from '../src/formato.ts'

describe('contar: o número com a palavra no singular ou no plural', () => {
  it('um é singular: "1 frete", nunca "1 fretes"', () => {
    assert.equal(contar(1, 'frete', 'fretes'), '1 frete')
    assert.equal(contar(1, 'frete concluído', 'fretes concluídos'), '1 frete concluído')
  })

  it('zero e dois em diante são plural', () => {
    assert.equal(contar(0, 'frete', 'fretes'), '0 fretes')
    assert.equal(contar(2, 'frete', 'fretes'), '2 fretes')
    assert.equal(contar(132, 'frete', 'fretes'), '132 fretes')
  })
})

describe('telefone: os dígitos que a API guarda, de volta com o DDD entre parênteses', () => {
  it('celular de 11 dígitos e fixo de 10', () => {
    assert.equal(telefone('71988771234'), '(71) 98877-1234')
    assert.equal(telefone('1932104400'), '(19) 3210-4400')
  })

  it('tira o 55 da frente e aceita o que já veio com máscara', () => {
    assert.equal(telefone('5571988771234'), '(71) 98877-1234')
    assert.equal(telefone('+55 (71) 98877-1234'), '(71) 98877-1234')
  })

  it('o que não é telefone volta como veio, em vez de sair pela metade', () => {
    assert.equal(telefone('12345'), '12345')
    assert.equal(telefone(''), '')
  })
})

describe('iniciais do avatar', () => {
  it('primeiro e último nome; um nome só vira uma letra; vazio fica vazio', () => {
    assert.equal(iniciais('Juliana Matos'), 'JM')
    assert.equal(iniciais('João Batista Ferreira'), 'JF')
    assert.equal(iniciais('  paula  '), 'P')
    assert.equal(iniciais(null), '')
  })
})

describe('lerReais: número digitado do jeito brasileiro', () => {
  it('ponto de milhar, vírgula decimal e o R$ na frente', () => {
    assert.equal(lerReais('4.850'), 4850)
    assert.equal(lerReais('4850,50'), 4850.5)
    assert.equal(lerReais('R$ 27.000'), 27000)
    assert.equal(lerReais('1.234.567,89'), 1234567.89)
  })

  it('vazio não é zero: é ilegível', () => {
    assert.ok(Number.isNaN(lerReais('')))
    assert.ok(Number.isNaN(lerReais('   ')))
  })
})

describe('faixaDoPeso: o peso do pedido dito como a faixa escolhida', () => {
  it('o limite de cima pertence à faixa', () => {
    assert.equal(faixaDoPeso(200), 'Até 200 kg')
    assert.equal(faixaDoPeso(201), 'De 200 a 700 kg')
    assert.equal(faixaDoPeso(700), 'De 200 a 700 kg')
    assert.equal(faixaDoPeso(1500), 'De 700 kg a 1,5 t')
  })

  it('acima de 1,5 t, o peso em toneladas', () => {
    assert.equal(faixaDoPeso(2500), '2,5 t')
    assert.equal(faixaDoPeso(27000), '27 t')
  })
})
