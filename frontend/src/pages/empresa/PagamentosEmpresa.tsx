import { Link } from 'react-router-dom'
import { api } from '../../api/cliente'
import type { Frete, Pagamento, Pagina, StatusPagamento } from '../../api/tipos'
import { ouNulo, useRecurso } from '../../api/useRecurso'
import { Valor } from '../../components/Dinheiro'
import { Etiqueta, ErroCarga, Esqueleto, Km, Vazio } from '../../components/ui'
import { dataCurta, dataHora, reaisCentavos, type Tom } from '../../formato'
import { useSessao } from '../../sessao'
import { useTitulo } from '../../useTitulo'

/** O mesmo status, dito do lado de quem pagou: o motorista lê "aguardando o Pix", a empresa lê "Pix a pagar". */
const SITUACAO: Record<StatusPagamento | 'SEM_PIX', { rotulo: string; tom: Tom }> = {
  SEM_PIX: { rotulo: 'Pix a pagar', tom: 'alerta' },
  PENDENTE: { rotulo: 'Pix a pagar', tom: 'alerta' },
  RETIDO: { rotulo: 'Pago, em garantia', tom: 'garantido' },
  ADIANTAMENTO_LIBERADO: { rotulo: 'Adiantamento repassado', tom: 'garantido' },
  LIBERADO: { rotulo: 'Repassado ao motorista', tom: 'garantido' },
  ESTORNADO: { rotulo: 'Devolvido a você', tom: 'neutro' },
}

type Linha = { frete: Frete; pagamento: Pagamento | null }

/** Para onde foi o dinheiro depois do Pix: o repasse ao motorista em duas partes, ou a devolução. */
function repasse({ pagamento: p }: Linha) {
  if (!p || p.status === 'PENDENTE') return '—'
  if (p.status === 'ESTORNADO') return p.estornadoEm ? `Devolvido em ${dataCurta(p.estornadoEm)}` : 'Devolvido'
  if (p.status === 'LIBERADO') return p.saldoLiberadoEm ? `Tudo repassado; saldo em ${dataCurta(p.saldoLiberadoEm)}` : 'Tudo repassado'
  const adiantamento = p.adiantamentoLiberadoEm ? `Adiantamento em ${dataCurta(p.adiantamentoLiberadoEm)}` : 'Adiantamento na saída para a viagem'
  const saldo = p.saldoBloqueado ? 'saldo retido pela contestação'
    : p.saldoLiberavelApos ? `saldo a partir de ${dataHora(p.saldoLiberavelApos)}` : 'saldo depois da entrega'
  return `${adiantamento}; ${saldo}`
}

/*
 * Pagamentos da empresa: cada Pix de frete fechado, o que já foi repassado ao motorista e o que o
 * Fretaí ainda guarda em garantia. Fretes sem motorista ainda não têm cobrança e não entram.
 */
export function PagamentosEmpresa() {
  useTitulo('Pagamentos')
  const { tokens } = useSessao()
  const empresaId = tokens?.empresaId ?? ''
  const [estado, recarregar] = useRecurso(async () => {
    const pagina = await api<Pagina<Frete>>('GET', `/api/fretes/empresa/${empresaId}?size=100`)
    const fechados = pagina.content.filter((f) => !['PUBLICADO', 'PROPOSTA_ENVIADA'].includes(f.status))
    const pagamentos = await Promise.all(fechados.map((f) => ouNulo(api<Pagamento>('GET', `/api/fretes/${f.id}/pagamento`))))
    // Cancelado antes de gerar o Pix não tem dinheiro nenhum para mostrar.
    return fechados.map((frete, i) => ({ frete, pagamento: pagamentos[i] })).filter((l) => l.pagamento != null || l.frete.status === 'ACEITO')
  }, [empresaId])

  return (
    <div className="fretes-e">
      <h1 className="titulo-pagina">Pagamentos</h1>
      {estado.fase === 'carregando' && (estado.mostrarEsqueleto ? <><Esqueleto linhas={2} /><Esqueleto linhas={5} /></> : <div className="reserva-tabela" />)}
      {estado.fase === 'erro' && <ErroCarga problema={estado.problema} tentarDeNovo={recarregar} />}
      {estado.fase === 'pronto' && estado.dados.length === 0 && (
        <Vazio titulo="Nenhum pagamento ainda." acao={<Link to="/empresa" className="botao botao--secundario">Ver os fretes</Link>}>
          O Pix de um frete é gerado quando você aceita a proposta de um motorista.
        </Vazio>
      )}
      {estado.fase === 'pronto' && estado.dados.length > 0 && <Tabela linhas={estado.dados} />}
    </div>
  )
}

function Tabela({ linhas }: { linhas: Linha[] }) {
  let pago = 0
  let garantia = 0
  let aPagar = 0
  let devolvido = 0
  for (const { frete, pagamento: p } of linhas) {
    if (!p || p.status === 'PENDENTE') aPagar += p?.valorTotal ?? frete.valorAcordado ?? frete.valorTotal ?? 0
    else if (p.status === 'ESTORNADO') devolvido += p.valorTotal
    else {
      pago += p.valorTotal
      if (p.status === 'RETIDO') garantia += p.valorTotal
      if (p.status === 'ADIANTAMENTO_LIBERADO') garantia += p.valorSaldo
    }
  }
  return (
    <>
      <section className="cartao pagamentos-e__resumo" aria-label="Resumo">
        <div className="pagamentos-e__numeros">
          <div className="dinheiro__parte">
            <p className="dinheiro__rotulo dinheiro__rotulo--garantido">Pago em Pix</p>
            <Valor valor={pago} tamanho="grande" centavos />
          </div>
          <div className="dinheiro__parte">
            <p className="dinheiro__rotulo">Em garantia no Fretaí</p>
            <Valor valor={garantia} tamanho="grande" centavos />
          </div>
          {aPagar > 0 && (
            <div className="dinheiro__parte">
              <p className="dinheiro__rotulo pagamentos-e__a-pagar">Pix a pagar</p>
              <Valor valor={aPagar} tamanho="grande" centavos />
            </div>
          )}
          {devolvido > 0 && (
            <div className="dinheiro__parte">
              <p className="dinheiro__rotulo">Devolvido</p>
              <Valor valor={devolvido} tamanho="grande" centavos />
            </div>
          )}
        </div>
        <p className="pagamentos-e__nota">Em garantia é o que já saiu da empresa e ainda não chegou ao motorista: o saldo só é repassado depois da entrega e do prazo de contestação.</p>
      </section>

      <div className="tabela-rolagem cartao">
        <table className="tabela">
          <thead>
            <tr>
              <th scope="col">Frete</th>
              <th scope="col">Pix pago</th>
              <th scope="col" className="tabela__num">Valor</th>
              <th scope="col">Situação</th>
              <th scope="col">Repasse ao motorista</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const { frete: f, pagamento: p } = l
              const situacao = SITUACAO[p?.status ?? 'SEM_PIX']
              const valor = p?.valorTotal ?? f.valorAcordado ?? f.valorTotal
              const aPagar = !p || p.status === 'PENDENTE'
              return (
                <tr key={f.id}>
                  <td>
                    <div className="tabela__rota-cel">
                      <Link to={`/empresa/fretes/${f.id}${aPagar ? '?aba=pagamento' : ''}`} className="tabela__rota">
                        {f.coleta.cidade}/{f.coleta.uf} → {f.entrega.cidade}/{f.entrega.uf}
                      </Link>
                      {f.distanciaKm != null && <Km km={f.distanciaKm} />}
                    </div>
                  </td>
                  <td className="tabela__data">{p?.pagoEm ? dataCurta(p.pagoEm) : '—'}</td>
                  <td className="tabela__num">{valor != null ? `R$ ${reaisCentavos(valor)}` : '—'}</td>
                  <td><Etiqueta tom={situacao.tom}>{situacao.rotulo}</Etiqueta></td>
                  <td className="tabela__sub">{aPagar ? <Link to={`/empresa/fretes/${f.id}?aba=pagamento`} className="pagamentos-e__pagar">Pagar o Pix</Link> : repasse(l)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
