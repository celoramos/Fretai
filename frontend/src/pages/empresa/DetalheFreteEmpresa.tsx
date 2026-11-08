import { useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { api, ErroApi } from '../../api/cliente'
import type { EventoFrete, Frete, Pagamento, PerfilMotorista, Problema, Proposta } from '../../api/tipos'
import { ouNulo, useRecurso } from '../../api/useRecurso'
import { Avaliar } from '../../components/Avaliar'
import { CancelarFrete } from '../../components/CancelarFrete'
import { DocumentosParaEmpresa } from '../../components/Documentos'
import { ChipPiso, MedidorGarantia, SeloGarantido, Valor } from '../../components/Dinheiro'
import { useTitulo } from '../../useTitulo'
import { PainelEntrega } from './PainelEntrega'
import { RotaLinha } from '../../components/RotaLinha'
import { Aviso, Etiqueta, ErroCarga, Esqueleto, Indicador, Marcos, Placa, StatusFreteEtiqueta, Vazio } from '../../components/ui'
import { carroceria, dataCurta, dataHora, PAPEL, reais, STATUS_FRETE, STATUS_PROPOSTA, veiculo } from '../../formato'

const ABAS = [
  { id: 'propostas', rotulo: 'Propostas' },
  { id: 'pagamento', rotulo: 'Pagamento' },
  { id: 'entrega', rotulo: 'Entrega' },
  { id: 'documentos', rotulo: 'Documentos' },
  { id: 'historico', rotulo: 'Histórico' },
] as const
type Aba = (typeof ABAS)[number]['id']

export function DetalheFreteEmpresa() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const aba = (params.get('aba') as Aba | null) ?? 'propostas'
  // Vindo de "Publicar frete" ou de "Editar frete": a confirmação aparece uma vez, no lugar onde o frete já está.
  const vindo = useLocation().state as { publicado?: boolean; editado?: boolean } | null

  const [estado, recarregar] = useRecurso(async () => {
    const [frete, eventos, propostas, pagamento] = await Promise.all([
      api<Frete>('GET', `/api/fretes/${id}`),
      api<EventoFrete[]>('GET', `/api/fretes/${id}/eventos`),
      api<Proposta[]>('GET', `/api/fretes/${id}/propostas`),
      ouNulo(api<Pagamento>('GET', `/api/fretes/${id}/pagamento`)),
    ])
    return { frete, eventos, propostas, pagamento }
  }, [id])

  useTitulo(estado.fase === 'pronto' ? `${estado.dados.frete.coleta.cidade} para ${estado.dados.frete.entrega.cidade}` : 'Frete')

  if (estado.fase === 'carregando') return <div className="detalhe-e">{estado.mostrarEsqueleto && <><Esqueleto linhas={3} /><Esqueleto linhas={8} /></>}</div>
  if (estado.fase === 'erro') return <div className="detalhe-e"><ErroCarga problema={estado.problema} tentarDeNovo={recarregar} /></div>

  const { frete, eventos, propostas, pagamento } = estado.dados
  const valor = frete.valorAcordado ?? frete.valorTotal ?? frete.valor
  const garantido = pagamento != null && ['RETIDO', 'ADIANTAMENTO_LIBERADO', 'LIBERADO'].includes(pagamento.status)
  const abertas = propostas.filter((p) => p.status === 'ENVIADA').length

  return (
    <div className="detalhe-e">
      <Link to="/empresa" className="voltar">Todos os fretes</Link>
      {(vindo?.publicado || vindo?.editado) && (
        <div aria-live="polite">
          {vindo.publicado
            ? <Aviso tom="info" titulo="Frete publicado.">Motoristas perto da coleta já recebem o aviso. As propostas aparecem aqui.</Aviso>
            : <Aviso tom="info" titulo="Frete atualizado.">A distância e o piso ANTT abaixo já são os dos dados novos.</Aviso>}
        </div>
      )}
      <header className="detalhe-e__cabeca cartao">
        <div className="detalhe-e__linha-status">
          <StatusFreteEtiqueta status={frete.status} visao="empresa" />
          {garantido && <SeloGarantido />}
          <span className="detalhe">Coleta {dataCurta(frete.dataColeta)}</span>
          {/* Só antes da primeira proposta: é o que a API aceita (Frete.revisar). */}
          {frete.status === 'PUBLICADO' && (
            <Link to={`/empresa/fretes/${frete.id}/editar`} className="botao botao--secundario detalhe-e__editar">Editar frete</Link>
          )}
        </div>
        <h1 className="visualmente-oculto">Frete de {frete.coleta.cidade} para {frete.entrega.cidade}</h1>
        <div className="detalhe-e__rota-valor">
          <RotaLinha coleta={frete.coleta} entrega={frete.entrega} distanciaKm={frete.distanciaKm} estimada={frete.distanciaEstimada} grande />
          <div className="detalhe-e__valor">
            {valor != null && !(frete.valorACombinar && !frete.valorAcordado) ? <Valor valor={valor} tamanho="grande" /> : <span className="card-frete__combinar">A combinar</span>}
            <ChipPiso preco={frete.preco} valor={valor} />
          </div>
        </div>
        <Marcos status={frete.status} eventos={eventos} visao="empresa" orientacao="horizontal" motivoCancelamento={frete.motivoCancelamento} />
      </header>

      <div className="abas" role="tablist" aria-label="Detalhes do frete">
        {ABAS.map((a) => (
          <button key={a.id} type="button" role="tab" id={`aba-${a.id}`} aria-selected={aba === a.id} aria-controls="painel-frete" className="abas__aba"
            onClick={() => setParams({ aba: a.id })}>
            {aba === a.id && <Indicador id="aba-frete" forma="linha" />}
            {a.rotulo}
            {a.id === 'propostas' && abertas > 0 && <span className="abas__n">{abertas}</span>}
          </button>
        ))}
      </div>

      <div id="painel-frete" role="tabpanel" aria-labelledby={`aba-${aba}`} className="detalhe-e__painel">
        {aba === 'propostas' && <Comparador frete={frete} propostas={propostas} aoMudar={recarregar} />}
        {aba === 'pagamento' && <PainelPagamento frete={frete} pagamento={pagamento} aoMudar={recarregar} />}
        {aba === 'entrega' && <PainelEntrega frete={frete} aoMudar={recarregar} />}
        {aba === 'entrega' && (frete.status === 'ENTREGUE' || frete.status === 'PAGO') && frete.motorista && (
          <section className="bloco cartao" aria-labelledby="avaliacao-motorista">
            <h2 id="avaliacao-motorista" className="bloco__titulo">Avaliação do motorista</h2>
            <Avaliar freteId={frete.id} lado="CONTRATANTE" nomeAvaliado={frete.motorista.nome.split(' ')[0]} />
          </section>
        )}
        {aba === 'documentos' && (
          <section className="cartao bloco" aria-label="Documentos dos motoristas">
            <DocumentosParaEmpresa freteId={frete.id}
              nomes={Object.fromEntries([...propostas.map((p) => [p.motorista.id, p.motorista.nome]), ...(frete.motorista ? [[frete.motorista.id, frete.motorista.nome]] : [])])} />
          </section>
        )}
        {aba === 'historico' && <Historico eventos={eventos} />}
      </div>

      <CancelarFrete frete={frete} pago={garantido} aoCancelar={recarregar} />
    </div>
  )
}

function Comparador({ frete, propostas, aoMudar }: { frete: Frete; propostas: Proposta[]; aoMudar: () => void }) {
  const abertas = propostas.filter((p) => p.status === 'ENVIADA')
  const respondidas = propostas.filter((p) => p.status !== 'ENVIADA')

  const [perfis] = useRecurso(async () => {
    const ids = [...new Set(abertas.map((p) => p.motorista.id))]
    const lista = await Promise.all(ids.map((mid) => api<PerfilMotorista>('GET', `/api/motoristas/${mid}/perfil`).catch(() => null)))
    return Object.fromEntries(lista.filter((p): p is PerfilMotorista => p != null).map((p) => [p.id, p]))
  }, [abertas.map((p) => p.id).join()])
  const mapa = perfis.fase === 'pronto' ? perfis.dados : {}

  if (propostas.length === 0) {
    return <Vazio titulo="Nenhuma proposta ainda.">Motoristas no raio da coleta já recebem o aviso deste frete.</Vazio>
  }

  // Destaques só fazem sentido com mais de uma proposta para comparar.
  const melhorValor = abertas.length > 1 ? abertas.reduce((a, b) => (b.valor < a.valor ? b : a)).id : null
  const comNota = abertas.filter((p) => mapa[p.motorista.id]?.mediaNotas != null)
  const melhorReputacao = comNota.length > 1 ? comNota.reduce((a, b) => (mapa[b.motorista.id].mediaNotas! > mapa[a.motorista.id].mediaNotas! ? b : a)).id : null

  return (
    <>
      {abertas.length > 0 && (
        <div className="comparador">
          {abertas.map((p) => (
            <ColunaProposta key={p.id} frete={frete} proposta={p} perfil={mapa[p.motorista.id]}
              destaques={[p.id === melhorValor && 'Melhor valor', p.id === melhorReputacao && 'Melhor reputação'].filter(Boolean) as string[]}
              aoMudar={aoMudar} />
          ))}
        </div>
      )}
      {respondidas.length > 0 && (
        <section className="respondidas cartao" aria-labelledby="respondidas">
          <h2 id="respondidas" className="bloco__titulo">Respondidas</h2>
          <ul className="lista-linhas">
            {respondidas.map((p) => (
              <li key={p.id} className="linha-respondida">
                <span>{p.motorista.nome}</span>
                <span className="tabela__num">R$&nbsp;{reais(p.valor)}</span>
                <Etiqueta tom={STATUS_PROPOSTA[p.status].tom}>{STATUS_PROPOSTA[p.status].rotulo}</Etiqueta>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

function ColunaProposta({ frete, proposta: p, perfil, destaques, aoMudar }: { frete: Frete; proposta: Proposta; perfil?: PerfilMotorista; destaques: string[]; aoMudar: () => void }) {
  const [fase, setFase] = useState<'parado' | 'confirmar-recusa' | 'enviando'>('parado')
  const [problema, setProblema] = useState<Problema | null>(null)
  const piso = frete.preco?.pisoMinimo

  async function responder(acao: 'aceite' | 'recusa') {
    setFase('enviando')
    setProblema(null)
    try {
      // O caminhão já veio na proposta do motorista; veiculoId só serve quando o motorista aceita contraproposta.
      await api('POST', `/api/propostas/${p.id}/${acao}`)
      aoMudar()
    } catch (e) {
      setProblema(e instanceof ErroApi ? e.problema : { title: 'Erro', detail: String(e), status: 0 })
      setFase('parado')
    }
  }

  return (
    <article className="proposta cartao" aria-labelledby={`prop-${p.id}`}>
      <p className="proposta__destaques">{destaques.map((d) => <span key={d} className="proposta__destaque">{d}</span>)}</p>
      <h3 id={`prop-${p.id}`} className="proposta__nome">{p.motorista.nome}</h3>
      <p className="proposta__reputacao">
        {perfil ? (
          <>
            {perfil.mediaNotas != null ? `★ ${perfil.mediaNotas.toFixed(1).replace('.', ',')}` : 'Sem avaliações'} · {perfil.fretesConcluidos} fretes
          </>
        ) : 'Carregando reputação…'}
      </p>
      {perfil && (
        <p className="proposta__docs">
          {['CNH', 'CRLV'].map((d) => (
            <span key={d} className={perfil.documentosVerificados.includes(d) ? 'doc doc--ok' : 'doc'}>
              {d} {perfil.documentosVerificados.includes(d) ? 'verificada' : 'pendente'}
            </span>
          ))}
        </p>
      )}

      <div className="proposta__valor">
        <Valor valor={p.valor} tamanho="grande" />
        {piso != null && p.valor < piso && <span className="proposta__abaixo">abaixo do piso</span>}
      </div>

      <dl className="ficha ficha--compacta">
        <div><dt>Adiantamento</dt><dd>{p.adiantamentoPercentual}% · R$&nbsp;{reais(p.valorAdiantamento)}</dd></div>
        <div><dt>Na entrega</dt><dd>R$&nbsp;{reais(p.valor - p.valorAdiantamento)}</dd></div>
        {p.prazoEntrega && <div><dt>Entrega até</dt><dd>{dataCurta(p.prazoEntrega)}</dd></div>}
        {p.veiculo && (
          <div>
            <dt>Caminhão</dt>
            <dd className="proposta__caminhao"><Placa placa={p.veiculo.placa} />{veiculo(p.veiculo.tipo)} · {p.veiculo.numeroEixos} eixos · {carroceria(p.veiculo.carroceria)}{p.veiculo.rastreador ? ' · rastreador' : ''}</dd>
          </div>
        )}
      </dl>
      {p.observacao && <blockquote className="proposta__obs">“{p.observacao}”</blockquote>}

      <div className="proposta__acoes" aria-live="polite">
        {problema && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}
        {fase === 'confirmar-recusa' ? (
          <>
            <p className="proposta__confirmar">Recusar a proposta de {p.motorista.nome.split(' ')[0]}? Não dá para desfazer.</p>
            <button type="button" className="botao botao--perigo" onClick={() => responder('recusa')}>Recusar</button>
            <button type="button" className="botao botao--fantasma" onClick={() => setFase('parado')}>Manter</button>
          </>
        ) : (
          <>
            <button type="button" className="botao botao--primario" disabled={fase === 'enviando'} onClick={() => responder('aceite')}>
              {fase === 'enviando' ? 'Enviando…' : `Aceitar por R$ ${reais(p.valor)}`}
            </button>
            <button type="button" className="botao botao--fantasma" disabled={fase === 'enviando'} onClick={() => setFase('confirmar-recusa')}>Recusar</button>
          </>
        )}
      </div>
    </article>
  )
}

function PainelPagamento({ frete, pagamento, aoMudar }: { frete: Frete; pagamento: Pagamento | null; aoMudar: () => void }) {
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(null)
  const [copiado, setCopiado] = useState(false)
  const aceito = !['PUBLICADO', 'PROPOSTA_ENVIADA', 'CANCELADO'].includes(frete.status)

  async function gerar() {
    setEnviando(true)
    setProblema(null)
    try {
      await api('POST', `/api/fretes/${frete.id}/pagamento`)
      aoMudar()
    } catch (e) {
      setProblema(e instanceof ErroApi ? e.problema : { title: 'Erro', detail: String(e), status: 0 })
    } finally {
      setEnviando(false)
    }
  }

  async function copiar(texto: string) {
    await navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  if (!aceito) {
    return <Vazio titulo="A cobrança abre depois do aceite.">Aceite uma proposta e o Pix é gerado aqui. O dinheiro fica guardado até a entrega.</Vazio>
  }
  if (!pagamento) {
    return (
      <div className="pagamento-e cartao" aria-live="polite">
        <Aviso tom="info" titulo="Gere o Pix para o motorista poder carregar.">
          O valor fica retido no provedor de pagamento. O adiantamento sai na saída e o saldo com o canhoto.
        </Aviso>
        {problema && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}
        <button type="button" className="botao botao--primario" onClick={gerar} disabled={enviando}>{enviando ? 'Gerando…' : 'Gerar cobrança Pix'}</button>
      </div>
    )
  }
  return (
    <div className="pagamento-e cartao">
      <MedidorGarantia pagamento={pagamento} />
      {pagamento.status === 'PENDENTE' && (
        <div className="pix">
          {pagamento.pixQrCodeBase64 && <img className="pix__qr" src={`data:image/png;base64,${pagamento.pixQrCodeBase64}`} width={220} height={220} alt="QR Code do Pix" />}
          <div className="pix__texto">
            <p className="bloco__titulo">Pix copia e cola</p>
            {pagamento.pixCopiaECola && <code className="pix__codigo">{pagamento.pixCopiaECola}</code>}
            <div className="pix__acoes" aria-live="polite">
              {pagamento.pixCopiaECola && <button type="button" className="botao botao--secundario" onClick={() => copiar(pagamento.pixCopiaECola!)}>{copiado ? 'Copiado' : 'Copiar código'}</button>}
              {pagamento.vencimento && <span className="detalhe">Vence {dataHora(pagamento.vencimento)}</span>}
            </div>
          </div>
        </div>
      )}
      <dl className="ficha ficha--compacta">
        <div><dt>Total</dt><dd>R$&nbsp;{reais(pagamento.valorTotal)}</dd></div>
        {pagamento.pagoEm && <div><dt>Pago em</dt><dd>{dataHora(pagamento.pagoEm)}</dd></div>}
        {pagamento.adiantamentoLiberadoEm && <div><dt>Adiantamento liberado</dt><dd>{dataHora(pagamento.adiantamentoLiberadoEm)}</dd></div>}
        {pagamento.saldoLiberadoEm && <div><dt>Saldo liberado</dt><dd>{dataHora(pagamento.saldoLiberadoEm)}</dd></div>}
        {pagamento.estornadoEm && <div><dt>Estornado</dt><dd>{dataHora(pagamento.estornadoEm)}</dd></div>}
      </dl>
    </div>
  )
}

function Historico({ eventos }: { eventos: EventoFrete[] }) {
  if (eventos.length === 0) return <Vazio titulo="Nada registrado ainda.">Cada mudança de situação deste frete aparece aqui, com data, hora e quem fez.</Vazio>
  return (
    <div className="tabela-rolagem cartao">
      <table className="tabela">
        <thead>
          <tr><th scope="col">Quando</th><th scope="col">Mudança</th><th scope="col">Quem</th><th scope="col">Observação</th></tr>
        </thead>
        <tbody>
          {[...eventos].reverse().map((e) => (
            <tr key={`${e.ocorridoEm}-${e.para}`}>
              <td className="tabela__num">{dataHora(e.ocorridoEm)}</td>
              <td>{e.de ? `${STATUS_FRETE[e.de].empresa} → ` : ''}{STATUS_FRETE[e.para].empresa}</td>
              <td>{e.autorPapel ? PAPEL[e.autorPapel] : 'Sistema'}</td>
              <td>{e.observacao ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
