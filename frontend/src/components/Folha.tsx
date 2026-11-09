import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Folha que sobe de baixo no celular e fica no meio da tela a partir de 900px. É um <dialog> aberto
 * com showModal(): o foco fica preso dentro, Esc fecha e o navegador devolve o foco a quem abriu.
 * Um toque no véu, fora da folha, também fecha.
 */
export function Folha({ aberta, rotulo, aoFechar, children }: { aberta: boolean; rotulo: string; aoFechar: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (aberta && !d.open) d.showModal()
    if (!aberta && d.open) d.close()
  }, [aberta])

  return (
    <dialog ref={ref} className="folha" aria-label={rotulo} onClose={aoFechar} onClick={(e) => { if (e.target === e.currentTarget) aoFechar() }}>
      <div className="folha__corpo">{children}</div>
    </dialog>
  )
}

/** O X do canto da folha. */
export function FecharFolha({ aoFechar }: { aoFechar: () => void }) {
  return (
    <button type="button" className="botao botao--fantasma botao--icone folha__fechar" aria-label="Fechar" onClick={aoFechar}>
      <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
        <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  )
}
