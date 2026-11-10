import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/cliente'
import type { Avaliacao, Eu, Frete, Pagamento, Pagina, Proposta, TipoCarga } from '../../api/tipos'
import { ouNulo, useRecurso } from '../../api/useRecurso'
import { RotaLinha } from '../../components/RotaLinha'
import { nomeDaPonta } from '../../ponta'
import { ErroCarga, Esqueleto, Vazio } from '../../components/ui'
import { CATEGORIAS, TIPOS_CARGA, diaDaSemana, diaMes, horaMinuto } from '../../formato'
import { Valor } from '../../components/Dinheiro'
import { useSessao } from '../../sessao'
import { useTitulo } from '../../useTitulo'

/** abertas: propostas esperando resposta (null se não deu para contar); pago: o Pix já entrou e o dinheiro está guardado. */
type Linha = { frete: Frete; abertas: number | null; pago: boolean }

const ENCERRADO = (f: Frete) => f.status === 'PAGO' || f.status === 'CANCELADO'

/** Os quatro atalhos do canvas, com o ícone de traço de cada um. */
const ATALHOS: { tipo: TipoCarga; icone: React.ReactNode }[] = [
  { tipo: 'MUDANCA', icone: <><path d="M3.5 8.5L12 4l8.5 4.5v9L12 22l-8.5-4.5z" /><path d="M3.5 8.5L12 13l8.5-4.5M12 13v9" /></> },
  { tipo: 'MOVEIS', icone: <><path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" /><path d="M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v5H3z" /><path d="M5 18v2M19 18v2" /></> },
  { tipo: 'CAIXAS', icone: <><rect x="3" y="12" width="8" height="8" rx="1" /><rect x="13" y="12" width="8" height="8" rx="1" /><rect x="8" y="4" width="8" height="8" rx="1" /></> },
  { tipo: 'OBRA', icone: <><rect x="3" y="5" width="18" height="14" rx="1" /><path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 9.7v4.6M9 14.3V19" /></> },
]

const Icone = ({ children, className = 'icone-traco' }: { children: React.ReactNode; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">{children}</svg>
)

/** O nome do frete: o tipo de carga que a pessoa marcou; sem ele, o começo da descrição. */
function tituloDoFrete(f: Frete) {
  if (f.tipoCarga && f.tipoCarga !== 'OUTRO') return TIPOS_CARGA[f.tipoCarga]
  return f.descricaoCarga?.split(/[.:,]/)[0] || 'Frete'
}

/** O veículo como o canvas fala: "Van RPX2G41". A categoria do veículo que vai; sem ela, a pedida. */
function veiculoDoFrete(f: Frete) {
  const categoria = f.veiculo?.categoria ?? f.categoriaVeiculo
  const nome = categoria ? CATEGORIAS[categoria].nome.split(' ')[0] : null
  return { nome, modelo: f.veiculo?.modelo ?? null, placa: f.veiculo?.placa ?? f.motorista?.placa ?? null }
}

/** A linha de situação do cartão em andamento, dita para quem pediu. */
function situacao({ frete: f, abertas, pago }: Linha): { texto: string; tom: 'info' | 'alerta' } {
  const primeiro = f.motorista?.nome.split(' ')[0]
  switch (f.status) {
    case 'PUBLICADO':
      return { texto: 'Procurando motorista perto da coleta', tom: 'info' }
    case 'PROPOSTA_ENVIADA':
      return { texto: abertas === 1 ? '1 proposta para responder' : abertas ? `${abertas} propostas para responder` : 'Propostas para responder', tom: 'alerta' }
    case 'ACEITO':
      return pago ? { texto: `Fechado com ${primeiro}`, tom: 'info' } : { texto: `Fechado com ${primeiro}. Falta o Pix`, tom: 'alerta' }
    case 'EM_TRANSITO':
      return { texto: `Na estrada com ${primeiro}`, tom: 'info' }
    default:
      return { texto: 'Entregue. Confira e avalie', tom: 'alerta' }
  }
}

/*
 * O início do cliente: os atalhos do que levar, o frete que está andando e os anteriores, que abrem para
 * mostrar quem levou, quando chegou, a nota dada e um jeito de pedir de novo.
 */
export function FretesCliente() {
  useTitulo('Seus fretes')
  const { tokens } = useSessao()
  const clienteId = tokens?.usuarioId ?? ''
  const [eu] = useRecurso(() => api<Eu>('GET', '/api/auth/eu'), [clienteId])
  const [estado, recarregar] = useRecurso(async () => {
    const pagina = await api<Pagina<Frete>>('GET', `/api/fretes/cliente/${clienteId}?size=100&sort=criadoEm,desc`)
    return Promise.all(pagina.content.map(async (frete): Promise<Linha> => {
      // Só o que muda a situação é consultado: as propostas de quem tem proposta, o Pix de quem fechou.
      const [propostas, pagamento] = await Promise.all([
        frete.status === 'PROPOSTA_ENVIADA' ? ouNulo(api<Proposta[]>('GET', `/api/fretes/${frete.id}/propostas`)) : null,
        ['ACEITO', 'EM_TRANSITO', 'ENTREGUE'].includes(frete.status) ? ouNulo(api<Pagamento>('GET', `/api/fretes/${frete.id}/pagamento`)) : null,
      ])
      return {
        frete,
        abertas: propostas ? propostas.filter((p) => p.status === 'ENVIADA').length : null,
        pago: !!pagamento && pagamento.status !== 'PENDENTE' && pagamento.status !== 'ESTORNADO',
      }
    }))
  }, [clienteId])

  const linhas = estado.fase === 'pronto' ? estado.dados : []
  const andando = linhas.filter((l) => !ENCERRADO(l.frete))
  const anteriores = linhas.filter((l) => ENCERRADO(l.frete))
  const nome = eu.fase === 'pronto' ? eu.dados.nome?.split(' ')[0] : null

  return (
    <div className="inicio-c">
      <h1 className="inicio-c__ola">{nome ? `Olá, ${nome}` : 'Seus fretes'}</h1>
      <div className="inicio-c__alto">
        <section aria-labelledby="t-pedir" className="inicio-c__pedir">
          <h2 id="t-pedir">O que você precisa levar?</h2>
          <div className="inicio-c__atalhos">
            {ATALHOS.map((a) => (
              <Link key={a.tipo} to={`/cliente/fretes/novo?tipo=${a.tipo}`} className="inicio-c__atalho">
                <Icone>{a.icone}</Icone>
                <strong>{TIPOS_CARGA[a.tipo]}</strong>
              </Link>
            ))}
          </div>
          <div className="inicio-c__chamada">
            <Link to="/cliente/fretes/novo" className="botao botao--primario">Pedir frete</Link>
            <p>Quem leva tem utilitário, van ou caminhão. Carro de passeio não faz frete aqui.</p>
          </div>
        </section>

        {(estado.fase !== 'pronto' || andando.length > 0) && (
          <section aria-labelledby="t-andamento" className="inicio-c__andamento">
            <h2 id="t-andamento">Em andamento</h2>
            {estado.fase === 'carregando' && estado.mostrarEsqueleto && <Esqueleto linhas={4} />}
            {estado.fase === 'erro' && <ErroCarga problema={estado.problema} tentarDeNovo={recarregar} />}
            {andando.map((l) => <CartaoAndamento key={l.frete.id} linha={l} />)}
          </section>
        )}
      </div>

      {estado.fase === 'pronto' && linhas.length === 0 && (
        <Vazio titulo="Você ainda não pediu nenhum frete." acao={<Link to="/cliente/fretes/novo" className="botao botao--primario">Pedir frete</Link>}>
          Você diz de onde, para onde e o que vai. Motoristas perto da coleta recebem o aviso, e você escolhe com quem fechar.
        </Vazio>
      )}

      {anteriores.length > 0 && (
        <section aria-labelledby="t-anteriores" className="inicio-c__anteriores">
          <h2 id="t-anteriores">Anteriores</h2>
          <div className="anteriores">
            <div className="anteriores__cabeca" aria-hidden="true"><span>Frete</span><span>Rota</span><span>Data</span><span>Valor</span><span>Situação</span><span /></div>
            <ul>{anteriores.map((l) => <Anterior key={l.frete.id} frete={l.frete} />)}</ul>
          </div>
        </section>
      )}
    </div>
  )
}

function CartaoAndamento({ linha }: { linha: Linha }) {
  const { frete: f, pago } = linha
  const s = situacao(linha)
  const v = veiculoDoFrete(f)
  const valor = f.valorAcordado ?? f.valorTotal ?? f.valor
  return (
    <Link to={`/cliente/fretes/${f.id}`} className="andamento">
      <span className="andamento__topo"><strong>{tituloDoFrete(f)}</strong><span>{diaDaSemana(f.dataColeta)}</span></span>
      <RotaLinha coleta={f.coleta} entrega={f.entrega} distanciaKm={f.distanciaKm} estimada={f.distanciaEstimada} pontas="bairro-cidade" empilhada />
      <span className={`andamento__situacao andamento__situacao--${s.tom}`}>
        <span className="andamento__ponto" aria-hidden="true" />
        {s.texto}
        {f.motorista && v.nome && <> · {v.nome} {v.placa && <span className="placa-mono">{v.placa}</span>}</>}
      </span>
      <span className="andamento__fim">
        {valor != null ? <span className={pago ? 'andamento__valor andamento__valor--guardado' : 'andamento__valor'}><Valor valor={valor} />{pago && ' guardado'}</span> : <span />}
        <span className="andamento__ver">Acompanhar</span>
      </span>
    </Link>
  )
}

/** Um frete encerrado. Fechado mostra o resumo; aberto busca a nota dada e oferece pedir de novo. */
function Anterior({ frete: f }: { frete: Frete }) {
  const [aberto, setAberto] = useState(false)
  const [avaliacoes] = useRecurso(
    () => (aberto ? api<Avaliacao[]>('GET', `/api/fretes/${f.id}/avaliacoes`) : Promise.resolve(null)),
    [aberto, f.id],
  )
  const valor = f.valorAcordado ?? f.valorTotal ?? f.valor
  const pago = f.status === 'PAGO'
  const rota = `${nomeDaPonta(f.coleta, 'bairro')} → ${nomeDaPonta(f.entrega, 'bairro')}`
  const data = diaMes(f.concluidoEm ?? f.dataColeta)
  const v = veiculoDoFrete(f)
  const minha = avaliacoes.fase === 'pronto' ? avaliacoes.dados?.find((a) => a.lado === 'CONTRATANTE') : undefined
  const detalhe = `anterior-${f.id}`
  return (
    <li className="anterior">
      <button type="button" className="anterior__linha" aria-expanded={aberto} aria-controls={detalhe} onClick={() => setAberto(!aberto)}>
        <strong className="anterior__titulo">{tituloDoFrete(f)}</strong>
        <span className="anterior__rota">{rota}<span className="anterior__data-celular"> · {data}</span></span>
        <span className="anterior__data">{data}</span>
        <strong className="anterior__valor">{valor != null ? <Valor valor={valor} /> : 'A combinar'}</strong>
        <span className={pago ? 'anterior__situacao anterior__situacao--pago' : 'anterior__situacao'}>{pago ? 'Pago ao motorista' : 'Cancelado'}</span>
        <Icone className="icone-traco anterior__seta"><path d="M6 9l6 6 6-6" /></Icone>
      </button>
      {aberto && (
        <div className="anterior__detalhe" id={detalhe}>
          <div className="anterior__quem">
            {f.motorista ? (
              <span>Levado por <strong>{f.motorista.nome}</strong>{v.nome && ` · ${v.nome}${v.modelo ? ` ${v.modelo}` : ''}`}{v.placa && <> <span className="placa-mono">{v.placa}</span></>}</span>
            ) : (
              <span>{f.motivoCancelamento ? `Cancelado: ${f.motivoCancelamento}` : 'Cancelado antes de fechar com um motorista.'}</span>
            )}
            {pago && f.concluidoEm && (
              <span className="anterior__quando">
                Entregue em {diaMes(f.concluidoEm)} às {horaMinuto(f.concluidoEm)}
                {avaliacoes.fase === 'pronto' && (minha ? ` · você deu nota ${minha.nota}` : ' · você não avaliou')}
              </span>
            )}
          </div>
          <Link to={`/cliente/fretes/novo?de=${f.id}`} className="botao botao--secundario">Pedir de novo</Link>
        </div>
      )}
    </li>
  )
}
