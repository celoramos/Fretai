import type { CategoriaVeiculo, Frete, Veiculo } from './api/tipos'
import { CATEGORIAS, TIPOS_CARGA, levaCategoria, veiculo } from './formato'

/** O tamanho que o frete de pessoa física pede, como o canvas escreve no cartão. */
export const EXIGE: Record<CategoriaVeiculo, string> = {
  UTILITARIO: 'Utilitário ou maior',
  VAN: 'Van ou caminhão',
  CAMINHAO: 'Só caminhão',
}

/**
 * Por que este veículo não leva este frete; null quando leva. Frete de pessoa física: o tamanho
 * (CategoriaVeiculo.leva da API). Frete de empresa: tipo, carroceria e rastreador, como a API confere.
 */
export function porQueNaoLeva(frete: Frete, v: Veiculo): string | null {
  if (frete.cliente) {
    return levaCategoria(v.categoria, frete.categoriaVeiculo) ? null : `sua ${CATEGORIAS[v.categoria].nome.split(' ')[0].toLowerCase()} não leva esse frete`
  }
  if (frete.veiculosAceitos.length && (!v.tipo || !frete.veiculosAceitos.includes(v.tipo))) return 'tipo não aceito'
  if (frete.carroceriasAceitas.length && (!v.carroceria || !frete.carroceriasAceitas.includes(v.carroceria))) return 'carroceria não aceita'
  if (frete.exigeRastreador && !v.rastreador) return 'sem rastreador'
  return null
}

/** null quando algum veículo do motorista leva o frete (ou quando ainda não se sabe quais ele tem). */
export function motivoDeNenhumLevar(frete: Frete, veiculos: Veiculo[] | null): string | null {
  if (!veiculos || veiculos.length === 0) return null
  const motivos = veiculos.map((v) => porQueNaoLeva(frete, v))
  return motivos.includes(null) ? null : motivos[0]
}

/** O nome do frete no cartão: o começo da descrição ("Mudança de 1 quarto"); sem ela, o tipo de carga. */
export function tituloDoFrete(f: Frete) {
  const inicio = f.descricaoCarga?.split(/[.:]/)[0].trim()
  if (inicio) return inicio
  return f.tipoCarga ? TIPOS_CARGA[f.tipoCarga] : 'Frete'
}

/** O veículo que o frete pede, numa linha: o tamanho (pessoa física) ou os tipos aceitos (empresa). */
export function exigenciaDoFrete(f: Frete) {
  if (f.cliente) return f.categoriaVeiculo ? EXIGE[f.categoriaVeiculo] : 'Qualquer veículo'
  return f.veiculosAceitos.map(veiculo).join(', ') || 'Qualquer veículo'
}
