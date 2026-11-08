import { useState, type FormEvent } from 'react'
import { api, comoProblema } from '../api/cliente'
import type { Avaliacao, Problema } from '../api/tipos'
import { useRecurso } from '../api/useRecurso'
import { Aviso } from './ui'

const NOTAS = [1, 2, 3, 4, 5] as const
const SIGNIFICADO: Record<number, string> = { 1: 'Muito ruim', 2: 'Ruim', 3: 'Normal', 4: 'Bom', 5: 'Muito bom' }

/*
 * nomeAvaliado: como chamar quem é avaliado (o primeiro nome do motorista, o nome da empresa).
 * Avaliação depois da entrega. A reputação dos dois lados é o que dá confiança no próximo frete,
 * então a nota pede um toque só; o comentário é opcional. Quem já avaliou vê o que deu, sem editar
 * (a API aceita uma avaliação por lado).
 */
export function Avaliar({ freteId, lado, nomeAvaliado }: { freteId: string; lado: Avaliacao['lado']; nomeAvaliado: string }) {
  const [estado, recarregar] = useRecurso(() => api<Avaliacao[]>('GET', `/api/fretes/${freteId}/avaliacoes`), [freteId])
  const [nota, setNota] = useState<number | null>(null)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(null)

  if (estado.fase !== 'pronto') return null
  const minha = estado.dados.find((a) => a.lado === lado)

  if (minha) {
    return (
      <div className="avaliar avaliar--feita">
        <p className="avaliar__titulo">Sua avaliação de {nomeAvaliado}</p>
        <p className="avaliar__estrelas" aria-label={`${minha.nota} de 5: ${SIGNIFICADO[minha.nota]}`}>
          {NOTAS.map((n) => <span key={n} aria-hidden="true" className={n <= minha.nota ? 'estrela estrela--cheia' : 'estrela'}>★</span>)}
          <span className="avaliar__significado" aria-hidden="true">{SIGNIFICADO[minha.nota]}</span>
        </p>
        {minha.comentario && <p className="avaliar__comentario">“{minha.comentario}”</p>}
      </div>
    )
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setProblema(null)
    if (nota == null) {
      setProblema({ title: '', detail: '', status: 400, erros: { nota: 'Escolha de 1 a 5 estrelas.' } })
      return
    }
    setEnviando(true)
    try {
      await api('POST', `/api/fretes/${freteId}/avaliacoes`, { nota, comentario: comentario.trim() || null })
      recarregar()
    } catch (falha) {
      setProblema(comoProblema(falha))
    } finally {
      setEnviando(false)
    }
  }

  const erroNota = problema?.erros?.nota
  return (
    <form className="avaliar" onSubmit={enviar} noValidate>
      <fieldset className="avaliar__notas" aria-describedby={erroNota ? 'erro-nota' : undefined}>
        <legend className="avaliar__titulo">Como foi com {nomeAvaliado}?</legend>
        <div className="avaliar__estrelas">
          {NOTAS.map((n) => (
            <label key={n} className="avaliar__estrela">
              <input type="radio" name={`nota-${freteId}`} value={n} checked={nota === n} onChange={() => { setNota(n); setProblema(null) }} className="escolha__caixa"
                aria-label={`${n} de 5: ${SIGNIFICADO[n]}`} />
              <span aria-hidden="true" className={nota != null && n <= nota ? 'estrela estrela--cheia' : 'estrela'}>★</span>
            </label>
          ))}
          <span className="avaliar__significado" aria-hidden="true">{nota ? SIGNIFICADO[nota] : ''}</span>
        </div>
        {erroNota && <p id="erro-nota" className="campo__erro">{erroNota}</p>}
      </fieldset>
      <div className="campo">
        <label htmlFor={`comentario-${freteId}`} className="campo__rotulo">Comentário (opcional)</label>
        <textarea id={`comentario-${freteId}`} className="campo__entrada campo__entrada--texto" rows={2} maxLength={500} value={comentario}
          onChange={(e) => setComentario(e.target.value)} />
      </div>
      <div aria-live="polite">{problema && !erroNota && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}</div>
      <button type="submit" className="botao botao--primario" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar avaliação'}</button>
    </form>
  )
}
