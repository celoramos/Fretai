/** O que a calculadora do motorista recebe. Nulos e zeros de custo extra contam como zero. */
export interface Viagem {
  valor: number | null
  distanciaKm: number | null
  consumoKmL: number | null
  dieselLitro: number | null
  pedagio: number | null
  outros: number | null
  /** A volta sem carga dobra o diesel: o caminhão roda a distância duas vezes. */
  voltaVazio: boolean
}

export interface ContaViagem {
  diesel: number
  pedagioEOutros: number
  custo: number
  /** valor − custo. Negativa: a viagem dá prejuízo. Null sem o valor do frete. */
  sobra: number | null
  /** valor ÷ distância. Null sem o valor do frete. */
  porKm: number | null
}

const positivo = (n: number | null) => (n != null && Number.isFinite(n) && n > 0 ? n : null)

/**
 * A conta do caminhoneiro, feita no aparelho a cada tecla: diesel = distância × (volta vazio ? 2 : 1)
 * ÷ consumo × preço do litro. Sem distância, consumo ou diesel não há conta (null).
 */
export function calcularViagem(e: Viagem): ContaViagem | null {
  const km = positivo(e.distanciaKm)
  const consumo = positivo(e.consumoKmL)
  const litro = positivo(e.dieselLitro)
  if (km == null || consumo == null || litro == null) return null
  const diesel = (km * (e.voltaVazio ? 2 : 1)) / consumo * litro
  const pedagioEOutros = (positivo(e.pedagio) ?? 0) + (positivo(e.outros) ?? 0)
  const custo = diesel + pedagioEOutros
  const valor = positivo(e.valor)
  return { diesel, pedagioEOutros, custo, sobra: valor != null ? valor - custo : null, porKm: valor != null ? valor / km : null }
}
