import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { entrar as entrarApi, lerSessao, sair as sairApi } from './api/cliente'
import type { Tokens } from './api/tipos'

type Tema = 'claro' | 'escuro'

interface Sessao {
  tokens: Tokens | null
  entrar: (email: string, senha: string) => Promise<Tokens>
  sair: () => Promise<void>
  tema: Tema
  alternarTema: () => void
}

const Contexto = createContext<Sessao | null>(null)
const CHAVE_TEMA = 'fretai.tema'

/** Motorista abre no escuro (cabine, noite, bateria); empresa e tela de login abrem no claro. */
const temaPadrao = (t: Tokens | null): Tema => (t?.papel === 'MOTORISTA' ? 'escuro' : 'claro')

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<Tokens | null>(lerSessao)
  const [escolhaTema, setEscolhaTema] = useState<Tema | null>(() => localStorage.getItem(CHAVE_TEMA) as Tema | null)
  const tema = escolhaTema ?? temaPadrao(tokens)

  useEffect(() => {
    document.documentElement.dataset.tema = tema
  }, [tema])

  useEffect(() => {
    const expirou = () => setTokens(null)
    window.addEventListener('fretai:sessao-expirada', expirou)
    return () => window.removeEventListener('fretai:sessao-expirada', expirou)
  }, [])

  const entrar = useCallback(async (email: string, senha: string) => {
    const novos = await entrarApi(email, senha)
    setTokens(novos)
    return novos
  }, [])

  const sair = useCallback(async () => {
    await sairApi()
    setTokens(null)
  }, [])

  const alternarTema = useCallback(() => {
    const proximo = tema === 'escuro' ? 'claro' : 'escuro'
    localStorage.setItem(CHAVE_TEMA, proximo)
    setEscolhaTema(proximo)
  }, [tema])

  return <Contexto.Provider value={{ tokens, entrar, sair, tema, alternarTema }}>{children}</Contexto.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSessao() {
  const s = useContext(Contexto)
  if (!s) throw new Error('useSessao fora do ProvedorSessao')
  return s
}
