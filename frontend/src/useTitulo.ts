import { useEffect } from 'react'

/** Título por rota: o específico primeiro, a marca depois. */
export function useTitulo(titulo: string) {
  useEffect(() => {
    document.title = `${titulo} · Fretaí`
  }, [titulo])
}
