import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { api, ErroApi } from '../api/cliente'
import type { Frete, Problema } from '../api/tipos'
import { Aviso } from './ui'

/** A API só cancela antes da viagem começar (MaquinaEstadosFrete). */
const CANCELAVEL = ['PUBLICADO', 'PROPOSTA_ENVIADA', 'ACEITO']

/**
 * Cancelar não tem volta: o botão abre uma confirmação com o motivo, que fica no histórico do frete.
 * Quem pagou o Pix recebe o dinheiro de volta (a API estorna ao cancelar).
 */
export function CancelarFrete({ frete, pago, aoCancelar }: { frete: Frete; pago: boolean; aoCancelar: () => void }) {
  const [aberto, setAberto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(null)
  const campo = useRef<HTMLTextAreaElement>(null)
  const id = useId()
  // Abriu a confirmação: o foco vai para o motivo, que é o que falta preencher.
  useEffect(() => {
    if (aberto) campo.current?.focus()
  }, [aberto])

  if (!CANCELAVEL.includes(frete.status)) return null

  async function confirmar(e: FormEvent) {
    e.preventDefault()
    setProblema(null)
    if (!motivo.trim()) {
      setProblema({ title: 'Falta o motivo', detail: '', status: 400, erros: { motivo: 'Conte por que o frete foi cancelado.' } })
      campo.current?.focus()
      return
    }
    setEnviando(true)
    try {
      await api('POST', `/api/fretes/${frete.id}/cancelamento`, { motivo: motivo.trim() })
      aoCancelar()
    } catch (falha) {
      setProblema(falha instanceof ErroApi ? falha.problema : { title: 'Erro', detail: String(falha), status: 0 })
      setEnviando(false)
    }
  }

  if (!aberto) {
    return (
      <div className="cancelar">
        <button type="button" className="botao botao--fantasma cancelar__abrir" onClick={() => setAberto(true)}>Cancelar frete</button>
      </div>
    )
  }

  const erroMotivo = problema?.erros?.motivo
  return (
    <form className="cancelar cartao" onSubmit={confirmar} aria-labelledby={`${id}-titulo`} noValidate>
      <p id={`${id}-titulo`} className="cancelar__titulo">Cancelar este frete?</p>
      <p className="detalhe">
        Não dá para desfazer. O motivo fica no histórico{pago ? ' e o Pix já pago volta para quem pagou' : ''}.
      </p>
      <div className="campo">
        <label htmlFor={`${id}-motivo`} className="campo__rotulo">Motivo</label>
        <textarea ref={campo} id={`${id}-motivo`} className="campo__entrada campo__entrada--texto" rows={3} maxLength={500}
          value={motivo} onChange={(e) => setMotivo(e.target.value)}
          aria-invalid={erroMotivo ? true : undefined} aria-describedby={erroMotivo ? `${id}-erro` : undefined} />
        {erroMotivo && <p id={`${id}-erro`} className="campo__erro">{erroMotivo}</p>}
      </div>
      <div aria-live="polite">{problema && !erroMotivo && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}</div>
      <div className="cancelar__botoes">
        <button type="submit" className="botao botao--perigo" disabled={enviando}>{enviando ? 'Cancelando…' : 'Cancelar frete'}</button>
        <button type="button" className="botao botao--fantasma" disabled={enviando} onClick={() => { setAberto(false); setProblema(null) }}>Manter frete</button>
      </div>
    </form>
  )
}
