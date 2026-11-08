import { motion } from 'motion/react'
import { DUR_MEDIA, transicao } from '../movimento'
import type { Pagamento, Preco } from '../api/tipos'
import { reais, reaisCentavos, STATUS_PAGAMENTO } from '../formato'

/** Valor em destaque: "R$" menor e mais claro que o número (briefing, seção 4). Centavos só onde a conta
 *  tem de fechar com as linhas de baixo (extrato); no resto o valor redondo lê mais rápido. */
export function Valor({ valor, tamanho = 'normal', centavos = false }: { valor: number; tamanho?: 'normal' | 'grande'; centavos?: boolean }) {
  return (
    <span className={`valor valor--${tamanho}`}>
      <span className="valor__moeda">R$</span>
      {centavos ? reaisCentavos(valor) : reais(valor)}
    </span>
  )
}

/** O selo só existe quando há dinheiro retido ou liberado. Verde nunca é decorativo. */
export function SeloGarantido() {
  return (
    <span className="selo">Pagamento garantido</span>
  )
}

export function ChipPiso({ preco, valor }: { preco: Preco | null; valor: number | null }) {
  if (!preco?.pisoMinimo) return null
  const abaixo = valor != null && preco.abaixoDoPiso
  return (
    <span className={abaixo ? 'chip-piso chip-piso--abaixo' : 'chip-piso'} title={preco.coeficientesDeExemplo ? 'Calculado com coeficientes de exemplo, não com a tabela vigente.' : undefined}>
      {abaixo ? 'Abaixo do piso ANTT ' : 'Piso ANTT '}
      <span className="chip-piso__valor">R$&nbsp;{reais(preco.pisoMinimo)}</span>
      {preco.coeficientesDeExemplo && <span className="chip-piso__exemplo">exemplo</span>}
    </span>
  )
}

/**
 * Medidor de garantia em 3 trechos: Retido, Adiantamento, Saldo. Cada trecho fica verde quando
 * aquele dinheiro passa a existir ou é pago; o trecho do saldo fica laranja se a entrega foi contestada.
 */
export function MedidorGarantia({ pagamento }: { pagamento: Pagamento | null }) {
  const s = pagamento?.status
  const cheio = !s || s === 'PENDENTE' || s === 'ESTORNADO' ? 0 : s === 'RETIDO' ? 1 : s === 'ADIANTAMENTO_LIBERADO' ? 2 : 3
  const trechos = [
    { nome: 'Retido', valor: pagamento?.valorTotal },
    { nome: 'Adiantamento', valor: pagamento?.valorAdiantamento },
    { nome: 'Saldo', valor: pagamento?.valorSaldo },
  ]
  const legenda = !pagamento
    ? 'Cobrança ainda não gerada'
    : pagamento.saldoBloqueado
      ? 'Entrega contestada, saldo em análise'
      : STATUS_PAGAMENTO[pagamento.status]

  return (
    <figure className="medidor" aria-label={`Garantia do pagamento: ${legenda}`}>
      <figcaption className={`medidor__legenda medidor__legenda--${cheio > 0 ? 'garantido' : s === 'ESTORNADO' ? 'neutro' : 'pendente'}`}>
        {legenda}
      </figcaption>
      <ol className="medidor__trechos">
        {trechos.map((t, i) => {
          const bloqueado = i === 2 && pagamento?.saldoBloqueado
          const estado = bloqueado ? 'bloqueado' : i < cheio ? 'cheio' : 'vazio'
          return (
            <li key={t.nome} className={`medidor__trecho medidor__trecho--${estado}`}>
              <span className="medidor__barra">
                {estado !== 'vazio' && (
                  <motion.span className="medidor__enchimento" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ ...transicao, delay: i * DUR_MEDIA }} />
                )}
              </span>
              <span className="medidor__nome">{t.nome}</span>
              {t.valor != null && <span className="medidor__valor">R$&nbsp;{reais(t.valor)}</span>}
            </li>
          )
        })}
      </ol>
    </figure>
  )
}
