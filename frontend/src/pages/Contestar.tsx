import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, comoProblema, MODO_DEMO } from '../api/cliente'
import type { Problema } from '../api/tipos'
import { Marca } from '../components/Marca'
import { Aviso, Campo } from '../components/ui'
import { useTitulo } from '../useTitulo'

/** O alfabeto do código da API (CanhotoService): sem I, L, O, 0 e 1, que se confundem lidos no celular. */
const FORA_DO_CODIGO = /[^ABCDEFGHJKMNPQRSTUVWXYZ2-9]/g

/*
 * Quem recebeu a carga não tem conta no Fretaí. Se a entrega veio errada, ele contesta com o código de
 * 8 letras que chegou na mensagem do canhoto, dentro do prazo, e o saldo do motorista fica parado até
 * a análise. O link da mensagem pode trazer o código no endereço (?codigo=).
 */
export function Contestar() {
  useTitulo('Contestar entrega')
  const [params] = useSearchParams()
  const [codigo, setCodigo] = useState((params.get('codigo') ?? '').toUpperCase().replace(FORA_DO_CODIGO, '').slice(0, 8))
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(null)
  const [feito, setFeito] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setProblema(null)
    const erros: Record<string, string> = {}
    if (codigo.length !== 8) erros.codigo = 'O código tem 8 letras e números. Confira a mensagem da entrega.'
    if (!motivo.trim()) erros.motivo = 'Conte o que houve com a entrega.'
    if (Object.keys(erros).length) {
      setProblema({ title: '', detail: '', status: 400, erros })
      document.getElementById(erros.codigo ? 'codigo' : 'motivo')?.focus()
      return
    }
    setEnviando(true)
    try {
      await api('POST', '/api/canhotos/contestacao', { codigo, motivo: motivo.trim() })
      setFeito(true)
    } catch (falha) {
      setProblema(comoProblema(falha))
    } finally {
      setEnviando(false)
    }
  }

  const erro = (c: string) => problema?.erros?.[c]
  return (
    <div className="legal">
      <header className="legal__topo">
        <Link to="/" className="legal__marca" aria-label="Fretaí, página inicial"><Marca /></Link>
      </header>
      <main className="legal__texto contestar" id="conteudo">
        <h1>Contestar uma entrega</h1>
        {feito ? (
          <div className="cartao contestar__feito" aria-live="polite">
            <p className="contestar__titulo">Recebemos a contestação.</p>
            <p>O saldo do motorista fica parado até a análise do Fretaí.</p>
          </div>
        ) : (
          <>
            <p>
              Recebeu uma carga pelo Fretaí e algo veio errado? Use o código de 8 letras e números que chegou por WhatsApp na
              hora da entrega. A contestação vale dentro do prazo depois da entrega, e o saldo do motorista fica parado até a análise.
            </p>
            <form className="cartao contestar__form" onSubmit={enviar} noValidate>
              <Campo id="codigo" rotulo="Código da entrega" erro={erro('codigo')}>
                <input id="codigo" className="campo__entrada contestar__codigo" maxLength={8} autoComplete="one-time-code" autoCapitalize="characters"
                  spellCheck={false} value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(FORA_DO_CODIGO, '').slice(0, 8))}
                  placeholder="K7M2P9QA" aria-invalid={erro('codigo') ? true : undefined} aria-describedby={erro('codigo') ? 'codigo-erro' : undefined} />
              </Campo>
              <Campo id="motivo" rotulo="O que houve" erro={erro('motivo')}>
                <textarea id="motivo" className="campo__entrada campo__entrada--texto" rows={4} maxLength={500} value={motivo}
                  onChange={(e) => setMotivo(e.target.value)} placeholder="Faltaram 2 paletes e uma caixa chegou amassada."
                  aria-invalid={erro('motivo') ? true : undefined} aria-describedby={erro('motivo') ? 'motivo-erro' : undefined} />
              </Campo>
              <div aria-live="polite">{problema && !problema.erros && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}</div>
              <button type="submit" className="botao botao--primario" disabled={enviando}>{enviando ? 'Enviando…' : 'Contestar entrega'}</button>
            </form>
            {/* O mesmo código de api/demo.ts, que só existe na demonstração. */}
            {MODO_DEMO && <p className="detalhe">Na demonstração, o código é ENTREGA8.</p>}
          </>
        )}
      </main>
      <footer className="legal__rodape">
        <Link to="/privacidade">Privacidade</Link>
        <Link to="/termos">Termos de uso</Link>
        <Link to="/">Início</Link>
      </footer>
    </div>
  )
}
