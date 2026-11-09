import type { Endereco, EnderecoPedido } from './api/tipos'

/** Uma ponta do frete (coleta ou entrega) do jeito que se digita: o resto do endereço sai do CEP, na API. */
export type Ponta = { cep: string; numero: string; complemento: string; pontoReferencia: string }
export const PONTA_VAZIA: Ponta = { cep: '', numero: '', complemento: '', pontoReferencia: '' }

export const pontaDe = (e: Endereco): Ponta => ({ cep: e.cep ?? '', numero: e.numero ?? '', complemento: e.complemento ?? '', pontoReferencia: e.pontoReferencia ?? '' })

export const enderecoDe = (p: Ponta): EnderecoPedido => ({
  cep: p.cep.trim(),
  numero: p.numero.trim() || null,
  complemento: p.complemento.trim() || null,
  pontoReferencia: p.pontoReferencia.trim() || null,
})
