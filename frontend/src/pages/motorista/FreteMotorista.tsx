import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, comoProblema, ErroApi } from '../../api/cliente'
import type { Contato, EventoFrete, FotoCarga, Frete, Pagamento, Pagina, PerfilEmpresa, Proposta, Veiculo } from '../../api/tipos'
import { useRecurso } from '../../api/useRecurso'
import { Avaliar } from '../../components/Avaliar'
import { CabecalhoPagina } from '../../components/CabecalhoPagina'
import { CancelarComMotivo } from '../../components/CancelarComMotivo'
import { Reputacao } from '../../components/CardFrete'
import { ChipPiso, Valor } from '../../components/Dinheiro'
import { DocumentosDoMotorista } from '../../components/Documentos'
import { FretesDeVolta } from '../../components/FretesDeVolta'
import { RotaLinha } from '../../components/RotaLinha'
import { Aviso, ErroCarga, Esqueleto, Marcos } from '../../components/ui'
import { exigenciaDoFrete, porQueNaoLeva, tituloDoFrete } from '../../compatibilidade'
import { carga, contar, contratante, dataHora, diaDaSemana, diaMes, faixaDoPeso, horaMinuto, maiuscula, porKm, reais, reaisCentavos } from '../../formato'
import { useComputador } from '../../largura'
import { recebimentos } from '../../recebimentos'
import { useSessao } from '../../sessao'
import { useTitulo } from '../../useTitulo'
import { linkWhatsApp } from '../../whatsapp'

/** Erro de permissão ou ausência vira "não tem": quem não participa do frete não vê histórico nem cobrança. */
const talvez = <T,>(p: Promise<T>) => p.catch((e) => (e instanceof ErroApi && [403, 404].includes(e.problema.status) ? null : Promise.reject(e)))
const garantido = (p: Pagamento | null) => p != null && ['RETIDO', 'ADIANTAMENTO_LIBERADO', 'LIBERADO'].includes(p.status)
const MOTIVOS = ['Problema com o veículo', 'Não vou conseguir no dia', 'A carga é diferente do anunciado']
const CONSULTA_PIX_MS = 4000
const brl = (v: number) => `R$ ${reais(v)}`

/** Quem contratou, como o motorista fala: "Juliana" (pessoa física) ou o nome da empresa. */
const nomeCurto = (f: Frete) => (f.cliente ? f.cliente.nome.split(' ')[0] : contratante(f).nome)

/*
 * O frete visto pelo motorista, como no canvas: rota, valor, o que vai (com as fotos) e quem contratou em
 * cima; embaixo (ao lado, no computador) o que fazer agora: aceitar ou propor, esperar o Pix, sair,
 * registrar a entrega ou desistir. Endereço completo, quem recebe e o WhatsApp só depois de fechar.
 */
export function FreteMotorista() {
  const { id = '' } = useParams()
  const { tokens } = useSessao()
  const computador = useComputador()
  const [estado, recarregar] = useRecurso(async () => {
    const frete = await api<Frete>('GET', `/api/fretes/${id}`)
    const [eventos, pagamento, perfil, minhas, fotos] = await Promise.all([
      talvez(api<EventoFrete[]>('GET', `/api/fretes/${id}/eventos`)),
      talvez(api<Pagamento>('GET', `/api/fretes/${id}/pagamento`)),
      frete.empresa ? talvez(api<PerfilEmpresa>('GET', `/api/empresas/${frete.empresa.id}/perfil`)) : null,
      talvez(api<Pagina<Proposta>>('GET', '/api/propostas/minhas?size=100')),
      talvez(api<FotoCarga[]>('GET', `/api/fretes/${id}/fotos`)),
    ])
    // A proposta que este motorista mandou e quem contratou ainda não respondeu: no lugar de negociar de novo.
    const minha = minhas?.content.find((p) => p.freteId === id && p.status === 'ENVIADA') ?? null
    return { frete, eventos: eventos ?? [], pagamento, perfil, minha, fotos: fotos ?? [] }
  }, [id])

  useTitulo(estado.fase === 'pronto' ? tituloDoFrete(estado.dados.frete) : 'Frete')

  if (estado.fase === 'carregando') return <div className="frete-m">{estado.mostrarEsqueleto && <><Esqueleto linhas={2} /><Esqueleto linhas={5} /></>}</div>
  if (estado.fase === 'erro') return <div className="frete-m"><ErroCarga problema={estado.problema} tentarDeNovo={recarregar} /></div>

  const { frete, eventos, perfil, minha, fotos } = estado.dados
  const meu = frete.motorista?.id === tokens?.usuarioId
  const aberto = frete.status === 'PUBLICADO' || frete.status === 'PROPOSTA_ENVIADA'
  const fechado = meu && ['ACEITO', 'EM_TRANSITO', 'ENTREGUE'].includes(frete.status)
  const valor = frete.valorAcordado ?? frete.valorTotal ?? frete.valor
  const quem = contratante(frete)
  const titulo = tituloDoFrete(frete)

  return (
    <div className="frete-m">
      {computador
        ? <div className="pedido__topo"><Link to={meu ? '/motorista/meus-fretes' : '/motorista'} className="voltar">{meu ? 'Meus fretes' : 'Fretes perto'}</Link><h1 className="titulo-pagina">{titulo}</h1></div>
        : <CabecalhoPagina titulo={titulo} voltar={meu ? '/motorista/meus-fretes' : '/motorista'} />}

      <div className="frete-m__colunas">
        <div className="frete-m__corpo">
          <section className="frete-m__bloco" aria-label="Rota">
            <RotaLinha coleta={frete.coleta} entrega={frete.entrega} distanciaKm={frete.distanciaKm} estimada={frete.distanciaEstimada} grande />
            <p className="frete-m__quando">
              {maiuscula(diaDaSemana(frete.dataColeta))}
              {frete.feriado ? ` · feriado${frete.nomeFeriado ? ` (${frete.nomeFeriado})` : ''}` : ''}{frete.domingo ? ' · domingo' : ''}
            </p>
          </section>

          <section className="frete-m__bloco" aria-label="Valor">
            {valor == null || (frete.valorACombinar && !frete.valorAcordado) ? (
              <p className="card-frete__combinar">A combinar</p>
            ) : (
              <div className="frete-m__numeros">
                <Valor valor={valor} tamanho="grande" />
                <span className="frete-m__de">{frete.valorAcordado ? 'valor fechado' : `oferta ${frete.cliente ? 'de quem pediu' : `d${quem.quem}`}`}</span>
                {frete.distanciaKm ? <span className="card-frete__porkm">R$&nbsp;{porKm(valor, frete.distanciaKm)}/km</span> : null}
              </div>
            )}
            <ChipPiso preco={frete.preco} valor={valor} />
            {aberto && <p className="frete-c__texto--menor">Quando vocês fecham, {quem.quem} paga por Pix. O dinheiro fica guardado e vai para você depois da entrega confirmada.</p>}
            {frete.distanciaKm != null && (
              <Link className="frete-m__conta" to={`/motorista/calculadora?${new URLSearchParams(Object.entries({
                km: String(frete.distanciaKm), valor: valor != null ? String(valor) : '', carga: frete.tipoCargaAntt ?? '',
                eixos: frete.preco?.eixosConsiderados != null ? String(frete.preco.eixosConsiderados) : '',
              }).filter(([, v]) => v))}`}>Esse frete paga a viagem? Fazer a conta</Link>
            )}
            {frete.preco?.acimaDaMedia && (
              <Aviso tom="alerta" titulo="Valor muito acima da média desta rota.">Golpe comum: valor alto para atrair motorista. Confira {quem.quem} antes de carregar.</Aviso>
            )}
          </section>

          <section className="frete-m__bloco" aria-labelledby="t-carga">
            <h2 id="t-carga">O que vai</h2>
            {frete.descricaoCarga && <p>{frete.descricaoCarga}{frete.especieCarga ? ` · ${frete.especieCarga}` : ''}</p>}
            <p className="frete-c__texto--menor">
              {[frete.pesoKg != null ? faixaDoPeso(frete.pesoKg) : null, exigenciaDoFrete(frete).toLowerCase(), frete.tipoCargaAntt ? carga(frete.tipoCargaAntt) : null,
                frete.exigeRastreador ? 'rastreador obrigatório' : null].filter(Boolean).join(' · ')}
            </p>
            {fotos.length > 0 && (
              <ul className="frete-m__fotos" aria-label="Fotos da carga">
                {fotos.map((f, i) => <li key={f.id}><a href={f.url} target="_blank" rel="noreferrer"><img src={f.url} alt={`Foto ${i + 1} da carga`} /></a></li>)}
              </ul>
            )}
          </section>

          <section className="frete-m__bloco" aria-labelledby="t-quem">
            <h2 id="t-quem">{frete.cliente ? 'Cliente' : frete.publicadoPorAgenciador ? 'Agenciador' : 'Empresa'}</h2>
            {frete.cliente
              ? <p>{abreviado(frete.cliente.nome)} · pessoa física</p>
              : <Reputacao nome={frete.empresa?.razaoSocial ?? quem.nome} perfil={perfil ?? undefined} />}
            {perfil && <p className="frete-c__texto--menor">Na plataforma desde {new Date(perfil.naPlataformaDesde).getFullYear()} · {contar(perfil.fretesConcluidos, 'frete concluído', 'fretes concluídos')}</p>}
            {fechado && (
              <div className="frete-m__enderecos">
                <p>Coleta: {frete.coleta.enderecoCompleto}</p>
                <p>Entrega: {frete.entrega.enderecoCompleto}</p>
                {frete.nomeDestinatario && <p>Quem recebe: {frete.nomeDestinatario}{frete.telefoneDestinatario && <> · <a href={`tel:${frete.telefoneDestinatario.replace(/\D/g, '')}`}>{frete.telefoneDestinatario}</a></>}</p>}
                <WhatsApp freteId={frete.id} nome={nomeCurto(frete)} />
              </div>
            )}
          </section>

          {meu && !aberto && frete.status !== 'CANCELADO' && (
            <section className="frete-m__bloco" aria-labelledby="t-andamento">
              <h2 id="t-andamento">Andamento</h2>
              <Marcos status={frete.status} eventos={eventos} visao="motorista" orientacao="vertical" motivoCancelamento={frete.motivoCancelamento} />
            </section>
          )}

          {meu && (frete.status === 'ENTREGUE' || frete.status === 'PAGO') && (
            <section className="frete-m__bloco" aria-labelledby="t-avaliacao">
              <h2 id="t-avaliacao">Como foi com {nomeCurto(frete)}?</h2>
              <Avaliar freteId={frete.id} lado="MOTORISTA" nomeAvaliado={quem.nome} perguntaNoTitulo />
            </section>
          )}

          {tokens && (minha || (meu && (frete.status === 'ACEITO' || frete.status === 'EM_TRANSITO'))) && (
            <section className="frete-m__bloco" aria-labelledby="t-documentos">
              <h2 id="t-documentos">Seus documentos para {quem.nome}</h2>
              <DocumentosDoMotorista freteId={frete.id} motoristaId={tokens.usuarioId} />
            </section>
          )}

          {meu && ['EM_TRANSITO', 'ENTREGUE', 'PAGO'].includes(frete.status) && <FretesDeVolta frete={frete} />}
        </div>

        <aside className="frete-m__acoes" aria-label="O que fazer">
          <Acoes dados={estado.dados} meu={meu} aberto={aberto} aoMudar={recarregar} />
        </aside>
      </div>
    </div>
  )
}

/** "Juliana M.": o motorista vê o primeiro nome e a inicial do sobrenome antes do endereço. */
function abreviado(nome: string) {
  const partes = nome.trim().split(/\s+/)
  return partes.length > 1 ? `${partes[0]} ${partes[partes.length - 1][0]}.` : partes[0]
}

/** O WhatsApp de quem contratou, depois de fechar. O pagamento fica no Fretaí, fora da conversa. */
function WhatsApp({ freteId, nome }: { freteId: string; nome: string }) {
  const [contato] = useRecurso(() => talvez(api<Contato>('GET', `/api/fretes/${freteId}/contato`)), [freteId])
  if (contato.fase !== 'pronto' || !contato.dados) return null
  return (
    <div className="frete-c__zap">
      <a className="botao botao--secundario botao--largo" href={linkWhatsApp(contato.dados.telefone)} target="_blank" rel="noreferrer">Chamar {nome} no WhatsApp</a>
      <p className="frete-c__texto--menor">Pagamento e comprovantes ficam no Fretaí, fora do WhatsApp. Não combine pagamento por fora.</p>
    </div>
  )
}

type Dados = { frete: Frete; eventos: EventoFrete[]; pagamento: Pagamento | null; minha: Proposta | null }

function Acoes({ dados, meu, aberto, aoMudar }: { dados: Dados; meu: boolean; aberto: boolean; aoMudar: () => void }) {
  const { frete, eventos } = dados
  const [pagamento, setPagamento] = useState(dados.pagamento)
  const [desistindo, setDesistindo] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [erroCancelar, setErroCancelar] = useState<string | null>(null)
  const [desistiu, setDesistiu] = useState<{ pix: boolean } | null>(null)
  const [iniciando, setIniciando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const nome = nomeCurto(frete)
  const pago = garantido(pagamento)

  // Fechado e sem Pix: a tela pergunta ao Fretaí a cada 4 s, só enquanto está aberta.
  const esperandoPix = meu && frete.status === 'ACEITO' && !pago
  useEffect(() => {
    if (!esperandoPix) return
    const t = setInterval(() => talvez(api<Pagamento>('GET', `/api/fretes/${frete.id}/pagamento`)).then((p) => p && setPagamento(p)).catch(() => undefined), CONSULTA_PIX_MS)
    return () => clearInterval(t)
  }, [esperandoPix, frete.id])

  async function iniciar() {
    setIniciando(true)
    setErro(null)
    try {
      await api('POST', `/api/fretes/${frete.id}/inicio`)
      aoMudar()
    } catch (e) {
      setErro(comoProblema(e).detail)
      setIniciando(false)
    }
  }

  async function desistir(motivo: string) {
    setCancelando(true)
    setErroCancelar(null)
    try {
      await api('POST', `/api/fretes/${frete.id}/cancelamento`, { motivo })
      setDesistindo(false)
      setDesistiu({ pix: pago })
    } catch (e) {
      setErroCancelar(comoProblema(e).detail)
    } finally {
      setCancelando(false)
    }
  }

  if (desistiu) {
    return (
      <div className="frete-m__painel" role="status">
        <p className="frete-m__estado frete-m__estado--perigo">Frete cancelado. Avisamos {nome}{desistiu.pix ? ', e o Pix volta para quem pagou.' : '.'}</p>
        <Link to="/motorista" className="botao botao--primario botao--largo">Ver outros fretes</Link>
      </div>
    )
  }

  if (aberto && !meu) return dados.minha ? <MinhaProposta proposta={dados.minha} frete={frete} aoMudar={aoMudar} /> : <Negociar frete={frete} aoMudar={aoMudar} />
  // Daqui para baixo o frete saiu da vitrine. Quem abre um frete cancelado, ou fechado com outro motorista
  // (por um link antigo ou pela lista de Concluídos), tem de ler o que aconteceu, e não uma tela sem botão.
  if (frete.status === 'CANCELADO') {
    return (
      <Encerrado tom="perigo" texto={quemCancelou(frete, eventos, meu)}>
        {meu && frete.motivoCancelamento && <p className="frete-c__texto--menor">Motivo: {frete.motivoCancelamento}</p>}
        {meu && pagamento?.status === 'ESTORNADO' && <p className="frete-c__texto--menor">O Pix voltou para quem pagou.</p>}
      </Encerrado>
    )
  }
  if (!meu) return <Encerrado tom="info" texto="Este frete já foi fechado com outro motorista." />

  if (frete.status === 'ACEITO') {
    const valor = pagamento?.valorTotal ?? frete.valorAcordado ?? frete.valor
    return (
      <div className="frete-m__painel" aria-live="polite">
        {pago ? (
          <>
            <p className="frete-m__estado frete-m__estado--garantido">
              <Certo />
              Pix confirmado: {valor != null ? brl(valor) : 'valor'} guardado
            </p>
            {erro && <Aviso tom="perigo" titulo="Não deu para iniciar.">{erro}</Aviso>}
            <button type="button" className="botao botao--primario botao--largo" onClick={iniciar} disabled={iniciando}>{iniciando ? 'Iniciando…' : 'Carreguei, iniciar viagem'}</button>
          </>
        ) : (
          <>
            <p className="frete-m__estado frete-m__estado--info">Fechado com {nome}. Esperando o Pix.</p>
            <p className="frete-c__texto--menor">Não saia para a coleta antes de aparecer “Pix confirmado”.</p>
          </>
        )}
        <button type="button" className="botao botao--fantasma frete-c__cancelar" aria-haspopup="dialog" onClick={() => setDesistindo(true)}>Desistir do frete</button>
        <CancelarComMotivo
          aberta={desistindo}
          titulo={`Desistir do frete de ${nome}?`}
          texto={`Avisamos ${nome} na hora${pago && valor != null ? `, e o Pix de ${brl(valor)} volta para quem pagou` : ''}. Depois que a carga sai, não dá mais para desistir.`}
          pergunta="Por que você vai desistir?"
          motivos={MOTIVOS}
          rotuloConfirmar="Sim, desistir do frete"
          rotuloManter="Continuar com o frete"
          enviando={cancelando}
          erro={erroCancelar}
          aoConfirmar={desistir}
          aoFechar={() => setDesistindo(false)}
        />
      </div>
    )
  }

  if (frete.status === 'EM_TRANSITO') {
    const saiu = [...eventos].reverse().find((e) => e.para === 'EM_TRANSITO')?.ocorridoEm
    return (
      <div className="frete-m__painel">
        <p className="frete-m__estado frete-m__estado--info" role="status">{saiu ? `Na estrada desde ${horaMinuto(saiu)}` : 'Na estrada'}</p>
        <p className="frete-c__texto--menor">Na entrega: foto, assinatura de quem recebeu e GPS a até 500 m do destino. É isso que libera o pagamento.</p>
        <Link to={`/motorista/fretes/${frete.id}/entrega`} className="botao botao--primario botao--largo">Cheguei, registrar entrega</Link>
      </div>
    )
  }

  // Entregue: a pergunta do motorista é quando o saldo cai. Com contestação, por que não caiu.
  if (frete.status === 'ENTREGUE') {
    const saldo = pagamento?.valorSaldo ?? 0
    if (pagamento?.saldoBloqueado) {
      return (
        <div className="frete-m__painel">
          <p className="frete-m__estado frete-m__estado--alerta" role="status">Entrega contestada: o saldo de {brl(saldo)} fica parado até a análise.</p>
          <p className="frete-c__texto--menor">Um administrador do Fretaí confere a foto, a assinatura e o GPS do canhoto e decide.</p>
        </div>
      )
    }
    if (saldo <= 0) return <div className="frete-m__painel"><p className="frete-m__estado frete-m__estado--info" role="status">Entrega registrada.</p></div>
    return (
      <div className="frete-m__painel">
        <p className="frete-m__estado frete-m__estado--garantido" role="status"><Certo />Entrega registrada: saldo de {brl(saldo)} guardado</p>
        <p className="frete-c__texto--menor">
          {pagamento?.saldoLiberavelApos
            ? `Cai na sua chave Pix a partir de ${dataHora(pagamento.saldoLiberavelApos)}, se ninguém contestar a entrega.`
            : 'Cai na sua chave Pix depois do prazo de contestação.'}
        </p>
      </div>
    )
  }

  // Pago: o que caiu e quando, com centavos, porque aqui o total tem de bater com as parcelas.
  if (frete.status === 'PAGO') {
    const parcelas = pagamento ? recebimentos(pagamento) : []
    const total = parcelas.reduce((t, r) => t + r.valor, 0)
    return (
      <div className="frete-m__painel">
        <p className="frete-m__estado frete-m__estado--garantido"><Certo />{parcelas.length > 0 ? `Frete pago: R$ ${reaisCentavos(total)}` : 'Frete pago'}</p>
        {parcelas.length > 1 && (
          <dl className="ficha ficha--compacta">
            {parcelas.map((r) => <div key={r.parcela}><dt>{r.parcela}</dt><dd>R$&nbsp;{reaisCentavos(r.valor)}{r.quando ? ` em ${diaMes(r.quando)}` : ''}</dd></div>)}
          </dl>
        )}
        {parcelas.length === 1 && parcelas[0].quando && <p className="frete-c__texto--menor">Caiu na sua chave Pix em {diaMes(parcelas[0].quando)}.</p>}
        <Link to="/motorista/extrato" className="frete-m__conta">Ver no extrato</Link>
      </div>
    )
  }
  return null
}

const Certo = () => <svg className="icone-traco" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>

/** O frete saiu da vitrine: uma linha que diz por quê, o detalhe que houver e o caminho de volta à busca. */
function Encerrado({ tom, texto, children }: { tom: 'info' | 'perigo'; texto: string; children?: ReactNode }) {
  return (
    <div className="frete-m__painel">
      <p className={`frete-m__estado frete-m__estado--${tom}`}>{texto}</p>
      {children}
      <Link to="/motorista" className="botao botao--primario botao--largo">Ver outros fretes</Link>
    </div>
  )
}

/** Quem cancelou, pelo último evento do frete. Para quem não participa, só o fato: o histórico não é dele. */
function quemCancelou(frete: Frete, eventos: EventoFrete[], meu: boolean) {
  const autor = meu ? [...eventos].reverse().find((e) => e.para === 'CANCELADO')?.autorPapel : null
  if (autor === 'MOTORISTA') return 'Você desistiu deste frete.'
  if (autor === 'CLIENTE' || autor === 'EMPRESA') return `${nomeCurto(frete)} cancelou este frete.`
  return 'Este frete foi cancelado.'
}

/** A proposta enviada fica onde estavam os botões de negociar, com retirar. */
function MinhaProposta({ proposta, frete, aoMudar }: { proposta: Proposta; frete: Frete; aoMudar: () => void }) {
  const [fase, setFase] = useState<'parado' | 'confirmar' | 'enviando'>('parado')
  const [erro, setErro] = useState<string | null>(null)
  const quem = contratante(frete).quem
  const oferta = frete.valorTotal ?? frete.valor

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
    <div className="frete-m__painel">
      <p className="frete-m__estado frete-m__estado--info" role="status">Proposta enviada: {brl(proposta.valor)}. {maiuscula(quem)} decide.</p>
      {oferta != null && <p className="frete-c__texto--menor">Se outro motorista aceitar os {brl(oferta)} antes, o frete sai da lista.</p>}
      {erro && <Aviso tom="perigo" titulo="Não deu para retirar.">{erro}</Aviso>}
      {fase === 'confirmar' ? (
        <>
          <p>Retirar a proposta? {maiuscula(quem)} deixa de ver o seu valor.</p>
          <button type="button" className="botao botao--perigo botao--largo" onClick={retirar}>Retirar proposta</button>
          <button type="button" className="botao botao--fantasma botao--largo" onClick={() => setFase('parado')}>Manter</button>
        </>
      ) : (
        <button type="button" className="botao botao--secundario botao--largo" disabled={fase === 'enviando'} onClick={() => setFase('confirmar')}>
          {fase === 'enviando' ? 'Retirando…' : 'Retirar proposta'}
        </button>
      )}
    </div>
  )
}

/** Aceitar pelo valor ou propor outro. O aceite vai com o primeiro veículo que leva o frete. */
function Negociar({ frete, aoMudar }: { frete: Frete; aoMudar: () => void }) {
  const { tokens } = useSessao()
  const [veiculos] = useRecurso(() => api<Veiculo[]>('GET', `/api/motoristas/${tokens?.usuarioId ?? ''}/veiculos`).catch(() => [] as Veiculo[]), [tokens?.usuarioId])
  const [propondo, setPropondo] = useState(false)
  const valor = frete.valorTotal ?? frete.valor
  const [proposto, setProposto] = useState(valor != null ? String(valor) : '')
  const [adiantamento, setAdiantamento] = useState(40)
  const [enviando, setEnviando] = useState<'aceite' | 'proposta' | null>(null)
  const travado = useRef(false)
  const [falha, setFalha] = useState<string | null>(null)

  const lista = veiculos.fase === 'pronto' ? veiculos.dados : null
  const leva = lista?.find((v) => porQueNaoLeva(frete, v) == null) ?? null
  const numero = Number(proposto.replace(/\./g, '').replace(',', '.'))
  const valido = Number.isFinite(numero) && numero > 0

  async function executar(acao: 'aceite' | 'proposta', e?: FormEvent) {
    e?.preventDefault()
    if (travado.current) return
    travado.current = true
    setEnviando(acao)
    setFalha(null)
    try {
      if (acao === 'aceite') await api('POST', `/api/fretes/${frete.id}/aceite`, { motoristaId: tokens?.usuarioId, veiculoId: leva?.id ?? null })
      else await api('POST', `/api/fretes/${frete.id}/propostas`, { motoristaId: tokens?.usuarioId, veiculoId: leva?.id ?? null, valor: numero, adiantamentoPercentual: adiantamento })
      aoMudar()
    } catch (erro) {
      setFalha(comoProblema(erro).detail)
      travado.current = false
      setEnviando(null)
    }
  }

  const semVeiculo = lista != null && !leva
  return (
    <div className="frete-m__painel">
      {semVeiculo && (
        <p className="frete-m__estado frete-m__estado--alerta">
          Cadastre um veículo: este frete precisa de {exigenciaDoFrete(frete).toLowerCase()}. <Link to="/motorista/perfil">Ir para o perfil</Link>
        </p>
      )}
      {propondo ? (
        <form className="frete-m__proposta" onSubmit={(e) => executar('proposta', e)} noValidate>
          <div className="campo">
            <label htmlFor="valor-proposta" className="campo__rotulo">Seu valor (R$)</label>
            <input id="valor-proposta" inputMode="decimal" className="campo__entrada campo__entrada--numero" value={proposto} onChange={(e) => setProposto(e.target.value)} autoFocus />
            {valido && frete.distanciaKm ? (
              <p className="campo__ajuda">
                R$&nbsp;{porKm(numero, frete.distanciaKm)}/km
                {frete.preco?.pisoMinimo ? (numero < frete.preco.pisoMinimo ? `, abaixo do piso ANTT (R$ ${reais(frete.preco.pisoMinimo)})` : ', acima do piso ANTT') : ''}
              </p>
            ) : null}
          </div>
          {!frete.cliente && (
            <div className="campo">
              <label htmlFor="adiantamento" className="campo__rotulo">Adiantamento na saída: {adiantamento}%</label>
              <input id="adiantamento" type="range" min={0} max={100} step={10} value={adiantamento} onChange={(e) => setAdiantamento(Number(e.target.value))} className="faixa-deslizante" />
              {valido && (
                <p className="campo__ajuda campo__ajuda--numeros">
                  R$&nbsp;{reais((numero * adiantamento) / 100)} na saída e R$&nbsp;{reais(numero - (numero * adiantamento) / 100)} na entrega
                </p>
              )}
            </div>
          )}
          {falha && <Aviso tom="perigo" titulo="Não deu certo.">{falha}</Aviso>}
          <button type="submit" className="botao botao--primario botao--largo" disabled={!valido || semVeiculo || enviando != null}>{enviando === 'proposta' ? 'Enviando…' : 'Enviar proposta'}</button>
          <button type="button" className="botao botao--fantasma botao--largo" onClick={() => setPropondo(false)}>Voltar</button>
        </form>
      ) : (
        <>
          {falha && <Aviso tom="perigo" titulo="Não deu certo.">{falha}</Aviso>}
          {valor != null && !frete.valorACombinar && (
            <button type="button" className="botao botao--primario botao--largo" disabled={lista == null || semVeiculo || enviando != null} onClick={() => executar('aceite')}>
              {enviando === 'aceite' ? 'Aceitando…' : `Aceitar por ${brl(valor)}`}
            </button>
          )}
          <button type="button" className="botao botao--secundario botao--largo" onClick={() => setPropondo(true)}>Propor outro valor</button>
        </>
      )}
    </div>
  )
}
