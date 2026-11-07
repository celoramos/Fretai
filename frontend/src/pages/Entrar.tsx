import { useRef, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ErroApi, MODO_DEMO } from '../api/cliente'
import type { Problema } from '../api/tipos'
import { useTitulo } from '../useTitulo'
import { Aviso } from '../components/ui'
import { useSessao } from '../sessao'

export function Entrar() {
  useTitulo('Entrar')
  const { tokens, entrar } = useSessao()
  const navegar = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(null)
  const campoEmail = useRef<HTMLInputElement>(null)
  const campoSenha = useRef<HTMLInputElement>(null)

  if (tokens) return <Navigate to="/" replace />

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setProblema(null)
    setEnviando(true)
    try {
      const t = await entrar(email.trim(), senha)
      navegar(t.papel === 'MOTORISTA' ? '/motorista' : '/empresa')
    } catch (erro) {
      const p = erro instanceof ErroApi ? erro.problema : { title: 'Erro', detail: String(erro), status: 0 }
      setProblema(p)
      // Primeiro campo com erro recebe o foco; sem erro por campo, volta para a senha.
      if (p.erros?.email) campoEmail.current?.focus()
      else campoSenha.current?.focus()
    } finally {
      setEnviando(false)
    }
  }

  const erroEmail = problema?.erros?.email
  const erroSenha = problema?.erros?.senha

  return (
    <main className="entrar">
      <section className="entrar__painel" aria-labelledby="entrar-titulo">
        <h1 id="entrar-titulo" className="entrar__titulo">Frete com pagamento garantido antes de carregar.</h1>
        <ol className="entrar__passos">
          <li><span className="entrar__km">km 0</span>A empresa paga por Pix no aceite. O dinheiro fica guardado.</li>
          <li><span className="entrar__km">saída</span>O adiantamento cai quando você sai com a carga.</li>
          <li><span className="entrar__km">entrega</span>O saldo cai com o canhoto: foto, assinatura e GPS no destino.</li>
        </ol>
      </section>

      <section className="entrar__form-area">
        <form className="formulario" onSubmit={enviar} noValidate aria-describedby={problema && !erroEmail && !erroSenha ? 'erro-login' : undefined}>
          <h2 className="formulario__titulo">Entrar</h2>

          <div className="campo">
            <label htmlFor="email" className="campo__rotulo">E-mail</label>
            <input
              ref={campoEmail} id="email" name="email" type="email" autoComplete="username" spellCheck={false}
              placeholder="voce@transportadora.com.br" value={email} onChange={(e) => setEmail(e.target.value)}
              aria-invalid={erroEmail ? true : undefined} aria-describedby={erroEmail ? 'email-erro' : undefined} className="campo__entrada"
            />
            {erroEmail && <p id="email-erro" className="campo__erro">{erroEmail}</p>}
          </div>

          <div className="campo">
            <label htmlFor="senha" className="campo__rotulo">Senha</label>
            <input
              ref={campoSenha} id="senha" name="senha" type="password" autoComplete="current-password"
              value={senha} onChange={(e) => setSenha(e.target.value)}
              aria-invalid={erroSenha ? true : undefined} aria-describedby={erroSenha ? 'senha-erro' : undefined} className="campo__entrada"
            />
            {erroSenha && <p id="senha-erro" className="campo__erro">{erroSenha}</p>}
          </div>

          <div aria-live="polite" id="erro-login">
            {problema && !erroEmail && !erroSenha && (
              <Aviso tom={problema.status === 429 ? 'alerta' : 'perigo'} titulo={problema.title}>{problema.detail}</Aviso>
            )}
          </div>

          <button type="submit" className="botao botao--primario botao--largo" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>

          {MODO_DEMO && (
            <div className="entrar__demo">
              <p>Demonstração: senha <code>demo123</code>.</p>
              <div className="entrar__demo-botoes">
                <button type="button" className="botao botao--secundario" onClick={() => { setEmail('motorista@demo.fretai'); setSenha('demo123') }}>
                  Preencher motorista
                </button>
                <button type="button" className="botao botao--secundario" onClick={() => { setEmail('empresa@demo.fretai'); setSenha('demo123') }}>
                  Preencher empresa
                </button>
              </div>
            </div>
          )}
        </form>
      </section>
    </main>
  )
}
