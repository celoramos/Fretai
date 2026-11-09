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
 * Como cada ponta é dita. cidade: a cidade em destaque e a UF embaixo (frete de empresa, entre cidades).
 * bairro: só o bairro (frete de pessoa física, dentro da cidade). bairro-cidade: "Pituba, Salvador".
 * Sem bairro (o motorista que não fechou só recebe bairro e cidade), cai para a cidade.
 */
type Pontas = 'cidade' | 'bairro' | 'bairro-cidade'

export const nomeDaPonta = (e: Endereco, pontas: Pontas) =>
  pontas === 'cidade' || !e.bairro ? e.cidade : pontas === 'bairro' ? e.bairro : `${e.bairro}, ${e.cidade}`

/**
 * A assinatura do Fretaí: origem e destino ligados por uma faixa de asfalto com tracejado amarelo,
 * a distância pintada no meio como num marco. Aparece em todo frete, e em nenhum outro lugar.
 * empilhada: os nomes numa linha e a pista inteira embaixo, como nos cartões do canvas.
 */
export function RotaLinha({
  coleta,
  entrega,
  distanciaKm,
  estimada,
  grande = false,
  pontas = 'cidade',
  empilhada = false,
}: {
  coleta: Endereco
  entrega: Endereco
  distanciaKm: number | null
  estimada?: boolean | null
  grande?: boolean
  pontas?: Pontas
  empilhada?: boolean
}) {
  const reduzido = useReducedMotion()
  const classe = ['rota', grande && 'rota--grande', empilhada && 'rota--empilhada', pontas !== 'cidade' && 'rota--leve'].filter(Boolean).join(' ')
  return (
    <motion.div className={classe} initial={reduzido ? false : 'fechada'} whileInView="aberta" viewport={{ once: true, amount: 0.8 }}>
      <div className="rota__ponta rota__ponta--origem" aria-hidden="true">
        <PontaTexto endereco={coleta} pontas={pontas} />
      </div>
      <motion.div className="rota__pista" aria-hidden="true" variants={pista}>
        {distanciaKm != null && (
          <motion.span className="rota__marco" variants={marco}>
            {estimada ? '≈ ' : ''}
            {quilometros(distanciaKm)}
          </motion.span>
        )}
      </motion.div>
      <motion.div variants={destino} className="rota__ponta rota__ponta--destino" aria-hidden="true">
        <PontaTexto endereco={entrega} pontas={pontas} />
      </motion.div>
      <span className="visualmente-oculto">
        De {nomeDaPonta(coleta, pontas === 'cidade' ? 'cidade' : 'bairro-cidade')} para {nomeDaPonta(entrega, pontas === 'cidade' ? 'cidade' : 'bairro-cidade')}
        {distanciaKm != null ? `, ${estimada ? 'cerca de ' : ''}${quilometros(distanciaKm)}` : ''}
      </span>
    </motion.div>
  )
}

function PontaTexto({ endereco, pontas }: { endereco: Endereco; pontas: Pontas }) {
  if (pontas !== 'cidade') return <span className="rota__lugar">{nomeDaPonta(endereco, pontas)}</span>
  return (
    <>
      <span className="rota__cidade">{endereco.cidade}</span>
      <span className="rota__uf">{endereco.uf}</span>
    </>
  )
}
