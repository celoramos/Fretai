import { motion } from 'motion/react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../api/cliente'
import type { Frete, Pagamento, Pagina, Proposta } from '../../api/tipos'
import { useRecurso } from '../../api/useRecurso'
import { useTitulo } from '../../useTitulo'
import { Valor } from '../../components/Dinheiro'
import { Etiqueta, ErroCarga, Esqueleto, Indicador, Km, StatusFreteEtiqueta, Vazio } from '../../components/ui'
import { dataCurta, reais, STATUS_PROPOSTA } from '../../formato'
import { item, lista } from '../../movimento'

const ABAS = [
  { id: 'andamento', rotulo: 'Em andamento' },
  { id: 'propostas', rotulo: 'Propostas' },
  { id: 'concluidos', rotulo: 'Concluídos' },
] as const
type Aba = (typeof ABAS)[number]['id']

function abaDe(p: Proposta, f: Frete | undefined): Aba {
  if (p.status !== 'ACEITA') return 'propostas'
  return f && (f.status === 'PAGO' || f.status === 'CANCELADO') ? 'concluidos' : 'andamento'
}

export function MeusFretes() {
  useTitulo('Meus fretes')
  const [params, setParams] = useSearchParams()
  const aba = (params.get('aba') as Aba | null) ?? 'andamento'

  const [estado, recarregar] = useRecurso(async () => {
    const pagina = await api<Pagina<Proposta>>('GET', '/api/propostas/minhas')
    const ids = [...new Set(pagina.content.map((p) => p.freteId))]
    // Cobrança só existe para frete fechado: das propostas aceitas. Sem cobrança ainda, a API responde 404.
    const fechados = [...new Set(pagina.content.filter((p) => p.status === 'ACEITA').map((p) => p.freteId))]
    const [fretes, pagamentos] = await Promise.all([
      Promise.all(ids.map((id) => api<Frete>('GET', `/api/fretes/${id}`).catch(() => null))),
      Promise.all(fechados.map((id) => api<Pagamento>('GET', `/api/fretes/${id}/pagamento`).catch(() => null))),
    ])
    return {
      propostas: pagina.content,
      fretes: Object.fromEntries(fretes.filter((f): f is Frete => f != null).map((f) => [f.id, f])),
      pagamentos: pagamentos.filter((p): p is Pagamento => p != null),
    }
  }, [])

  return (
    <div className="meus">
      <h1 className="busca__titulo">Meus fretes</h1>
      {estado.fase === 'pronto' && <SeuDinheiro pagamentos={estado.dados.pagamentos} />}
      <div className="abas" role="tablist" aria-label="Situação">
        {ABAS.map((a) => (
          <button key={a.id} type="button" role="tab" id={`aba-${a.id}`} aria-selected={aba === a.id} aria-controls="painel-meus" className="abas__aba"
            onClick={() => setParams({ aba: a.id })}>
            {aba === a.id && <Indicador id="aba-meus" forma="linha" />}
            {a.rotulo}
          </button>
        ))}
      </div>
      <div id="painel-meus" role="tabpanel" aria-labelledby={`aba-${aba}`}>
        {estado.fase === 'carregando' && estado.mostrarEsqueleto && <><Esqueleto linhas={2} /><Esqueleto linhas={2} /></>}
        {estado.fase === 'erro' && <ErroCarga problema={estado.problema} tentarDeNovo={recarregar} />}
        {estado.fase === 'pronto' && <Lista itens={estado.dados.propostas.filter((p) => abaDe(p, estado.dados.fretes[p.freteId]) === aba)} fretes={estado.dados.fretes} aba={aba} />}
      </div>
    </div>
  )
}

/**
 * O resumo do dinheiro: quanto já está guardado esperando por ele e quanto já caiu. É a pergunta que o
 * motorista faz antes de abrir qualquer frete. Verde só no dinheiro garantido ou pago, como no resto.
 */
function SeuDinheiro({ pagamentos }: { pagamentos: Pagamento[] }) {
  let garantido = 0
  let recebido = 0
  let parado = 0
  for (const p of pagamentos) {
    if (p.status === 'RETIDO') garantido += p.valorTotal
    if (p.status === 'ADIANTAMENTO_LIBERADO') {
      recebido += p.valorAdiantamento
      if (p.saldoBloqueado) parado += p.valorSaldo
      else garantido += p.valorSaldo
    }
    if (p.status === 'LIBERADO') recebido += p.valorTotal
  }
  if (garantido === 0 && recebido === 0 && parado === 0) return null
  return (
    <section className="cartao dinheiro" aria-label="Seu dinheiro">
      <div className="dinheiro__parte">
        <p className="dinheiro__rotulo dinheiro__rotulo--garantido">Garantido a receber</p>
        <Valor valor={garantido} tamanho="grande" />
      </div>
      <div className="dinheiro__parte">
        <p className="dinheiro__rotulo">Já recebido</p>
        <Valor valor={recebido} tamanho="grande" />
      </div>
      {parado > 0 && (
        <p className="dinheiro__parado">R$&nbsp;{reais(parado)} parados por contestação da entrega, até a análise.</p>
      )}
    </section>
  )
}

function Lista({ itens, fretes, aba }: { itens: Proposta[]; fretes: Record<string, Frete>; aba: Aba }) {
  if (itens.length === 0) {
    const textos: Record<Aba, string> = {
      andamento: 'Nenhuma viagem fechada agora.',
      propostas: 'Você não tem propostas abertas.',
      concluidos: 'Nenhum frete concluído ainda.',
    }
    return <Vazio titulo={textos[aba]} acao={<Link to="/motorista" className="botao botao--primario">Procurar fretes</Link>} />
  }
  return (
    <motion.ul key={aba} className="lista-cartoes" variants={lista} initial="oculta" animate="visivel">
      {itens.map((p) => {
        const f = fretes[p.freteId]
        return (
          <motion.li key={p.id} variants={item}>
            <Link to={`/motorista/fretes/${p.freteId}`} className="linha-frete cartao">
              <span className="linha-frete__rota">{f ? `${f.coleta.cidade}/${f.coleta.uf} → ${f.entrega.cidade}/${f.entrega.uf}` : 'Frete'}</span>
              <span className="linha-frete__valor">R$&nbsp;{reais(p.valor)}</span>
              <span className="linha-frete__meta">
                {aba === 'propostas' ? <Etiqueta tom={STATUS_PROPOSTA[p.status].tom}>{STATUS_PROPOSTA[p.status].rotulo}</Etiqueta> : f && <StatusFreteEtiqueta status={f.status} visao="motorista" />}
                {f?.distanciaKm != null && <Km km={f.distanciaKm} />}
                {f && <span>coleta {dataCurta(f.dataColeta)}</span>}
              </span>
            </Link>
          </motion.li>
        )
      })}
    </motion.ul>
  )
}
