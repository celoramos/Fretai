import { useEffect, useRef } from 'react'
import { useBlocker } from 'react-router-dom'

/*
 * Formulário preenchido não some por causa de um link no caminho. Duas saídas, duas perguntas:
 * fechar a aba ou recarregar cai no aviso do próprio navegador (beforeunload, que não aceita texto);
 * link do app, voltar do navegador ou "Cancelar" caem nesta caixa. <dialog> com showModal: o navegador
 * prende o foco dentro, deixa o resto da página inerte e fecha no Esc (platform fact).
 */
export function SairSemSalvar({ alterado }: { alterado: boolean }) {
  const bloqueio = useBlocker(({ currentLocation, nextLocation }) => alterado && currentLocation.pathname !== nextLocation.pathname)
  const caixa = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (!alterado) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [alterado])

  useEffect(() => {
    const d = caixa.current
    if (!d) return
    if (bloqueio.state === 'blocked' && !d.open) d.showModal()
    if (bloqueio.state !== 'blocked' && d.open) d.close()
  }, [bloqueio.state])

  // O botão seguro vem primeiro: é ele que recebe o foco quando a caixa abre.
  return (
    <dialog ref={caixa} className="sair" aria-labelledby="sair-titulo" aria-describedby="sair-texto"
      onCancel={(e) => { e.preventDefault(); bloqueio.reset?.() }}>
      <h2 id="sair-titulo" className="sair__titulo">Sair sem salvar?</h2>
      <p id="sair-texto" className="sair__texto">O que você preencheu neste formulário se perde.</p>
      <div className="sair__botoes">
        <button type="button" className="botao botao--primario" onClick={() => bloqueio.reset?.()}>Continuar preenchendo</button>
        <button type="button" className="botao botao--perigo" onClick={() => bloqueio.proceed?.()}>Sair sem salvar</button>
      </div>
    </dialog>
  )
}
