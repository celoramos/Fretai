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

/**
 * Como cada ponta é dita. cidade: a cidade em destaque e a UF embaixo (frete de empresa, entre cidades).
 * bairro: só o bairro (frete de pessoa física, dentro da cidade). bairro-cidade: "Pituba, Salvador".
 * Sem bairro (o motorista que não fechou só recebe bairro e cidade), cai para a cidade.
 */
export type Pontas = 'cidade' | 'bairro' | 'bairro-cidade'

export const nomeDaPonta = (e: Endereco, pontas: Pontas) =>
  pontas === 'cidade' || !e.bairro ? e.cidade : pontas === 'bairro' ? e.bairro : `${e.bairro}, ${e.cidade}`
