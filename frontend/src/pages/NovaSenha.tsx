import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, comoProblema } from '../api/cliente'
import type { Problema } from '../api/tipos'
import { Marca } from '../components/Marca'
import { Aviso } from '../components/ui'
import { useTitulo } from '../useTitulo'

const LINK_INVALIDO = 'Este link não vale mais. Peça outro na tela de entrar.'

/**
 * Senha nova, pelo link de "Esqueci a senha" (não está no canvas; segue a tela Entrar). O token vem na
 * URL e vale uma vez, por uma hora. Deu certo, a pessoa volta para entrar com a senha nova.
 */
export function NovaSenha() {
  useTitulo('Senha nova')
  const [params] = useSearchParams()
  const token = params.get('token')
  const navegar = useNavigate()
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(token ? null : { title: 'Link incompleto', detail: LINK_INVALIDO, status: 422 })
  const campo = useRef<HTMLInputElement>(null)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setProblema(null)
    if (senha.length < 8 || senha.length > 72) {
      setProblema({ title: 'Dados inválidos', detail: '', status: 400, erros: { senha: 'A senha deve ter entre 8 e 72 caracteres.' } })
      campo.current?.focus()
      return
    }
    setEnviando(true)
    try {
      await api('POST', '/api/auth/senha/nova', { token, senha })
      navegar('/entrar', { replace: true, state: { aviso: 'Senha nova salva. Entre com ela.' } })
    } catch (erro) {
      const p = comoProblema(erro)
      setProblema(p)
      if (p.erros?.senha) campo.current?.focus()
    } finally {
      setEnviando(false)
    }
  }

  const erroSenha = problema?.erros?.senha
  const linkMorto = problema != null && !erroSenha && (problema.status === 422 || !token)

  return (
    <main className="entrar entrar--so-form">
      <div className="entrar__coluna">
        <Link to="/" className="entrar__marca" aria-label="Fretaí, página inicial"><Marca /></Link>
        <form className="formulario" onSubmit={salvar} noValidate>
          <div className="entrar__cabeca">
            <h1 className="entrar__h1">Senha nova</h1>
            <p className="entrar__sub">Crie a senha que você vai usar para entrar.</p>
          </div>

          {linkMorto ? (
            <Aviso tom="perigo" titulo="Este link não vale mais." acao={<Link to="/entrar" className="botao botao--secundario">Pedir outro link</Link>}>
              Os links valem uma hora e uma vez só. Na tela de entrar, digite o seu e-mail e toque em Esqueci a senha.
            </Aviso>
          ) : (
            <>
              <div className="campo">
                <label htmlFor="senha-nova" className="campo__rotulo">Senha nova</label>
                <input
                  ref={campo} id="senha-nova" type="password" autoComplete="new-password" value={senha}
                  onChange={(e) => setSenha(e.target.value)} className="campo__entrada"
                  aria-invalid={erroSenha ? true : undefined} aria-describedby={erroSenha ? 'senha-nova-erro' : 'senha-nova-ajuda'}
                />
                {erroSenha
                  ? <p id="senha-nova-erro" className="campo__erro">{erroSenha}</p>
                  : <p id="senha-nova-ajuda" className="campo__ajuda">De 8 a 72 caracteres.</p>}
              </div>
              <div aria-live="polite">
                {problema && !erroSenha && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}
              </div>
              <button type="submit" className="botao botao--primario botao--largo" disabled={enviando}>
                {enviando ? 'Salvando…' : 'Salvar senha nova'}
              </button>
            </>
          )}
        </form>
      </div>
    </main>
  )
}
