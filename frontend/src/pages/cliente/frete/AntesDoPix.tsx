import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api, comoProblema } from '../../../api/cliente'
import type { Frete, Pagamento, PerfilMotorista, Proposta } from '../../../api/tipos'
import { useRecurso } from '../../../api/useRecurso'
import { CabecalhoPagina } from '../../../components/CabecalhoPagina'
import { CancelarComMotivo } from '../../../components/CancelarComMotivo'
import { FecharFolha, Folha } from '../../../components/Folha'
import { RotaLinha } from '../../../components/RotaLinha'
import { Aviso } from '../../../components/ui'
import { CATEGORIAS, TIPOS_CARGA, diaDaSemana, reais } from '../../../formato'
import { useComputador } from '../../../largura'
import { pixPago, type DadosFrete } from './dados'
import { Motorista } from './Motorista'

const MOTIVOS = ['Não preciso mais do frete', 'Vou mudar a data', 'Achei outro jeito de levar']
const CONSULTA_PIX_MS = 4000

const primeiro = (nome: string) => nome.split(' ')[0]
const brl = (v: number) => `R$ ${reais(v)}`

/*
 * O pedido antes do Pix, nas três situações do canvas: procurando motorista, propostas de outro valor e
 * motorista que aceitou o valor. Aceitar uma proposta ou pagar abre a folha do Pix, que acompanha o banco
 * a cada 4 s enquanto está aberta. Cancelar pede o motivo; cancelado, o pedido diz que nada foi cobrado.
 */
export function AntesDoPix({ dados, recarregar }: { dados: DadosFrete; recarregar: () => void }) {
  const computador = useComputador()
  const vindo = useLocation().state as { publicado?: boolean; fotosQueFalharam?: number } | null
  const [frete, setFrete] = useState(dados.frete)
  const [pagamento, setPagamento] = useState<Pagamento | null>(dados.pagamento)
  const [recusadas, setRecusadas] = useState<string[]>([])
  const [pixAberto, setPixAberto] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const travado = useRef(false)
  const [erro, setErro] = useState<string | null>(null)
  const [cancelarAberto, setCancelarAberto] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [erroCancelar, setErroCancelar] = useState<string | null>(null)

  const [propostasEstado] = useRecurso(
    () => (frete.status === 'PROPOSTA_ENVIADA' ? api<Proposta[]>('GET', `/api/fretes/${frete.id}/propostas`) : Promise.resolve([] as Proposta[])),
    [frete.id, frete.status],
  )
  const propostas = propostasEstado.fase === 'pronto'
    ? propostasEstado.dados.filter((p) => p.status === 'ENVIADA' && !recusadas.includes(p.id)) : []

  // Nota e fretes de quem aparece na tela: as propostas e o motorista que aceitou.
  const ids = [...new Set([...propostas.map((p) => p.motorista.id), ...(frete.motorista ? [frete.motorista.id] : [])])]
  const [perfisEstado] = useRecurso(async () => {
    const lista = await Promise.all(ids.map((id) => api<PerfilMotorista>('GET', `/api/motoristas/${id}/perfil`).catch(() => null)))
    return Object.fromEntries(lista.filter((p): p is PerfilMotorista => p != null).map((p) => [p.id, p]))
  }, [ids.join()])
  const perfis = perfisEstado.fase === 'pronto' ? perfisEstado.dados : {}

  // O Pix confirma por webhook: com a folha aberta e a cobrança pendente, a tela pergunta ao Fretaí a cada 4 s.
  const pendente = pixAberto && pagamento?.status === 'PENDENTE'
  useEffect(() => {
    if (!pendente) return
    const t = setInterval(() => {
      api<Pagamento>('GET', `/api/fretes/${frete.id}/pagamento`).then(setPagamento).catch(() => undefined)
    }, CONSULTA_PIX_MS)
    return () => clearInterval(t)
  }, [pendente, frete.id])

  /** Uma chamada por vez: o toque duplo em Aceitar ou Pagar não manda a segunda. */
  async function uma(chave: string, fazer: () => Promise<void>) {
    if (travado.current) return
    travado.current = true
    setOcupado(chave)
    setErro(null)
    try {
      await fazer()
    } catch (falha) {
      setErro(comoProblema(falha).detail)
    } finally {
      travado.current = false
      setOcupado(null)
    }
  }

  /** Cobrança nova, ou a pendente que já existe; abre a folha com o QR Code. */
  async function abrirPix() {
    const atual = await api<Pagamento>('GET', `/api/fretes/${frete.id}/pagamento`).catch(() => null)
    const cobranca = atual && atual.status === 'PENDENTE' ? atual : await api<Pagamento>('POST', `/api/fretes/${frete.id}/pagamento`)
    setPagamento(cobranca)
    setCopiado(false)
    setPixAberto(true)
  }

  const aceitar = (p: Proposta) => uma(`aceitar-${p.id}`, async () => {
    await api('POST', `/api/propostas/${p.id}/aceite`)
    setFrete(await api<Frete>('GET', `/api/fretes/${frete.id}`))
    await abrirPix()
  })
  const recusar = (p: Proposta) => uma(`recusar-${p.id}`, async () => {
    await api('POST', `/api/propostas/${p.id}/recusa`)
    setRecusadas((r) => [...r, p.id])
  })
  const pagar = () => uma('pagar', abrirPix)

  function copiar() {
    if (!pagamento?.pixCopiaECola) return
    setCopiado(true)
    // Sem permissão de área de transferência, o código continua na tela para copiar à mão.
    navigator.clipboard?.writeText(pagamento.pixCopiaECola).catch(() => undefined)
  }

  async function cancelar(motivo: string) {
    setCancelando(true)
    setErroCancelar(null)
    try {
      await api('POST', `/api/fretes/${frete.id}/cancelamento`, { motivo })
      setFrete({ ...frete, status: 'CANCELADO', motivoCancelamento: motivo })
      setCancelarAberto(false)
    } catch (falha) {
      setErroCancelar(comoProblema(falha).detail)
    } finally {
      setCancelando(false)
    }
  }
  const valor = frete.valorAcordado ?? frete.valorTotal ?? frete.valor
  const titulo = frete.tipoCarga && frete.tipoCarga !== 'OUTRO' ? TIPOS_CARGA[frete.tipoCarga] : frete.descricaoCarga?.split(/[.:,]/)[0] ?? 'Frete'
  const categoria = frete.categoriaVeiculo ? CATEGORIAS[frete.categoriaVeiculo].nome.split(' ')[0] : null
  const cancelado = frete.status === 'CANCELADO'
  const pago = pixPago(pagamento)
  const quem = frete.motorista

  const resumo = (
    <section className="frete-c__resumo" aria-label="Resumo do pedido">
      <div className="frete-c__titulo"><strong>{titulo}</strong><span>{diaDaSemana(frete.dataColeta)}{categoria && ` · ${categoria}`}</span></div>
      <RotaLinha coleta={frete.coleta} entrega={frete.entrega} distanciaKm={frete.distanciaKm} estimada={frete.distanciaEstimada} pontas="bairro-cidade" empilhada />
      {frete.valor != null && <p className="frete-c__oferta">Você ofereceu <strong>{brl(frete.valor)}</strong></p>}
    </section>
  )

  return (
    <div className="frete-c">
      {computador ? (
        <div className="pedido__topo">
          <Link to="/cliente" className="voltar">Meus fretes</Link>
          <h1 className="titulo-pagina">Seu pedido</h1>
        </div>
      ) : <CabecalhoPagina titulo="Seu pedido" voltar="/cliente" />}

      {vindo?.fotosQueFalharam && !cancelado && (
        <Aviso tom="alerta" titulo={vindo.fotosQueFalharam === 1 ? 'Uma foto não foi.' : `${vindo.fotosQueFalharam} fotos não foram.`}>
          O pedido foi feito, mas a conexão caiu no envio.
          <ReenviarFotos freteId={frete.id} />
        </Aviso>
      )}

      <div className="frete-c__colunas">
        {resumo}
        <div className="frete-c__principal">
          {cancelado && (
            <section className="frete-c__cartao" role="status" aria-labelledby="t-cancelado">
              <span className="frete-c__estado frete-c__estado--neutro"><span className="andamento__ponto" aria-hidden="true" />Pedido cancelado</span>
              <h2 id="t-cancelado">Nenhum valor foi cobrado</h2>
              <p className="frete-c__texto">Os motoristas não veem mais esse pedido, e quem tinha aceitado ou mandado proposta foi avisado.</p>
              {frete.motivoCancelamento && <p className="frete-c__texto">Motivo: {frete.motivoCancelamento}</p>}
              <div className="frete-c__acoes">
                <Link to="/cliente/fretes/novo" className="botao botao--primario">Fazer outro pedido</Link>
                <Link to="/cliente" className="botao botao--secundario">Voltar ao início</Link>
              </div>
            </section>
          )}

          {!cancelado && frete.status === 'PUBLICADO' && (
            <section className="frete-c__cartao" aria-label="Procurando motorista">
              <span className="frete-c__estado frete-c__estado--info"><span className="andamento__ponto" aria-hidden="true" />Procurando motorista</span>
              <p className="frete-c__texto">Avisamos quem tem van ou caminhão perto da coleta. Você recebe uma notificação quando alguém aceitar ou mandar outro valor.</p>
            </section>
          )}

          {!cancelado && frete.status === 'ACEITO' && quem && (
            <section className="frete-c__cartao" aria-labelledby="t-achou">
              <span className="frete-c__estado frete-c__estado--garantido"><span className="andamento__ponto" aria-hidden="true" />Motorista encontrado</span>
              <h2 id="t-achou">{primeiro(quem.nome)} aceitou {valor != null ? `seus ${brl(valor)}` : 'o frete'}</h2>
              <Motorista nome={quem.nome} perfil={perfis[quem.id]} veiculo={frete.veiculo} documentos />
              <button type="button" className="botao botao--primario botao--largo" onClick={pagar} disabled={ocupado === 'pagar'}>
                {ocupado === 'pagar' ? 'Gerando o Pix…' : `Pagar ${valor != null ? brl(valor) : ''} com Pix`}
              </button>
              <p className="frete-c__texto frete-c__texto--menor">O dinheiro fica guardado até a entrega. {primeiro(quem.nome)} só sai para a coleta quando vê o pagamento garantido.</p>
            </section>
          )}

          {!cancelado && frete.status === 'PROPOSTA_ENVIADA' && (
            <section className="frete-c__propostas" aria-labelledby="t-prop">
              <h2 id="t-prop">Propostas de outro valor</h2>
              <p className="frete-c__texto">{frete.valor != null ? `Ninguém aceitou ${brl(frete.valor)} ainda.` : 'Ninguém aceitou ainda.'} Você pode fechar com uma proposta ou esperar.</p>
              {propostasEstado.fase === 'pronto' && propostas.length === 0 && <p className="frete-c__texto">Você recusou todas. Novas propostas aparecem aqui.</p>}
              <div className="frete-c__lista">
                {propostas.map((p) => (
                  <article key={p.id} className="proposta-c">
                    <div className="proposta-c__topo">
                      <Motorista nome={p.motorista.nome} perfil={perfis[p.motorista.id]} veiculo={p.veiculo} />
                      <strong className="proposta-c__valor">{brl(p.valor)}</strong>
                    </div>
                    {p.observacao && <p className="frete-c__texto frete-c__texto--menor">{p.observacao}</p>}
                    <div className="proposta-c__acoes">
                      <button type="button" className="botao botao--primario" onClick={() => aceitar(p)} disabled={ocupado != null}>
                        {ocupado === `aceitar-${p.id}` ? 'Aceitando…' : `Aceitar ${brl(p.valor)}`}
                      </button>
                      <button type="button" className="botao botao--secundario" onClick={() => recusar(p)} disabled={ocupado != null}>Recusar</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {erro && <Aviso tom="perigo" titulo="Não deu certo.">{erro}</Aviso>}

          {!cancelado && (
            <button type="button" className="botao botao--fantasma frete-c__cancelar" aria-haspopup="dialog" onClick={() => setCancelarAberto(true)}>Cancelar pedido</button>
          )}
        </div>
      </div>

      <Folha aberta={pixAberto} rotulo="Pagamento com Pix" aoFechar={() => setPixAberto(false)}>
        {pagamento && !pago && (
          <>
            <header className="folha__topo">
              <h2 className="folha__titulo">{quem ? `Pague com Pix para fechar com ${primeiro(quem.nome)}` : 'Pague com Pix'}</h2>
              <FecharFolha aoFechar={() => setPixAberto(false)} />
            </header>
            {pagamento.pixQrCodeBase64
              ? <img className="pix-c__qr" src={`data:image/png;base64,${pagamento.pixQrCodeBase64}`} width={200} height={200} alt="QR Code do Pix" />
              : <div className="pix-c__qr pix-c__qr--vazio" role="img" aria-label="QR Code do Pix indisponível">Use o código abaixo</div>}
            <div className="pix-c__valor">
              <span>Valor</span>
              <strong>{brl(pagamento.valorTotal)}</strong>
              <span className="frete-c__texto--menor">Fica guardado até a entrega. Se o frete for cancelado antes da saída, volta para você.</span>
            </div>
            {pagamento.pixCopiaECola && <code className="pix__codigo">{pagamento.pixCopiaECola}</code>}
            <button type="button" className="botao botao--primario botao--largo" onClick={copiar}>{copiado ? 'Código copiado' : 'Copiar código Pix'}</button>
            {copiado && <p className="pix-c__espera" role="status">Esperando o banco confirmar…</p>}
          </>
        )}
        {pago && (
          <div className="pix-c__pago" role="status">
            <span className="frete-c__estado frete-c__estado--garantido">Pix confirmado: {brl(pagamento!.valorTotal)} guardado</span>
            <h2 className="folha__titulo">{quem ? `Fechado com ${primeiro(quem.nome)}` : 'Fechado'}</h2>
            <p className="folha__texto">{quem ? `${primeiro(quem.nome)} já vê o pagamento garantido. No dia ${diaDaSemana(frete.dataColeta)}, vai até a coleta.` : 'O motorista já vê o pagamento garantido.'}</p>
            <button type="button" className="botao botao--primario botao--largo" onClick={() => { setPixAberto(false); recarregar() }}>Acompanhar frete</button>
          </div>
        )}
      </Folha>

      <CancelarComMotivo
        aberta={cancelarAberto}
        titulo="Cancelar este pedido?"
        texto={pagamento?.status === 'PENDENTE' ? 'Os motoristas deixam de ver o pedido. O Pix ainda não foi pago, então nada é cobrado.' : 'Os motoristas deixam de ver o pedido. Você ainda não pagou nada, então nada é cobrado.'}
        pergunta="Por que você quer cancelar?"
        motivos={MOTIVOS}
        rotuloConfirmar="Sim, cancelar pedido"
        rotuloManter="Manter o pedido"
        enviando={cancelando}
        erro={erroCancelar}
        aoConfirmar={cancelar}
        aoFechar={() => setCancelarAberto(false)}
      />
    </div>
  )
}

/** Mandar de novo as fotos que não foram no pedido. Só enquanto o frete aceita fotos (antes de fechar). */
function ReenviarFotos({ freteId }: { freteId: string }) {
  const [estado, setEstado] = useState<'parado' | 'enviando' | 'foi' | 'erro'>('parado')
  const [mensagem, setMensagem] = useState<string | null>(null)
  async function enviar(lista: FileList | null) {
    if (!lista?.length) return
    setEstado('enviando')
    setMensagem(null)
    try {
      for (const arquivo of [...lista].slice(0, 5)) {
        const dados = new FormData()
        dados.append('foto', arquivo)
        await api('POST', `/api/fretes/${freteId}/fotos`, dados)
      }
      setEstado('foi')
    } catch (falha) {
      setEstado('erro')
      setMensagem(comoProblema(falha).detail)
    }
  }
  if (estado === 'foi') return <p role="status">Fotos enviadas.</p>
  return (
    <span className="reenviar">
      <label className="botao botao--secundario">
        {estado === 'enviando' ? 'Enviando…' : 'Mandar as fotos de novo'}
        <input type="file" accept="image/jpeg,image/png" multiple className="visualmente-oculto" disabled={estado === 'enviando'}
          onChange={(e) => { enviar(e.target.files); e.target.value = '' }} />
      </label>
      {mensagem && <span className="campo__erro" role="alert">{mensagem}</span>}
    </span>
  )
}
