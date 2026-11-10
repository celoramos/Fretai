import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { linkWhatsApp } from '../src/whatsapp.ts'

describe('link do WhatsApp para o outro lado do frete', () => {
  it('qualquer formato do mesmo telefone vira o mesmo link', () => {
    for (const telefone of ['(71) 98877-1234', '+55 71 98877-1234', '71988771234', '5571988771234', '55 (71) 98877-1234']) {
      assert.equal(linkWhatsApp(telefone), 'https://wa.me/5571988771234', telefone)
    }
  })

  it('fixo de 10 dígitos também ganha o 55', () => {
    assert.equal(linkWhatsApp('(19) 3210-4400'), 'https://wa.me/551932104400')
  })

  it('DDD 55 (Rio Grande do Sul) não é confundido com o código do país', () => {
    assert.equal(linkWhatsApp('(55) 99988-7766'), 'https://wa.me/5555999887766')
    assert.equal(linkWhatsApp('+55 55 99988-7766'), 'https://wa.me/5555999887766')
  })

  it('a mensagem pronta vai codificada no endereço', () => {
    assert.equal(
      linkWhatsApp('71988771234', 'Olá, aqui é Paula, do frete Pituba → Vilas do Atlântico.'),
      'https://wa.me/5571988771234?text=Ol%C3%A1%2C%20aqui%20%C3%A9%20Paula%2C%20do%20frete%20Pituba%20%E2%86%92%20Vilas%20do%20Atl%C3%A2ntico.',
    )
  })
})
