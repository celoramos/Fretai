import { useEffect, useRef, useState } from 'react'
import { MODO_DEMO } from '../api/cliente'
import { GOOGLE_CLIENT_ID as CLIENT_ID } from '../google'
import { useSessao } from '../sessao'

/*
 * Botão "Entrar com Google". Com VITE_GOOGLE_CLIENT_ID, é o botão oficial do Google Identity Services
 * (as regras de marca do Google pedem o botão deles). No modo demo, um botão simulado entrega uma
 * credencial falsa que o demo (src/api/demo.ts) aceita. Sem os dois, não aparece nada.
 */

const CREDENCIAL_DEMO = 'demo-google'

interface GoogleId {
  initialize(opcoes: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: 'popup' }): void
  renderButton(el: HTMLElement, opcoes: Record<string, string | number>): void
}
declare global {
  interface Window { google?: { accounts: { id: GoogleId } } }
}

let script: Promise<GoogleId> | null = null
function carregarGoogle(): Promise<GoogleId> {
  script ??= new Promise((resolve, reject) => {
    const el = document.createElement('script')
    el.src = 'https://accounts.google.com/gsi/client'
    el.async = true
    el.onload = () => (window.google ? resolve(window.google.accounts.id) : reject(new Error('Google não carregou')))
    el.onerror = () => { script = null; reject(new Error('Google não carregou')) }
    document.head.appendChild(el)
  })
  return script
}

export function BotaoGoogle({ texto, aoReceber }: { texto: 'signin_with' | 'signup_with' | 'continue_with'; aoReceber: (credencial: string) => void }) {
  const lugar = useRef<HTMLDivElement>(null)
  const { tema } = useSessao()
  const [falhou, setFalhou] = useState(false)
  // O callback do Google é registrado uma vez; a ref deixa ele chamar sempre a versão atual.
  const recebe = useRef(aoReceber)
  useEffect(() => { recebe.current = aoReceber }, [aoReceber])

  useEffect(() => {
    const clientId = CLIENT_ID
    if (!clientId || MODO_DEMO) return
    let vivo = true
    carregarGoogle().then((g) => {
      if (!vivo || !lugar.current) return
      g.initialize({ client_id: clientId, callback: (r) => recebe.current(r.credential), ux_mode: 'popup' })
      g.renderButton(lugar.current, {
        type: 'standard', theme: tema === 'escuro' ? 'filled_black' : 'outline', size: 'large', shape: 'pill',
        text: texto, logo_alignment: 'left', locale: 'pt-BR', width: Math.min(400, lugar.current.clientWidth),
      })
    }, () => vivo && setFalhou(true))
    return () => { vivo = false }
  }, [tema, texto])

  if (MODO_DEMO) {
    return (
      <button type="button" className="botao botao--secundario botao--google" onClick={() => aoReceber(CREDENCIAL_DEMO)}>
        <LogoGoogle />
        {{ signin_with: 'Entrar com Google', signup_with: 'Cadastrar com Google', continue_with: 'Continuar com Google' }[texto]}
        <span className="botao--google__demo">demonstração</span>
      </button>
    )
  }
  if (!CLIENT_ID) return null
  if (falhou) return <p className="campo__ajuda">Não deu para carregar o Google. Use e-mail e senha.</p>
  return <div ref={lugar} className="google-oficial" />
}

/** Departure: as cores do "G" são da marca do Google, não da paleta. A regra de marca deles pede o logo assim. */
function LogoGoogle() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}
