import type { Transition, Variants } from 'motion/react'

/*
 * Movimento do Fretaí. Platform fact: o Motion recebe durações e curvas em JS, não lê var(--...).
 * Por isso os números abaixo espelham tokens.css (--dur-media, --dur-rota, --curva);
 * mudar lá exige mudar aqui.
 *
 * Regra: movimento só onde ele conta algo. A pista "abre" da origem ao destino (a assinatura),
 * o indicador do que está escolhido desliza até a nova escolha, listas chegam em ordem e o
 * medidor enche na ordem do dinheiro. Nada pisca, nada fica em loop, número não "conta".
 */
export const DUR_MEDIA = 0.25
export const DUR_ROTA = 0.6
export const CURVA = [0.2, 0, 0, 1] as const

export const transicao: Transition = { duration: DUR_MEDIA, ease: CURVA }

/** Lista: cada item entra 40 ms depois do anterior. Com 10 itens o último chega em 0,6 s, o tempo da rota. */
export const lista: Variants = {
  oculta: {},
  visivel: { transition: { staggerChildren: 0.04 } },
}
export const item: Variants = {
  oculta: { opacity: 0, y: 8 },
  visivel: { opacity: 1, y: 0, transition: transicao },
}
