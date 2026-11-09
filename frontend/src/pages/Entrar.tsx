import { motion, useReducedMotion, type Variants } from 'motion/react'
import { CURVA, DUR_ROTA, item } from '../movimento'
import { useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ErroApi, MODO_DEMO } from '../api/cliente'
import type { Problema } from '../api/tipos'
import { useTitulo } from '../useTitulo'
import { Aviso } from '../components/ui'
import { BotaoGoogle } from '../components/BotaoGoogle'
import { GOOGLE_DISPONIVEL } from '../google'
import { Marca } from '../components/Marca'
import { useSessao } from '../sessao'

/* A pista do login desce no tempo da rota, e cada etapa aparece quando a pista chega nela. */
const passos: Variants = {
  oculta: { '--trajeto': '100%' },
  visivel: { '--trajeto': '0%', transition: { duration: DUR_ROTA, ease: CURVA, delayChildren: DUR_ROTA / 4, staggerChildren: DUR_ROTA / 4 } },
}

export function Entrar() {
  const reduzido = useReducedMotion()
  useTitulo('Entrar')
  const { tokens, entrar, entrarComGoogle } = useSessao()
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

  /* Google: com conta, entra; sem conta, vai para o cadastro já com e-mail e nome do Google. */
  async function comGoogle(credencial: string) {
    setProblema(null)
    setEnviando(true)
    try {
      const t = await entrarComGoogle(credencial)
      navegar(t.papel === 'MOTORISTA' ? '/motorista' : '/empresa')
    } catch (erro) {
      const p = erro instanceof ErroApi ? erro.problema : { title: 'Erro', detail: String(erro), status: 0 }
      if (p.codigo === 'CADASTRO_NECESSARIO') {
        navegar('/cadastro', { state: { google: { credencial, email: p.email, nome: p.nome } } })
        return
      }
      setProblema(p)
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
        {/* --trajeto: quanto da pista ainda está coberto. O Motion leva de 100% a 0%, de cima para baixo. */}
        <motion.ol className="entrar__passos" variants={passos} initial={reduzido ? false : 'oculta'} animate="visivel">
          <motion.li variants={item}><span className="entrar__km">km 0</span>A empresa paga por Pix no aceite. O dinheiro fica guardado.</motion.li>
          <motion.li variants={item}><span className="entrar__km">saída</span>O adiantamento cai quando você sai com a carga.</motion.li>
          <motion.li variants={item}><span className="entrar__km">entrega</span>O saldo cai com o canhoto: foto, assinatura e GPS no destino.</motion.li>
        </motion.ol>
      </section>

      <section className="entrar__form-area">
        <form className="formulario" onSubmit={enviar} noValidate aria-describedby={problema && !erroEmail && !erroSenha ? 'erro-login' : undefined}>
          <Link to="/" className="entrar__marca" aria-label="Fretaí, página inicial"><Marca /></Link>
          <h2 className="formulario__titulo">Entrar</h2>
          {GOOGLE_DISPONIVEL && (
            <>
              <BotaoGoogle texto="signin_with" aoReceber={comGoogle} />
              <p className="formulario__ou"><span>ou com e-mail</span></p>
            </>
          )}

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

          <p className="formulario__troca">Ainda não tem conta? <Link to="/cadastro">Criar conta</Link></p>

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
