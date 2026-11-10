import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, CONTA_ATUALIZADA } from '../api/cliente'
import type { Eu, Frete, Pagina } from '../api/tipos'
import { useRecurso } from '../api/useRecurso'
import { useComputador } from '../largura'
import { useSessao } from '../sessao'
import { Avatar } from './Avatar'
import { FecharFolha, Folha } from './Folha'

/** Texto do canvas. Confere com a API: o saldo sai 24 h depois do canhoto (janela de contestação). */
const COMO_PAGA = 'Você paga por Pix quando fecha com o motorista. O dinheiro fica guardado no Fretaí e vai para ele até 24 h depois da entrega, se nada chegar errado. Se você cancelar antes da saída, o Pix volta para você.'

/** O frete que está andando: o mais recente que ainda não terminou. A lista vem do mais novo para o mais velho. */
function freteEmAndamento(fretes: Frete[]) {
  return fretes.find((f) => f.status !== 'PAGO' && f.status !== 'CANCELADO') ?? null
}

/**
 * O avatar do cliente e o menu da conta: nome e e-mail, o frete em andamento, pedir um frete, os dados
 * dele, como o pagamento funciona e sair. No celular é uma folha que sobe de baixo; no computador, um menu preso ao
 * avatar. Os dados chegam quando o menu abre: fechado, só o avatar precisa do nome.
 */
export function MenuConta() {
  const computador = useComputador()
  const { tokens, sair } = useSessao()
  const navegar = useNavigate()
  const id = useId()
  const [aberto, setAberto] = useState(false)
  const [ajuda, setAjuda] = useState(false)
  const botao = useRef<HTMLButtonElement>(null)
  const caixa = useRef<HTMLDivElement>(null)

  const [eu, recarregarEu] = useRecurso(() => api<Eu>('GET', '/api/auth/eu'), [tokens?.usuarioId])
  // O nome mudou na tela de dados: o avatar e o menu, que ficam na barra entre uma tela e outra, buscam de novo.
  useEffect(() => {
    window.addEventListener(CONTA_ATUALIZADA, recarregarEu)
    return () => window.removeEventListener(CONTA_ATUALIZADA, recarregarEu)
  }, [recarregarEu])
  const [fretes] = useRecurso(
    () => (aberto && tokens ? api<Pagina<Frete>>('GET', `/api/fretes/cliente/${tokens.usuarioId}`) : Promise.resolve(null)),
    [aberto, tokens?.usuarioId],
  )

  // No computador, fora do menu ou Esc fecham, e o foco volta ao avatar.
  useEffect(() => {
    if (!aberto || !computador) return
    const fora = (e: MouseEvent) => { if (!caixa.current?.contains(e.target as Node)) setAberto(false) }
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAberto(false)
        botao.current?.focus()
      }
    }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aberto, computador])

  // Fica com o último nome enquanto busca de novo: o avatar não pisca vazio depois de salvar os dados.
  const [pessoa, setPessoa] = useState<Eu | null>(null)
  if (eu.fase === 'pronto' && eu.dados !== pessoa) setPessoa(eu.dados)
  const emAndamento = fretes.fase === 'pronto' && fretes.dados ? freteEmAndamento(fretes.dados.content) : null
  const fechar = () => setAberto(false)
  const sairDaConta = () => sair().then(() => navegar('/entrar'))

  const quem = (
    <div className="conta__quem">
      {!computador && <Avatar nome={pessoa?.nome} grande />}
      <div className="conta__nome">
        {pessoa ? <><strong>{pessoa.nome}</strong><span>{pessoa.email}</span></> : eu.fase === 'erro' ? <span>Não deu para carregar seus dados.</span> : <span>Carregando…</span>}
      </div>
      {!computador && <FecharFolha aoFechar={fechar} />}
    </div>
  )

  const comoPaga = (
    <>
      <button type="button" className="conta__item" aria-expanded={ajuda} aria-controls={`${id}-ajuda`} onClick={() => setAjuda((a) => !a)}>
        Como o pagamento funciona
        <Seta para={ajuda ? 'cima' : 'baixo'} />
      </button>
      <p id={`${id}-ajuda`} className="conta__ajuda" hidden={!ajuda}>{COMO_PAGA}</p>
    </>
  )

  const linkAndamento = emAndamento && (
    <Link to={`/cliente/fretes/${emAndamento.id}`} className="conta__item" onClick={fechar}>
      Frete em andamento
      {!computador && <Seta para="direita" />}
    </Link>
  )

  const linkDados = (
    <Link to="/cliente/dados" className="conta__item" onClick={fechar}>
      Meus dados
      {!computador && <Seta para="direita" />}
    </Link>
  )

  if (computador) {
    return (
      <div className="conta conta--menu" ref={caixa}>
        <button ref={botao} type="button" className="conta__avatar" aria-label="Sua conta" aria-expanded={aberto} aria-controls={`${id}-menu`} onClick={() => setAberto((a) => !a)}>
          <Avatar nome={pessoa?.nome} />
        </button>
        <div id={`${id}-menu`} className="conta__menu" hidden={!aberto}>
          {quem}
          <div className="conta__grupo">
            {linkAndamento}
            {linkDados}
            {comoPaga}
          </div>
          <div className="conta__grupo">
            <button type="button" className="conta__item" onClick={sairDaConta}>Sair</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="conta">
      <button ref={botao} type="button" className="conta__avatar" aria-label="Sua conta" aria-haspopup="dialog" onClick={() => setAberto(true)}>
        <Avatar nome={pessoa?.nome} />
      </button>
      <Folha aberta={aberto} rotulo="Sua conta" aoFechar={fechar}>
        {quem}
        <div className="conta__lista">
          {linkAndamento}
          <Link to="/cliente/fretes/novo" className="conta__item" onClick={fechar}>
            Pedir um frete
            <Seta para="direita" />
          </Link>
          {linkDados}
          {comoPaga}
        </div>
        <button type="button" className="botao botao--secundario botao--largo conta__sair" onClick={sairDaConta}>Sair da conta</button>
      </Folha>
    </div>
  )
}

function Seta({ para }: { para: 'direita' | 'baixo' | 'cima' }) {
  const d = { direita: 'M8 5l5 5-5 5', baixo: 'M5 8l5 5 5-5', cima: 'M5 12l5-5 5 5' }[para]
  return (
    <svg className="conta__seta" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
