import { Link } from 'react-router-dom'
import { api } from '../../api/cliente'
import type { Frete, Pagamento, Pagina, Proposta } from '../../api/tipos'
import { ouNulo, useRecurso } from '../../api/useRecurso'
import { Valor } from '../../components/Dinheiro'
import { Cartao, ErroCarga, Esqueleto, Vazio } from '../../components/ui'
import { dataCurta, dataHora, mesAno, reaisCentavos } from '../../formato'
import { recebimentos } from '../../recebimentos'
import { useTitulo } from '../../useTitulo'

type Movimento = {
  chave: string
  freteId: string
  rota: string
  parcela: 'Adiantamento' | 'Saldo' | 'Frete'
  valor: number
  /** Recebido: quando caiu. A receber: null, e a condição diz quando cai. */
  quando: string | null
  condicao?: string
  parado?: boolean
}

/*
 * Cada pagamento vira até duas linhas, adiantamento e saldo, e cada linha está recebida ou a receber.
 * Frete cancelado não entra: o Pix voltou para a empresa e nada era do motorista.
 */
function separar(itens: { frete: Frete | null; pagamento: Pagamento }[]) {
  const recebidos: Movimento[] = []
  const aReceber: Movimento[] = []
  for (const { frete, pagamento: p } of itens) {
    const base = { freteId: p.freteId, rota: frete ? `${frete.coleta.cidade} → ${frete.entrega.cidade}` : 'Frete' }
    const adiantamento = p.valorAdiantamento > 0
    if (p.status === 'PENDENTE') {
      aReceber.push({ ...base, chave: `${p.id}-t`, parcela: 'Frete', valor: p.valorTotal, quando: null, condicao: 'quando o Pix for pago' })
    }
    if (p.status === 'RETIDO') {
      if (adiantamento) aReceber.push({ ...base, chave: `${p.id}-a`, parcela: 'Adiantamento', valor: p.valorAdiantamento, quando: null, condicao: 'na saída para a viagem' })
      aReceber.push({ ...base, chave: `${p.id}-s`, parcela: 'Saldo', valor: p.valorSaldo, quando: null, condicao: 'depois da entrega e do prazo de contestação' })
    }
    if (p.status === 'ADIANTAMENTO_LIBERADO') {
      aReceber.push({
        ...base, chave: `${p.id}-s`, parcela: 'Saldo', valor: p.valorSaldo, quando: null, parado: p.saldoBloqueado,
        condicao: p.saldoBloqueado ? 'parado: a entrega foi contestada e está em análise'
          : p.saldoLiberavelApos ? `a partir de ${dataHora(p.saldoLiberavelApos)}` : 'depois da entrega e do prazo de contestação',
      })
    }
    // O que já caiu vem de recebimentos(), a mesma conta do "Recebido no mês" de Meus fretes.
    for (const r of recebimentos(p)) {
      recebidos.push({ ...base, chave: `${p.id}-${r.parcela === 'Adiantamento' ? 'a' : 's'}`, parcela: r.parcela, valor: r.valor, quando: r.quando })
    }
  }
  recebidos.sort((a, z) => (z.quando ?? '').localeCompare(a.quando ?? ''))
  return { recebidos, aReceber }
}

/** Recebidos agrupados por mês, do mais novo para o mais velho, com o total de cada mês. */
function porMes(recebidos: Movimento[]) {
  const meses = new Map<string, Movimento[]>()
  for (const m of recebidos) {
    const mes = m.quando ? mesAno(m.quando) : 'Sem data'
    meses.set(mes, [...(meses.get(mes) ?? []), m])
  }
  return [...meses]
}

const soma = (lista: Movimento[]) => lista.reduce((t, m) => t + m.valor, 0)

/*
 * Extrato do motorista: o que já caiu na chave Pix e o que ainda vai cair, linha por linha, com o
 * frete de onde veio. O resumo de Meus fretes responde "quanto"; aqui responde "de onde e quando".
 */
export function Extrato() {
  useTitulo('Extrato')
  const [estado, recarregar] = useRecurso(async () => {
    const pagina = await api<Pagina<Proposta>>('GET', '/api/propostas/minhas?size=100')
    const fechados = [...new Set(pagina.content.filter((p) => p.status === 'ACEITA').map((p) => p.freteId))]
    // Sem cobrança ainda (404) o frete fica de fora; qualquer outra falha aparece com "Tentar de novo".
    const itens = await Promise.all(fechados.map(async (id) => {
      const [frete, pagamento] = await Promise.all([
        ouNulo(api<Frete>('GET', `/api/fretes/${id}`)),
        ouNulo(api<Pagamento>('GET', `/api/fretes/${id}/pagamento`)),
      ])
      return { frete, pagamento }
    }))
    return separar(itens.filter((i): i is { frete: Frete | null; pagamento: Pagamento } => i.pagamento != null))
  }, [])

  return (
    <div className="extrato">
      <Link to="/motorista/meus-fretes" className="voltar">Meus fretes</Link>
      <h1 className="busca__titulo">Extrato</h1>
      {estado.fase === 'carregando' && estado.mostrarEsqueleto && <><Esqueleto linhas={2} /><Esqueleto linhas={4} /><Esqueleto linhas={4} /></>}
      {estado.fase === 'erro' && <ErroCarga problema={estado.problema} tentarDeNovo={recarregar} />}
      {estado.fase === 'pronto' && <Conteudo {...estado.dados} />}
    </div>
  )
}

function Conteudo({ recebidos, aReceber }: { recebidos: Movimento[]; aReceber: Movimento[] }) {
  if (recebidos.length === 0 && aReceber.length === 0) {
    return (
      <Vazio titulo="Nenhum dinheiro por aqui ainda." acao={<Link to="/motorista" className="botao botao--primario">Procurar fretes</Link>}>
        Quando aceitarem sua proposta e o Pix for pago, o adiantamento e o saldo aparecem aqui.
      </Vazio>
    )
  }
  const garantido = soma(aReceber.filter((m) => m.parcela !== 'Frete' && !m.parado))
  const parado = soma(aReceber.filter((m) => m.parado))
  return (
    <>
      <section className="cartao dinheiro" aria-label="Resumo">
        <div className="dinheiro__parte">
          <p className="dinheiro__rotulo dinheiro__rotulo--garantido">Garantido a receber</p>
          <Valor valor={garantido} tamanho="grande" centavos />
        </div>
        <div className="dinheiro__parte">
          <p className="dinheiro__rotulo">Já recebido</p>
          <Valor valor={soma(recebidos)} tamanho="grande" centavos />
        </div>
        {parado > 0 && <p className="dinheiro__parado">R$&nbsp;{reaisCentavos(parado)} parados por contestação da entrega, até a análise.</p>}
      </section>

      {aReceber.length > 0 && (
        <Cartao id="titulo-a-receber" titulo="A receber">
          <ul className="extrato__lista">{aReceber.map((m) => <Linha key={m.chave} m={m} />)}</ul>
        </Cartao>
      )}
      {porMes(recebidos).map(([mes, itens], i) => (
        <Cartao key={mes} id={`titulo-mes-${i}`} titulo={`Recebido em ${mes}`}>
          <ul className="extrato__lista">{itens.map((m) => <Linha key={m.chave} m={m} />)}</ul>
          <p className="extrato__total">Total do mês <span className="extrato__valor">R$&nbsp;{reaisCentavos(soma(itens))}</span></p>
        </Cartao>
      ))}
      <p className="detalhe">Cada valor cai na chave Pix cadastrada no seu perfil.</p>
    </>
  )
}

function Linha({ m }: { m: Movimento }) {
  return (
    <li className="extrato__linha">
      <span className="extrato__o-que">
        {m.parcela} · <Link to={`/motorista/fretes/${m.freteId}`} className="extrato__rota">{m.rota}</Link>
      </span>
      <span className={m.parado ? 'extrato__quando extrato__quando--parado' : 'extrato__quando'}>
        {m.quando ? dataCurta(m.quando) : m.condicao}
      </span>
      <span className="extrato__valor">R$&nbsp;{reaisCentavos(m.valor)}</span>
    </li>
  )
}
