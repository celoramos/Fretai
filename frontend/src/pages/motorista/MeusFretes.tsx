import { motion } from 'motion/react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, comoProblema } from '../../api/cliente'
import type { Frete, Pagamento, Pagina, Proposta } from '../../api/tipos'
import { useRecurso } from '../../api/useRecurso'
import { CabecalhoPagina } from '../../components/CabecalhoPagina'
import { Valor } from '../../components/Dinheiro'
import { ErroCarga, Esqueleto, Vazio } from '../../components/ui'
import { tituloDoFrete } from '../../compatibilidade'
import { STATUS_FRETE, contratante, diaDaSemana, diaMes, quilometros, reais } from '../../formato'
import { useComputador } from '../../largura'
import { item, lista } from '../../movimento'
import { useTitulo } from '../../useTitulo'

const ABAS = [
  { id: 'andamento', rotulo: 'Em andamento' },
  { id: 'propostas', rotulo: 'Propostas' },
  { id: 'concluidos', rotulo: 'Concluídos' },
] as const
type Aba = (typeof ABAS)[number]['id']
type Dados = { propostas: Proposta[]; fretes: Record<string, Frete>; pagamentos: Pagamento[] }

function abaDe(p: Proposta, f: Frete | undefined): Aba {
  if (p.status !== 'ACEITA') return 'propostas'
  return f && (f.status === 'PAGO' || f.status === 'CANCELADO') ? 'concluidos' : 'andamento'
}

/** Pessoa física fala em bairro; empresa, em cidade. */
const pontas = (f: Frete) => (f.cliente
  ? [f.coleta.bairro ?? f.coleta.cidade, f.entrega.bairro ?? f.entrega.cidade]
  : [f.coleta.cidade, f.entrega.cidade])

/*
 * Meus fretes, como no canvas: o dinheiro em cima (a receber e recebido no mês), e as três abas com o
 * total de cada uma. Em andamento e concluídos levam ao frete; a proposta aberta pode ser retirada aqui.
 */
export function MeusFretes() {
  useTitulo('Meus fretes')
  const computador = useComputador()
  const [params, setParams] = useSearchParams()
  const aba = (params.get('aba') as Aba | null) ?? 'andamento'

  const [estado, recarregar] = useRecurso(async (): Promise<Dados> => {
    const pagina = await api<Pagina<Proposta>>('GET', '/api/propostas/minhas?size=100')
    const ids = [...new Set(pagina.content.map((p) => p.freteId))]
    // Cobrança só existe para frete fechado: das propostas aceitas. Sem cobrança ainda, a API responde 404.
    const fechados = [...new Set(pagina.content.filter((p) => p.status === 'ACEITA').map((p) => p.freteId))]
    const [fretes, pagamentos] = await Promise.all([
      Promise.all(ids.map((id) => api<Frete>('GET', `/api/fretes/${id}`).catch(() => null))),
      Promise.all(fechados.map((id) => api<Pagamento>('GET', `/api/fretes/${id}/pagamento`).catch(() => null))),
    ])
    return {
      // Propostas recusadas ou retiradas não pedem nada: ficam fora das abas.
      propostas: pagina.content.filter((p) => p.status === 'ENVIADA' || p.status === 'ACEITA'),
      fretes: Object.fromEntries(fretes.filter((f): f is Frete => f != null).map((f) => [f.id, f])),
      pagamentos: pagamentos.filter((p): p is Pagamento => p != null),
    }
  }, [])

  const dados = estado.fase === 'pronto' ? estado.dados : null
  const contagem = (a: Aba) => dados?.propostas.filter((p) => abaDe(p, dados.fretes[p.freteId]) === a).length

  return (
    <div className="meus-m">
      {computador ? <h1 className="titulo-pagina meus-m__titulo">Meus fretes</h1> : <CabecalhoPagina titulo="Meus fretes" />}
      {dados && <SeuDinheiro dados={dados} />}
      <div className="busca-m__raios meus-m__abas" role="group" aria-label="Mostrar">
        {ABAS.map((a) => (
          <button key={a.id} type="button" className="busca-m__raio" aria-pressed={aba === a.id} onClick={() => setParams({ aba: a.id }, { replace: true })}>
            {a.rotulo}{contagem(a.id) != null && ` (${contagem(a.id)})`}
          </button>
        ))}
      </div>
      {estado.fase === 'carregando' && estado.mostrarEsqueleto && <><Esqueleto linhas={2} /><Esqueleto linhas={2} /></>}
      {estado.fase === 'erro' && <ErroCarga problema={estado.problema} tentarDeNovo={recarregar} />}
      {dados && <Lista itens={dados.propostas.filter((p) => abaDe(p, dados.fretes[p.freteId]) === aba)} fretes={dados.fretes} aba={aba} aoMudar={recarregar} />}
    </div>
  )
}

/**
 * O dinheiro: quanto está guardado esperando por ele e quanto caiu neste mês. É a pergunta que o motorista
 * faz antes de abrir qualquer frete. Verde só no dinheiro garantido ou pago, como no resto.
 */
function SeuDinheiro({ dados }: { dados: Dados }) {
  let aReceber = 0
  let parado = 0
  for (const p of dados.pagamentos) {
    if (p.status === 'RETIDO') aReceber += p.valorTotal
    if (p.status === 'ADIANTAMENTO_LIBERADO') {
      if (p.saldoBloqueado) parado += p.valorSaldo
      else aReceber += p.valorSaldo
    }
  }
  const [agora] = useState(() => new Date())
  const doMes = Object.values(dados.fretes).filter((f) => {
    if (f.status !== 'PAGO' || !f.pagoEm) return false
    const d = new Date(f.pagoEm)
    return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear()
  })
  const recebido = doMes.reduce((t, f) => t + (f.valorAcordado ?? f.valorTotal ?? f.valor ?? 0), 0)
  const mes = agora.toLocaleDateString('pt-BR', { month: 'long' })
  return (
    <section className="meus-m__dinheiro" aria-label="Seu dinheiro">
      <div className="meus-m__parte">
        <span className="meus-m__rotulo meus-m__rotulo--garantido">A receber</span>
        <Valor valor={aReceber} tamanho="grande" />
        <span className="meus-m__nota">guardado, sai depois da entrega</span>
      </div>
      <div className="meus-m__parte">
        <span className="meus-m__rotulo">Recebido em {mes}</span>
        <Valor valor={recebido} tamanho="grande" />
        <span className="meus-m__nota">{doMes.length === 1 ? '1 frete pago' : `${doMes.length} fretes pagos`}</span>
      </div>
      {parado > 0 && <p className="dinheiro__parado">R$&nbsp;{reais(parado)} parados por contestação da entrega, até a análise.</p>}
      <Link to="/motorista/extrato" className="meus-m__extrato">Ver extrato</Link>
    </section>
  )
}

function Lista({ itens, fretes, aba, aoMudar }: { itens: Proposta[]; fretes: Record<string, Frete>; aba: Aba; aoMudar: () => void }) {
  if (itens.length === 0) {
    const textos: Record<Aba, string> = {
      andamento: 'Nenhuma viagem fechada agora.',
      propostas: 'Nenhuma proposta esperando resposta.',
      concluidos: 'Nenhum frete concluído ainda.',
    }
    return <Vazio titulo={textos[aba]} acao={<Link to="/motorista" className="botao botao--primario">Procurar fretes</Link>} />
  }
  return (
    <motion.ul key={aba} className={aba === 'concluidos' ? 'meus-m__lista meus-m__lista--tabela' : 'meus-m__lista'} variants={lista} initial="oculta" animate="visivel">
      {itens.map((p) => {
        const f = fretes[p.freteId]
        if (!f) return null
        const [origem, destino] = pontas(f)
        if (aba === 'propostas') return <PropostaAberta key={p.id} proposta={p} frete={f} aoMudar={aoMudar} />
        if (aba === 'concluidos') {
          return (
            <motion.li key={p.id} variants={item}>
              <Link to={`/motorista/fretes/${f.id}`} className="meus-m__linha">
                <span><strong>{tituloDoFrete(f)}</strong><span>{origem} → {destino} · {diaMes(f.pagoEm ?? f.dataColeta)}</span></span>
                <span><strong>R$&nbsp;{reais(p.valor)}</strong><span className={f.status === 'PAGO' ? 'meus-m__pago' : ''}>{f.status === 'PAGO' ? 'Pago' : 'Cancelado'}</span></span>
              </Link>
            </motion.li>
          )
        }
        return (
          <motion.li key={p.id} variants={item}>
            <Link to={`/motorista/fretes/${f.id}`} className="meus-m__cartao">
              <span className="card-m__topo"><strong className="card-m__titulo">{tituloDoFrete(f)}</strong><Valor valor={p.valor} tamanho="grande" /></span>
              <span className="card-m__rota"><span>{origem}</span>{f.distanciaKm != null && <span className="km">{quilometros(f.distanciaKm)}</span>}<span>{destino}</span></span>
              <span className="card-m__fim"><span className="meus-m__situacao">{STATUS_FRETE[f.status].motorista}</span><span>{diaDaSemana(f.dataColeta)}</span></span>
            </Link>
          </motion.li>
        )
      })}
    </motion.ul>
  )
}

/** A proposta esperando resposta, com retirar (que pede confirmação). */
function PropostaAberta({ proposta, frete, aoMudar }: { proposta: Proposta; frete: Frete; aoMudar: () => void }) {
  const [fase, setFase] = useState<'parado' | 'confirmar' | 'enviando'>('parado')
  const [erro, setErro] = useState<string | null>(null)
  const [origem, destino] = pontas(frete)
  async function retirar() {
    setFase('enviando')
    setErro(null)
    try {
      await api('POST', `/api/propostas/${proposta.id}/retirada`)
      aoMudar()
    } catch (e) {
      setErro(comoProblema(e).detail)
      setFase('parado')
    }
  }
  return (
    <motion.li variants={item} className="meus-m__cartao">
      <span className="card-m__topo"><Link to={`/motorista/fretes/${frete.id}`} className="card-m__titulo">{tituloDoFrete(frete)}</Link><span className="card-m__meta">{diaDaSemana(frete.dataColeta)}</span></span>
      <span className="card-m__meta">{origem} → {destino}{frete.distanciaKm != null ? ` · ${quilometros(frete.distanciaKm)}` : ''}</span>
      <p className="meus-m__propos">Você propôs R$&nbsp;{reais(proposta.valor)} · {contratante(frete).quem} decide</p>
      {erro && <p className="campo__erro" role="alert">{erro}</p>}
      {fase === 'confirmar' ? (
        <div className="frete-c__acoes">
          <button type="button" className="botao botao--perigo" onClick={retirar}>Sim, retirar</button>
          <button type="button" className="botao botao--fantasma" onClick={() => setFase('parado')}>Manter</button>
        </div>
      ) : (
        <button type="button" className="botao botao--secundario botao--largo" disabled={fase === 'enviando'} onClick={() => setFase('confirmar')}>
          {fase === 'enviando' ? 'Retirando…' : 'Retirar proposta'}
        </button>
      )}
    </motion.li>
  )
}
