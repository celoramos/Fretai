import { useCallback, useEffect, useState } from 'react'
import { ErroApi } from './cliente'
import type { Problema } from './tipos'

export type Recurso<T> =
  | { fase: 'carregando'; mostrarEsqueleto: boolean }
  | { fase: 'erro'; problema: Problema }
  | { fase: 'pronto'; dados: T }

/**
 * Carrega um recurso e expõe os estados que a tela precisa desenhar.
 * O esqueleto só aparece depois de 200 ms: abaixo disso ele pisca e piora a espera.
 */
export function useRecurso<T>(buscar: () => Promise<T>, deps: unknown[]) {
  const [estado, setEstado] = useState<Recurso<T>>({ fase: 'carregando', mostrarEsqueleto: false })
  const [versao, setVersao] = useState(0)
  const recarregar = useCallback(() => setVersao((v) => v + 1), [])

  useEffect(() => {
    let vivo = true
    setEstado({ fase: 'carregando', mostrarEsqueleto: false })
    const atraso = setTimeout(() => vivo && setEstado((e) => (e.fase === 'carregando' ? { ...e, mostrarEsqueleto: true } : e)), 200)
    buscar()
      .then((dados) => vivo && setEstado({ fase: 'pronto', dados }))
      .catch((e: unknown) => {
        if (!vivo) return
        const problema = e instanceof ErroApi ? e.problema : { title: 'Erro inesperado', detail: String(e), status: 0 }
        setEstado({ fase: 'erro', problema })
      })
      .finally(() => clearTimeout(atraso))
    return () => {
      vivo = false
      clearTimeout(atraso)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, versao])

  return [estado, recarregar] as const
}

/** Para recursos que podem não existir ainda (ex.: cobrança antes do aceite): 404 vira null. */
export async function ouNulo<T>(promessa: Promise<T>): Promise<T | null> {
  try {
    return await promessa
  } catch (e) {
    if (e instanceof ErroApi && e.problema.status === 404) return null
    throw e
  }
}
