import { motion, useReducedMotion, type Variants } from 'motion/react'
import { CURVA, DUR_ROTA, item } from '../movimento'
import { useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api, comoProblema, MODO_DEMO } from '../api/cliente'
import { INICIO } from '../inicio'
import type { Problema } from '../api/tipos'
import { useTitulo } from '../useTitulo'
import { Aviso } from '../components/ui'
import { BotaoGoogle } from '../components/BotaoGoogle'
import { GOOGLE_DISPONIVEL } from '../google'
import { Marca } from '../components/Marca'
import { useComputador } from '../largura'
import { useSessao } from '../sessao'

/* A pista desce no tempo da rota, e cada etapa aparece quando a pista chega nela. */
const passos: Variants = {
  oculta: { '--trajeto': '100%' },
  visivel: { '--trajeto': '0%', transition: { duration: DUR_ROTA, ease: CURVA, delayChildren: DUR_ROTA / 4, staggerChildren: DUR_ROTA / 4 } },
}

/** Os três marcos do canvas: no celular o texto curto do cartão, no computador o do painel. */
const MARCOS = [
  { km: 'km 0', titulo: 'Fechou, pagou', curto: 'O Pix fica guardado. Ninguém recebe antes da hora.', longo: 'Você paga por Pix e o dinheiro fica guardado. Ninguém recebe antes da hora.' },
  { km: 'Saída', titulo: 'O motorista vê o Pix antes de carregar', curto: null, longo: 'Ele só sai quando o pagamento aparece como garantido.' },
  { km: 'Entrega', titulo: 'Chegou, liberou', curto: 'Foto, assinatura e GPS confirmam, e o dinheiro vai para o motorista.', longo: 'Foto, assinatura de quem recebe e GPS confirmam a entrega. Aí o dinheiro vai para o motorista.' },
]

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function Entrar() {
  const reduzido = useReducedMotion()
  const computador = useComputador()
  useTitulo('Entrar')
  const { tokens, entrar, entrarComGoogle } = useSessao()
  const navegar = useNavigate()
  const { state } = useLocation() as { state: { aviso?: string } | null }
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(null)
  const [link, setLink] = useState<'parado' | 'pedindo' | 'enviado'>('parado')
  const campoEmail = useRef<HTMLInputElement>(null)
  const campoSenha = useRef<HTMLInputElement>(null)

  if (tokens) return <Navigate to="/" replace />

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setProblema(null)
    setEnviando(true)
    try {
      const t = await entrar(email.trim(), senha)
      navegar(INICIO[t.papel])
    } catch (erro) {
      const p = comoProblema(erro)
      setProblema(p)
      // Primeiro campo com erro recebe o foco; sem erro por campo, volta para a senha.
      if (p.erros?.email) campoEmail.current?.focus()
      else campoSenha.current?.focus()
    } finally {
      setEnviando(false)
    }
  }

  /* Esqueci a senha: o link vai para o e-mail digitado. A resposta é a mesma exista a conta ou não. */
  async function pedirLink() {
    setProblema(null)
    const digitado = email.trim()
    if (!EMAIL.test(digitado)) {
      setProblema({ title: 'Dados inválidos', detail: '', status: 400, erros: { email: 'Digite o e-mail da sua conta para receber o link.' } })
      campoEmail.current?.focus()
      return
    }
    setLink('pedindo')
    try {
      await api('POST', '/api/auth/senha/link', { email: digitado })
      setLink('enviado')
    } catch (erro) {
      setLink('parado')
      setProblema(comoProblema(erro))
    }
  }

  /* Google: com conta, entra; sem conta, vai para o cadastro já com e-mail e nome do Google. */
  async function comGoogle(credencial: string) {
    setProblema(null)
    setEnviando(true)
    try {
      const t = await entrarComGoogle(credencial)
      navegar(INICIO[t.papel])
    } catch (erro) {
      const p = comoProblema(erro)
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
      <section className="entrar__form-area">
        <div className="entrar__coluna">
          <Link to="/" className="entrar__marca" aria-label="Fretaí, página inicial"><Marca /></Link>
          <form className="formulario" onSubmit={enviar} noValidate aria-describedby={problema && !erroEmail && !erroSenha ? 'erro-login' : undefined}>
            <div className="entrar__cabeca">
              <h1 className="entrar__h1">Entrar</h1>
              <p className="entrar__sub">Peça um frete ou pegue o próximo, com o pagamento garantido.</p>
            </div>
            {state?.aviso && <Aviso tom="garantido" titulo={state.aviso} />}

            <div className="campo">
              <label htmlFor="email" className="campo__rotulo">E-mail</label>
              <input
                ref={campoEmail} id="email" name="email" type="email" autoComplete="username" spellCheck={false}
                placeholder="voce@email.com" value={email} onChange={(e) => { setEmail(e.target.value); setLink('parado') }}
                aria-invalid={erroEmail ? true : undefined} aria-describedby={erroEmail ? 'email-erro' : undefined} className="campo__entrada"
              />
              {erroEmail && <p id="email-erro" className="campo__erro">{erroEmail}</p>}
            </div>

            <div className="campo">
              <div className="entrar__rotulo-senha">
                <label htmlFor="senha" className="campo__rotulo">Senha</label>
                <button type="button" className="link-acao" onClick={pedirLink} disabled={link === 'pedindo'}>
                  {link === 'pedindo' ? 'Enviando…' : 'Esqueci a senha'}
                </button>
              </div>
              <input
                ref={campoSenha} id="senha" name="senha" type="password" autoComplete="current-password" placeholder="Sua senha"
                value={senha} onChange={(e) => setSenha(e.target.value)}
                aria-invalid={erroSenha ? true : undefined} aria-describedby={erroSenha ? 'senha-erro' : undefined} className="campo__entrada"
              />
              {erroSenha && <p id="senha-erro" className="campo__erro">{erroSenha}</p>}
            </div>

            <p className="entrar__link-enviado" role="status">
              {link === 'enviado' && 'Se esse e-mail tiver conta, enviamos um link para criar uma senha nova.'}
            </p>

            <div aria-live="polite" id="erro-login">
              {problema && !erroEmail && !erroSenha && (
                <Aviso tom={problema.status === 429 ? 'alerta' : 'perigo'} titulo={problema.title}>{problema.detail}</Aviso>
              )}
            </div>

            <button type="submit" className="botao botao--primario botao--largo" disabled={enviando}>
              {enviando ? 'Entrando…' : 'Entrar'}
            </button>
            {GOOGLE_DISPONIVEL && <BotaoGoogle texto="continue_with" aoReceber={comGoogle} />}

            <p className="formulario__troca">Não tem conta? <Link to="/cadastro">Criar conta</Link></p>

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
                  <button type="button" className="botao botao--secundario" onClick={() => { setEmail('cliente@demo.fretai'); setSenha('demo123') }}>
                    Preencher cliente
                  </button>
                  <button type="button" className="botao botao--secundario" onClick={() => { setEmail('admin@demo.fretai'); setSenha('demo123') }}>
                    Preencher administrador
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>

      <section className="entrar__painel" aria-labelledby="entrar-painel">
        {computador ? (
          <>
            <h2 id="entrar-painel" className="entrar__chamada">Precisa levar alguma coisa? Peça um frete.</h2>
            <p className="entrar__chamada-texto">
              Mudança, móveis, eletrodomésticos ou material de obra, com quem tem utilitário, van ou caminhão. Carro de passeio não faz frete aqui.
            </p>
          </>
        ) : (
          <h2 id="entrar-painel" className="entrar__anda">Como o dinheiro anda</h2>
        )}
        {/* --trajeto: quanto da pista ainda está coberto. O Motion leva de 100% a 0%, de cima para baixo. */}
        <motion.ol className="entrar__passos" variants={passos} initial={reduzido ? false : 'oculta'} animate="visivel">
          {MARCOS.map((m) => {
            const texto = computador ? m.longo : m.curto
            return (
              <motion.li key={m.km} variants={item}>
                <span className="entrar__km">{m.km}</span>
                <strong className="entrar__marco">{m.titulo}</strong>
                {texto && <span>{texto}</span>}
              </motion.li>
            )
          })}
        </motion.ol>
      </section>
    </main>
  )
}
