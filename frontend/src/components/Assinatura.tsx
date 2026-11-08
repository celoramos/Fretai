import { useEffect, useRef, type RefObject } from 'react'

/**
 * Quem recebeu a carga assina com o dedo, na tela do motorista. O desenho vira o PNG do canhoto.
 * Papel, tinta e espessura do traço vêm de tokens.css (--cor-papel, --cor-tinta, --traco-assinatura).
 * Accepted cost: assinatura não tem caminho por teclado; quem não usa o toque precisa de ajuda de
 * outra pessoa para assinar.
 */
export function Assinatura({ tela, aoMudar, rotulo }: { tela: RefObject<HTMLCanvasElement | null>; aoMudar: (temTraco: boolean) => void; rotulo: string }) {
  const desenhando = useRef(false)
  const temTraco = useRef(false)

  // Pinta o papel e prepara a caneta. Platform fact: o canvas mede em pixels do aparelho, então o
  // tamanho em CSS é multiplicado pela densidade da tela para o traço não sair borrado.
  function preparar(forcar = false) {
    const canvas = tela.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || (temTraco.current && !forcar)) return
    const escala = window.devicePixelRatio || 1
    canvas.width = Math.round(canvas.clientWidth * escala)
    canvas.height = Math.round(canvas.clientHeight * escala)
    const estilo = getComputedStyle(canvas)
    ctx.setTransform(escala, 0, 0, escala, 0, 0)
    ctx.fillStyle = estilo.getPropertyValue('--cor-papel').trim()
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    ctx.strokeStyle = estilo.getPropertyValue('--cor-tinta').trim()
    ctx.lineWidth = parseFloat(estilo.getPropertyValue('--traco-assinatura'))
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }

  useEffect(() => {
    preparar()
    // Girar o celular redimensiona o papel só enquanto ele está em branco: não apaga uma assinatura feita.
    const aoRedimensionar = () => preparar()
    window.addEventListener('resize', aoRedimensionar)
    return () => window.removeEventListener('resize', aoRedimensionar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ponto = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  return (
    <div className="assinatura">
      <canvas
        ref={tela}
        className="assinatura__papel"
        role="img"
        aria-label={rotulo}
        onPointerDown={(e) => {
          const ctx = e.currentTarget.getContext('2d')
          if (!ctx) return
          // O traço continua mesmo se o dedo sair do quadro. Platform fact: alguns navegadores recusam a captura
          // de um ponteiro que já terminou; sem ela o traço só para na borda.
          try {
            e.currentTarget.setPointerCapture(e.pointerId)
          } catch {
            /* segue sem captura */
          }
          desenhando.current = true
          const { x, y } = ponto(e)
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x, y + 0.01)
          ctx.stroke()
        }}
        onPointerMove={(e) => {
          if (!desenhando.current) return
          const ctx = e.currentTarget.getContext('2d')
          if (!ctx) return
          const { x, y } = ponto(e)
          ctx.lineTo(x, y)
          ctx.stroke()
        }}
        onPointerUp={() => {
          if (!desenhando.current) return
          desenhando.current = false
          if (!temTraco.current) {
            temTraco.current = true
            aoMudar(true)
          }
        }}
        onPointerCancel={() => {
          desenhando.current = false
        }}
      />
      <button
        type="button"
        className="botao botao--fantasma assinatura__limpar"
        onClick={() => {
          temTraco.current = false
          preparar(true)
          aoMudar(false)
        }}
      >
        Limpar
      </button>
    </div>
  )
}
