import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, comoProblema, MODO_DEMO } from '../../api/cliente'
import type { Canhoto, Frete, Pagamento, Problema } from '../../api/tipos'
import { ouNulo, useRecurso } from '../../api/useRecurso'
import { Assinatura } from '../../components/Assinatura'
import { CabecalhoPagina } from '../../components/CabecalhoPagina'
import { FretesDeVolta } from '../../components/FretesDeVolta'
import { nomeDaPonta } from '../../ponta'
import { Aviso, ErroCarga, Esqueleto } from '../../components/ui'
import { prepararFoto } from '../../foto'
import { contratante, dataHora, reais } from '../../formato'
import { useComputador } from '../../largura'
import { distanciaKm, posicaoAtual } from '../../geo'
import { useTitulo } from '../../useTitulo'

/** O mesmo limite da API (fretai.entrega.raio-maximo-km): o canhoto vale a até 500 m da entrega. */
const RAIO_MAXIMO_KM = 0.5

type Local =
  | { fase: 'buscando' }
  | { fase: 'erro'; texto: string }
  | { fase: 'pronto'; lat: number; lng: number; distanciaKm: number | null; simulado: boolean }

/*
 * Registrar a entrega: foto, nome de quem recebeu, assinatura e o GPS. É o que libera o saldo,
 * então a tela diz o valor e confere a distância antes de enviar, para o motorista não descobrir
 * na resposta da API que estava longe demais.
 */
export function RegistrarEntrega() {
  const { id = '' } = useParams()
  useTitulo('Registrar entrega')
  const [estado, recarregar] = useRecurso(async () => {
    const [frete, pagamento] = await Promise.all([
      api<Frete>('GET', `/api/fretes/${id}`),
      ouNulo(api<Pagamento>('GET', `/api/fretes/${id}/pagamento`)),
    ])
    return { frete, pagamento }
  }, [id])

  if (estado.fase === 'carregando') return <div className="entrega-m">{estado.mostrarEsqueleto && <><Esqueleto linhas={2} /><Esqueleto linhas={4} /></>}</div>
  if (estado.fase === 'erro') return <div className="entrega-m"><ErroCarga problema={estado.problema} tentarDeNovo={recarregar} /></div>
  return <Formulario frete={estado.dados.frete} pagamento={estado.dados.pagamento} />
}

const formatarDistancia = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`)
const lista = (itens: string[]) => itens.join(', ').replace(/, ([^,]*)$/, ' e $1')

/*
 * O canhoto em três partes, como no canvas: a foto, o nome e a assinatura de quem recebe, e a localização.
 * Enviar fica desabilitado e diz o que falta; depois do envio, a nota para quem contratou e mais fretes.
 */
function Formulario({ frete, pagamento }: { frete: Frete; pagamento: Pagamento | null }) {
  const computador = useComputador()
  const [foto, setFoto] = useState<{ blob: Blob; url: string } | null>(null)
  const [preparandoFoto, setPreparandoFoto] = useState(false)
  const [nome, setNome] = useState(frete.nomeDestinatario ?? '')
  const [assinou, setAssinou] = useState(false)
  const [local, setLocal] = useState<Local | null>(null)
  const [enviando, setEnviando] = useState(false)
  const travado = useRef(false)
  const [problema, setProblema] = useState<Problema | null>(null)
  const [canhoto, setCanhoto] = useState<Canhoto | null>(null)
  const tela = useRef<HTMLCanvasElement>(null)

  const destino = frete.entrega.latitude != null && frete.entrega.longitude != null
    ? { lat: frete.entrega.latitude, lng: frete.entrega.longitude } : null

  function registrarLocal() {
    setLocal({ fase: 'buscando' })
    posicaoAtual()
      .then((p) => {
        // Na demonstração ninguém está no destino de verdade: com o GPS liberado, a posição vira uns 80 m da entrega.
        const aqui = MODO_DEMO && destino ? { lat: destino.lat + 0.00072, lng: destino.lng } : p
        setLocal({ fase: 'pronto', lat: aqui.lat, lng: aqui.lng, distanciaKm: destino ? distanciaKm(aqui, destino) : null, simulado: MODO_DEMO })
      })
      .catch((e: Error) => setLocal({ fase: 'erro', texto: e.message }))
  }

  // A prévia da foto é um endereço temporário do navegador: liberado quando a foto muda ou a tela fecha.
  useEffect(() => () => {
    if (foto) URL.revokeObjectURL(foto.url)
  }, [foto])

  async function escolherFoto(arquivo: File | undefined) {
    if (!arquivo) return
    setPreparandoFoto(true)
    setProblema(null)
    try {
      const blob = await prepararFoto(arquivo)
      setFoto({ blob, url: URL.createObjectURL(blob) })
    } catch (e) {
      setProblema({ title: 'Foto', detail: (e as Error).message, status: 0 })
    } finally {
      setPreparandoFoto(false)
    }
  }

  const longe = local?.fase === 'pronto' && local.distanciaKm != null && local.distanciaKm > RAIO_MAXIMO_KM
  const falta = [
    !foto && 'a foto',
    !nome.trim() && 'o nome de quem recebe',
    !assinou && 'a assinatura',
    local?.fase !== 'pronto' && 'a localização',
    longe && 'chegar a 500 m da entrega',
  ].filter((x): x is string => Boolean(x))

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (falta.length || local?.fase !== 'pronto' || !foto || travado.current) return
    travado.current = true
    setEnviando(true)
    setProblema(null)
    try {
      const assinatura = await new Promise<Blob>((resolver, rejeitar) =>
        tela.current?.toBlob((b) => (b ? resolver(b) : rejeitar(new Error('sem assinatura'))), 'image/png'),
      )
      const dados = new FormData()
      dados.append('nomeRecebedor', nome.trim())
      dados.append('latitude', String(local.lat))
      dados.append('longitude', String(local.lng))
      dados.append('foto', foto.blob, 'entrega.jpg')
      dados.append('assinatura', assinatura, 'assinatura.png')
      setCanhoto(await api<Canhoto>('POST', `/api/fretes/${frete.id}/canhoto`, dados))
    } catch (falha) {
      setProblema(comoProblema(falha))
      travado.current = false
    } finally {
      setEnviando(false)
    }
  }

  const valor = pagamento?.valorSaldo ?? frete.valorAcordado ?? frete.valor
  const quem = frete.cliente ? frete.cliente.nome.split(' ')[0] : contratante(frete).nome
  const topo = computador
    ? <div className="pedido__topo"><Link to={`/motorista/fretes/${frete.id}`} className="voltar">Voltar ao frete</Link><h1 className="titulo-pagina">Registrar entrega</h1></div>
    : <CabecalhoPagina titulo="Registrar entrega" voltar={`/motorista/fretes/${frete.id}`} rotuloVoltar="Voltar ao frete" />

  if (canhoto) {
    return (
      <div className="entrega-m">
        {topo}
        <section className="entrega-m__feito" role="status">
          <svg className="icone-traco entrega-m__ok" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          <h2>Canhoto enviado</h2>
          <p>{quem} tem até {dataHora(canhoto.contestacaoAte)} para contestar. Sem contestação, <strong>{valor != null ? `os R$ ${reais(valor)}` : 'o pagamento'} vão para sua chave Pix</strong>.</p>
        </section>
        <Nota freteId={frete.id} quem={quem} />
        <Link to="/motorista" className="botao botao--primario botao--largo">Ver mais fretes</Link>
        <FretesDeVolta frete={frete} />
      </div>
    )
  }

  if (frete.status !== 'EM_TRANSITO') {
    return (
      <div className="entrega-m">
        {topo}
        <Aviso tom="info" titulo="Este frete não está em viagem.">O canhoto é registrado com a carga em trânsito, na chegada ao destino.</Aviso>
      </div>
    )
  }

  return (
    <form className="entrega-m" onSubmit={enviar} noValidate>
      {topo}
      <p className="frete-c__texto">
        {nomeDaPonta(frete.entrega, frete.cliente ? 'bairro' : 'cidade')}{frete.nomeDestinatario ? ` · ${frete.nomeDestinatario}` : ''}.
        {valor != null ? ` Sem contestação em 24 h, os R$ ${reais(valor)} vão para sua chave Pix.` : ''}
      </p>

      <section className="entrega-m__parte" aria-labelledby="t-foto">
        <h2 id="t-foto">1. Foto da entrega</h2>
        {foto && <img className="entrega-m__foto" src={foto.url} alt="Foto da carga entregue" />}
        <label className={`botao ${foto ? 'botao--secundario' : 'botao--primario'} botao--largo entrega-m__camera`}>
          <input type="file" accept="image/*" capture="environment" className="visualmente-oculto" onChange={(e) => { escolherFoto(e.target.files?.[0]); e.target.value = '' }} />
          {preparandoFoto ? 'Preparando a foto…' : foto ? 'Tirar outra' : 'Tirar foto'}
        </label>
        {foto && <span className="frete-m__estado frete-m__estado--garantido">Foto anexada</span>}
      </section>

      <section className="entrega-m__parte" aria-labelledby="t-assina">
        <h2 id="t-assina">2. Assinatura de quem recebe</h2>
        <div className="campo">
          <label htmlFor="nome-recebedor" className="campo__rotulo">Nome</label>
          <input id="nome-recebedor" className="campo__entrada" maxLength={100} autoComplete="off" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <Assinatura tela={tela} aoMudar={setAssinou} rotulo="Quadro para quem recebe assinar com o dedo" />
      </section>

      <section className="entrega-m__parte" aria-labelledby="t-gps">
        <h2 id="t-gps">3. Localização</h2>
        <div aria-live="polite" className="entrega-m__gps">
          {(local == null || local.fase === 'erro') && (
            <button type="button" className="botao botao--secundario botao--largo" onClick={registrarLocal}>
              {local?.fase === 'erro' ? 'Tentar de novo' : 'Registrar localização'}
            </button>
          )}
          {local?.fase === 'buscando' && <p className="frete-c__texto">Localizando…</p>}
          {local?.fase === 'erro' && <p className="frete-m__estado frete-m__estado--alerta">{local.texto}</p>}
          {local?.fase === 'pronto' && (local.distanciaKm == null ? (
            <p className="frete-m__estado frete-m__estado--garantido">Localização registrada. O endereço de entrega não tem coordenadas, então a distância não é conferida.</p>
          ) : longe ? (
            <>
              <p className="frete-m__estado frete-m__estado--alerta">A {formatarDistancia(local.distanciaKm)} do endereço de entrega. O canhoto só vale a até 500 m.</p>
              <button type="button" className="botao botao--secundario botao--largo" onClick={registrarLocal}>Conferir de novo</button>
            </>
          ) : (
            <p className="frete-m__estado frete-m__estado--garantido">A {formatarDistancia(local.distanciaKm)} do endereço de entrega. Dentro dos 500 m aceitos.{local.simulado ? ' (posição simulada na demonstração)' : ''}</p>
          ))}
        </div>
      </section>

      <div className="frete-m__acoes entrega-m__fim" aria-live="polite">
        {problema && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}
        <button type="submit" className="botao botao--primario botao--largo" disabled={falta.length > 0 || enviando || preparandoFoto} aria-describedby="entrega-falta">
          {enviando ? 'Enviando o canhoto…' : 'Enviar canhoto'}
        </button>
        <p id="entrega-falta" className="entrega-m__falta">{falta.length ? `Falta ${lista(falta)}.` : 'Tudo pronto.'}</p>
      </div>
    </form>
  )
}

/** A nota para quem contratou: um toque na estrela envia. */
function Nota({ freteId, quem }: { freteId: string; quem: string }) {
  const [nota, setNota] = useState<number | null>(null)
  const [enviada, setEnviada] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  async function dar(n: number) {
    if (enviada) return
    setNota(n)
    setErro(null)
    try {
      await api('POST', `/api/fretes/${freteId}/avaliacoes`, { nota: n })
      setEnviada(true)
    } catch (e) {
      setErro(comoProblema(e).detail)
      setNota(null)
    }
  }
  return (
    <section className="entrega-m__nota" aria-labelledby="t-nota">
      <h3 id="t-nota">Como foi com {quem}?</h3>
      <div role="group" aria-label="Nota de 1 a 5" className="entrega-m__estrelas">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className="entrega-m__estrela" aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`} aria-pressed={nota != null && n <= nota}
            disabled={enviada} onClick={() => dar(n)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /></svg>
          </button>
        ))}
      </div>
      {enviada && <p role="status" className="frete-c__texto--menor">Obrigado! A nota aparece no perfil de {quem}.</p>}
      {erro && <p className="campo__erro" role="alert">{erro}</p>}
    </section>
  )
}
