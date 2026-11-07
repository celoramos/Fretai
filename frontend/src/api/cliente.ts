import type { Problema, Tokens } from './tipos'

const CHAVE_SESSAO = 'fretai.sessao'
export const MODO_DEMO = import.meta.env.VITE_DEMO === 'true'

export class ErroApi extends Error {
  readonly problema: Problema
  constructor(problema: Problema) {
    super(problema.detail || problema.title)
    this.problema = problema
  }
}

export function lerSessao(): Tokens | null {
  const bruto = localStorage.getItem(CHAVE_SESSAO)
  return bruto ? (JSON.parse(bruto) as Tokens) : null
}

export function gravarSessao(tokens: Tokens | null) {
  if (tokens) localStorage.setItem(CHAVE_SESSAO, JSON.stringify(tokens))
  else localStorage.removeItem(CHAVE_SESSAO)
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

async function transportar(metodo: Metodo, caminho: string, corpo?: unknown, token?: string): Promise<Response> {
  if (MODO_DEMO) {
    const { responderDemo } = await import('./demo')
    return responderDemo(metodo, caminho, corpo, token)
  }
  return fetch(caminho, {
    method: metodo,
    headers: {
      ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  })
}

async function lerProblema(resposta: Response): Promise<Problema> {
  try {
    const corpo = await resposta.json()
    return {
      title: corpo.title ?? 'Erro', detail: corpo.detail ?? '', status: resposta.status, erros: corpo.erros,
      codigo: corpo.codigo, email: corpo.email, nome: corpo.nome,
    }
  } catch {
    return {
      title: 'Sem resposta da API',
      detail: `O servidor respondeu ${resposta.status}. Confira se a API está rodando em localhost:8080.`,
      status: resposta.status,
    }
  }
}

let renovacao: Promise<Tokens | null> | null = null

/** Troca o refresh token por um par novo. Chamadas simultâneas esperam a mesma renovação. */
function renovar(): Promise<Tokens | null> {
  const atual = lerSessao()
  if (!atual) return Promise.resolve(null)
  renovacao ??= transportar('POST', '/api/auth/refresh', { refreshToken: atual.refreshToken })
    .then(async (r) => {
      const novos = r.ok ? ((await r.json()) as Tokens) : null
      gravarSessao(novos)
      if (!novos) window.dispatchEvent(new Event('fretai:sessao-expirada'))
      return novos
    })
    .finally(() => {
      renovacao = null
    })
  return renovacao
}

export async function api<T>(metodo: Metodo, caminho: string, corpo?: unknown): Promise<T> {
  let resposta: Response
  try {
    resposta = await transportar(metodo, caminho, corpo, lerSessao()?.accessToken)
    if (resposta.status === 401 && lerSessao()) {
      const novos = await renovar()
      if (novos) resposta = await transportar(metodo, caminho, corpo, novos.accessToken)
    }
  } catch {
    throw new ErroApi({
      title: 'Sem conexão',
      detail: 'Não foi possível falar com o Fretaí. Confira o sinal e tente de novo.',
      status: 0,
    })
  }
  if (!resposta.ok) throw new ErroApi(await lerProblema(resposta))
  if (resposta.status === 204) return undefined as T
  return (await resposta.json()) as T
}

export async function entrar(email: string, senha: string): Promise<Tokens> {
  const tokens = await api<Tokens>('POST', '/api/auth/login', { email, senha })
  gravarSessao(tokens)
  return tokens
}

/** Entrar com a credencial do botão do Google. Sem conta, a API responde 404 com codigo CADASTRO_NECESSARIO. */
export async function entrarComGoogle(credencial: string): Promise<Tokens> {
  const tokens = await api<Tokens>('POST', '/api/auth/google', { credencial })
  gravarSessao(tokens)
  return tokens
}

export async function sair() {
  const atual = lerSessao()
  if (atual) {
    // Revogar no servidor é cortesia; a sessão local sai de qualquer jeito.
    await api('POST', '/api/auth/logout', { refreshToken: atual.refreshToken }).catch(() => undefined)
  }
  gravarSessao(null)
}
