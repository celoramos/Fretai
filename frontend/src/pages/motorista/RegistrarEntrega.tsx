import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, comoProblema, MODO_DEMO } from '../../api/cliente'
import type { Canhoto, Frete, Pagamento, Problema } from '../../api/tipos'
import { ouNulo, useRecurso } from '../../api/useRecurso'
import { Assinatura } from '../../components/Assinatura'
import { Aviso, ErroCarga, Esqueleto } from '../../components/ui'
import { prepararFoto } from '../../foto'
import { dataHora, reais } from '../../formato'
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

  if (estado.fase === 'carregando') return <div className="entrega">{estado.mostrarEsqueleto && <><Esqueleto linhas={2} /><Esqueleto linhas={4} /></>}</div>
  if (estado.fase === 'erro') return <div className="entrega"><ErroCarga problema={estado.problema} tentarDeNovo={recarregar} /></div>
  return <Formulario frete={estado.dados.frete} pagamento={estado.dados.pagamento} />
}

function Formulario({ frete, pagamento }: { frete: Frete; pagamento: Pagamento | null }) {
  const [foto, setFoto] = useState<{ blob: Blob; url: string } | null>(null)
  const [preparandoFoto, setPreparandoFoto] = useState(false)
  const [nome, setNome] = useState('')
  const [assinou, setAssinou] = useState(false)
  const [local, setLocal] = useState<Local>({ fase: 'buscando' })
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(null)
  const [canhoto, setCanhoto] = useState<Canhoto | null>(null)
  const tela = useRef<HTMLCanvasElement>(null)
  const campoFoto = useRef<HTMLInputElement>(null)
  const campoNome = useRef<HTMLInputElement>(null)

  const destino = frete.entrega.latitude != null && frete.entrega.longitude != null
    ? { lat: frete.entrega.latitude, lng: frete.entrega.longitude } : null

  const obterLocal = useCallback(() => {
    // Na demonstração ninguém está no destino de verdade: a posição é simulada a uns 120 m da entrega.
    const pedido = MODO_DEMO && destino
      ? Promise.resolve({ lat: destino.lat + 0.0011, lng: destino.lng, precisaoM: 10 })
      : posicaoAtual()
    pedido
      .then((p) => setLocal({ fase: 'pronto', lat: p.lat, lng: p.lng, distanciaKm: destino ? distanciaKm(p, destino) : null, simulado: MODO_DEMO }))
      .catch((e: Error) => setLocal({ fase: 'erro', texto: e.message }))
    // destino muda só com o frete, que não muda nesta tela
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Quem abriu esta tela está entregando: o GPS começa a ser conferido já, sem esperar o fim do formulário.
  useEffect(() => {
    obterLocal()
  }, [obterLocal])
  const buscarLocal = () => {
    setLocal({ fase: 'buscando' })
    obterLocal()
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
      setProblema({ title: 'Foto', detail: (e as Error).message, status: 0, erros: { foto: (e as Error).message } })
    } finally {
      setPreparandoFoto(false)
    }
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setProblema(null)
    const erros: Record<string, string> = {}
    if (!foto) erros.foto = 'Tire a foto da carga entregue.'
    if (!nome.trim()) erros.nomeRecebedor = 'Escreva o nome de quem recebeu.'
    if (!assinou) erros.assinatura = 'Peça para quem recebeu assinar no quadro.'
    const posicao = local.fase === 'pronto' ? local : null
    if (!posicao) erros.local = 'Falta o GPS. Toque em "Tentar de novo" no local.'
    if (Object.keys(erros).length || !posicao || !foto) {
      setProblema({ title: 'Falta completar', detail: '', status: 400, erros })
      if (erros.foto) campoFoto.current?.focus()
      else if (erros.nomeRecebedor) campoNome.current?.focus()
      return
    }
    setEnviando(true)
    try {
      const assinatura = await new Promise<Blob>((resolver, rejeitar) =>
        tela.current?.toBlob((b) => (b ? resolver(b) : rejeitar(new Error('sem assinatura'))), 'image/png'),
      )
      const dados = new FormData()
      dados.append('nomeRecebedor', nome.trim())
      dados.append('latitude', String(posicao.lat))
      dados.append('longitude', String(posicao.lng))
      dados.append('foto', foto.blob, 'entrega.jpg')
      dados.append('assinatura', assinatura, 'assinatura.png')
      setCanhoto(await api<Canhoto>('POST', `/api/fretes/${frete.id}/canhoto`, dados))
    } catch (falha) {
      setProblema(comoProblema(falha))
    } finally {
      setEnviando(false)
    }
  }

  const saldo = pagamento?.valorSaldo ?? null
  if (canhoto) {
    return (
      <div className="entrega">
        <section className="cartao entrega__feito" aria-live="polite">
          <h1 className="entrega__titulo">Entrega registrada.</h1>
          <p>
            {saldo != null ? <>O saldo de <strong>R$&nbsp;{reais(saldo)}</strong> sai </> : 'O saldo sai '}
            depois de {dataHora(canhoto.contestacaoAte)}, se quem recebeu não contestar a entrega.
          </p>
          <p className="detalhe">Recebido por {canhoto.nomeRecebedor}.</p>
          <div className="entrega__botoes">
            <Link to={`/motorista/fretes/${frete.id}#volta`} className="botao botao--primario botao--largo">Procurar frete para voltar</Link>
            <Link to={`/motorista/fretes/${frete.id}`} className="botao botao--secundario botao--largo">Ver o frete</Link>
          </div>
        </section>
      </div>
    )
  }

  if (frete.status !== 'EM_TRANSITO') {
    return (
      <div className="entrega">
        <Link to={`/motorista/fretes/${frete.id}`} className="voltar">Voltar ao frete</Link>
        <Aviso tom="info" titulo="Este frete não está em viagem.">O canhoto é registrado com a carga em trânsito, na chegada ao destino.</Aviso>
      </div>
    )
  }

  const erro = (campo: string) => problema?.erros?.[campo]
  const longe = local.fase === 'pronto' && local.distanciaKm != null && local.distanciaKm > RAIO_MAXIMO_KM

  return (
    <form className="entrega" onSubmit={enviar} noValidate>
      <Link to={`/motorista/fretes/${frete.id}`} className="voltar">Voltar ao frete</Link>
      <div className="entrega__cabeca">
        <h1 className="entrega__titulo">Registrar entrega</h1>
        <p className="detalhe">
          {frete.coleta.cidade} para {frete.entrega.cidade}
          {saldo != null ? <>. Este canhoto libera o saldo de <strong className="entrega__saldo">R$&nbsp;{reais(saldo)}</strong>.</> : '.'}
        </p>
      </div>

      <section className="cartao entrega__parte" aria-labelledby="parte-foto">
        <h2 id="parte-foto" className="bloco__titulo">Foto da carga entregue</h2>
        {foto && <img className="entrega__foto" src={foto.url} alt="Foto da carga entregue" />}
        <label className={`botao ${foto ? 'botao--secundario' : 'botao--primario'} botao--largo entrega__camera`}>
          <input ref={campoFoto} type="file" accept="image/jpeg,image/png,image/*" capture="environment" className="entrega__arquivo"
            onChange={(e) => escolherFoto(e.target.files?.[0])} aria-invalid={erro('foto') ? true : undefined}
            aria-describedby={erro('foto') ? 'erro-foto' : undefined} />
          {preparandoFoto ? 'Preparando a foto…' : foto ? 'Tirar outra foto' : 'Tirar foto'}
        </label>
        {erro('foto') && <p id="erro-foto" className="campo__erro">{erro('foto')}</p>}
      </section>

      <section className="cartao entrega__parte" aria-labelledby="parte-nome">
        <h2 id="parte-nome" className="bloco__titulo">Quem recebeu</h2>
        <div className="campo">
          <label htmlFor="nome-recebedor" className="campo__rotulo">Nome</label>
          <input ref={campoNome} id="nome-recebedor" className="campo__entrada" maxLength={100} autoComplete="off" value={nome}
            onChange={(e) => setNome(e.target.value)} placeholder="Carlos, do recebimento"
            aria-invalid={erro('nomeRecebedor') ? true : undefined} aria-describedby={erro('nomeRecebedor') ? 'erro-nome' : undefined} />
          {erro('nomeRecebedor') && <p id="erro-nome" className="campo__erro">{erro('nomeRecebedor')}</p>}
        </div>
      </section>

      <section className="cartao entrega__parte" aria-labelledby="parte-assinatura">
        <h2 id="parte-assinatura" className="bloco__titulo">Assinatura de quem recebeu</h2>
        <Assinatura tela={tela} aoMudar={setAssinou} rotulo="Quadro para quem recebeu assinar com o dedo" />
        {erro('assinatura') && <p className="campo__erro">{erro('assinatura')}</p>}
      </section>

      <section className="cartao entrega__parte" aria-labelledby="parte-local">
        <h2 id="parte-local" className="bloco__titulo">Local</h2>
        <div aria-live="polite">
          {local.fase === 'buscando' && <p className="detalhe">Conferindo onde você está…</p>}
          {local.fase === 'erro' && (
            <Aviso tom="alerta" titulo="Sem GPS." acao={<button type="button" className="botao botao--secundario" onClick={buscarLocal}>Tentar de novo</button>}>{local.texto}</Aviso>
          )}
          {local.fase === 'pronto' && (local.distanciaKm == null ? (
            <p>GPS pronto. O endereço de entrega não tem coordenadas, então a distância não é conferida.</p>
          ) : longe ? (
            <Aviso tom="alerta" titulo={`Você está a ${formatarDistancia(local.distanciaKm)} da entrega.`}
              acao={<button type="button" className="botao botao--secundario" onClick={buscarLocal}>Conferir de novo</button>}>
              O canhoto só vale a até 500 m do endereço. Chegue mais perto e confira de novo.
            </Aviso>
          ) : (
            <p className="entrega__perto">Você está a {formatarDistancia(local.distanciaKm)} da entrega.{local.simulado ? ' (posição simulada na demonstração)' : ''}</p>
          ))}
          {erro('local') && local.fase !== 'erro' && <p className="campo__erro">{erro('local')}</p>}
        </div>
      </section>

      <div className="entrega__fim" aria-live="polite">
        {problema && !problema.erros && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}
        <button type="submit" className="botao botao--primario botao--largo" disabled={enviando || preparandoFoto}>
          {enviando ? 'Enviando o canhoto…' : 'Registrar entrega'}
        </button>
      </div>
    </form>
  )
}

const formatarDistancia = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`)
