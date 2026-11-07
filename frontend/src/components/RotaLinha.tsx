import { motion, useReducedMotion, type Variants } from 'motion/react'
import type { Endereco } from '../api/tipos'
import { quilometros } from '../formato'
import { CURVA, DUR_MEDIA, DUR_ROTA } from '../movimento'

/*
 * A pista abre da origem para o destino, como estrada sendo percorrida; o km aparece quando a pista
 * passa do meio, e o destino quando ela chega. Uma vez por aparição (whileInView com once), nunca em loop.
 * Com movimento reduzido a rota já nasce aberta: o reducedMotion do Motion corta transform, não clip-path.
 */
const pista: Variants = {
  fechada: { clipPath: 'inset(0 100% 0 0)' },
  aberta: { clipPath: 'inset(0 0% 0 0)', transition: { duration: DUR_ROTA, ease: CURVA } },
}
const marco: Variants = {
  fechada: { opacity: 0 },
  aberta: { opacity: 1, transition: { duration: DUR_MEDIA, ease: CURVA, delay: DUR_ROTA / 2 } },
}
const destino: Variants = {
  fechada: { opacity: 0 },
  aberta: { opacity: 1, transition: { duration: DUR_MEDIA, ease: CURVA, delay: DUR_ROTA * 0.75 } },
}

/**
 * A assinatura do Fretaí: origem e destino ligados por uma faixa de asfalto com tracejado amarelo,
 * a distância pintada no meio como num marco. Aparece em todo frete, e em nenhum outro lugar.
 */
export function RotaLinha({
  coleta,
  entrega,
  distanciaKm,
  estimada,
  grande = false,
}: {
  coleta: Endereco
  entrega: Endereco
  distanciaKm: number | null
  estimada?: boolean | null
  grande?: boolean
}) {
  const reduzido = useReducedMotion()
  return (
    <motion.div className={grande ? 'rota rota--grande' : 'rota'} initial={reduzido ? false : 'fechada'} whileInView="aberta" viewport={{ once: true, amount: 0.8 }}>
      <Ponta endereco={coleta} lado="origem" />
      <motion.div className="rota__pista" aria-hidden="true" variants={pista}>
        {distanciaKm != null && (
          <motion.span className="rota__marco" variants={marco}>
            {estimada ? '≈ ' : ''}
            {quilometros(distanciaKm)}
          </motion.span>
        )}
      </motion.div>
      <motion.div variants={destino} className="rota__ponta rota__ponta--destino" aria-hidden="true">
        <PontaTexto endereco={entrega} />
      </motion.div>
      <span className="visualmente-oculto">
        De {coleta.cidade}/{coleta.uf} para {entrega.cidade}/{entrega.uf}
        {distanciaKm != null ? `, ${estimada ? 'cerca de ' : ''}${quilometros(distanciaKm)}` : ''}
      </span>
    </motion.div>
  )
}

function Ponta({ endereco, lado }: { endereco: Endereco; lado: 'origem' | 'destino' }) {
  return (
    <div className={`rota__ponta rota__ponta--${lado}`} aria-hidden="true">
      <PontaTexto endereco={endereco} />
    </div>
  )
}

function PontaTexto({ endereco }: { endereco: Endereco }) {
  return (
    <>
      <span className="rota__cidade">{endereco.cidade}</span>
      <span className="rota__uf">{endereco.uf}</span>
    </>
  )
}
