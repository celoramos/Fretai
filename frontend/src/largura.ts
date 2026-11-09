import { useSyncExternalStore } from 'react'

/** O mesmo corte do CSS: a partir de 900px o layout é o de computador. */
const COMPUTADOR = '(min-width: 900px)'

function assinar(avisar: () => void) {
  const consulta = window.matchMedia(COMPUTADOR)
  consulta.addEventListener('change', avisar)
  return () => consulta.removeEventListener('change', avisar)
}

/** Só para o que o CSS não decide sozinho, como folha no celular e menu preso ao avatar no computador. */
export function useComputador() {
  return useSyncExternalStore(assinar, () => window.matchMedia(COMPUTADOR).matches)
}
