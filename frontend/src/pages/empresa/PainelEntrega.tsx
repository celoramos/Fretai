import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api, comoProblema } from '../../api/cliente'
import type { Canhoto, Frete, Problema } from '../../api/tipos'
import { ouNulo, useRecurso } from '../../api/useRecurso'
import { Aviso, ErroCarga, Esqueleto, Vazio } from '../../components/ui'
import { dataHora } from '../../formato'

const RESOLUCAO = {
  ENTREGA_CONFIRMADA: 'A análise confirmou a entrega e o saldo foi liberado.',
  CONTESTACAO_PROCEDENTE: 'A análise deu razão à contestação. O saldo segue parado para o acerto.',
} as const

/*
 * A entrega vista do escritório: a foto, quem assinou, onde o GPS estava e até quando dá para
 * contestar. Contestar é o freio de mão do saldo, então a tela diz o prazo antes de oferecer o botão.
 */
export function PainelEntrega({ frete, aoMudar }: { frete: Frete; aoMudar: () => void }) {
  const entregue = frete.status === 'ENTREGUE' || frete.status === 'PAGO'
  const [estado, recarregar] = useRecurso(
    () => (entregue ? ouNulo(api<Canhoto>('GET', `/api/fretes/${frete.id}/canhoto`)) : Promise.resolve(null)),
    [frete.id, entregue],
  )

  if (frete.status === 'EM_TRANSITO') {
    return <Vazio titulo="O motorista está na estrada.">Na entrega ele registra foto, assinatura de quem recebeu e o GPS. O canhoto aparece aqui.</Vazio>
  }
  if (!entregue) {
    return <Vazio titulo="Ainda não houve entrega.">Depois que a carga chegar, o canhoto digital aparece aqui: foto, assinatura e local.</Vazio>
  }
  if (estado.fase === 'carregando') return estado.mostrarEsqueleto ? <Esqueleto linhas={6} /> : null
  if (estado.fase === 'erro') return <ErroCarga problema={estado.problema} tentarDeNovo={recarregar} />
  const canhoto = estado.dados
  if (!canhoto) {
    return <Vazio titulo="Entrega sem canhoto digital.">Este frete foi concluído sem o registro de foto e assinatura pelo aplicativo.</Vazio>
  }
  return <CartaoCanhoto canhoto={canhoto} aoRecarregar={recarregar} aoMudar={aoMudar} />
}

function CartaoCanhoto({ canhoto, aoRecarregar, aoMudar }: { canhoto: Canhoto; aoRecarregar: () => void; aoMudar: () => void }) {
  // Os links das imagens vencem em minutos: se a imagem não abrir, a tela pede links novos à API.
  const [imagemFalhou, setImagemFalhou] = useState(false)
  // A hora de abrir a tela basta: o prazo é de horas, e recarregar o painel refaz a conta.
  const [abertoEm] = useState(() => Date.now())
  const noPrazo = new Date(canhoto.contestacaoAte).getTime() > abertoEm

  return (
    <div className="canhoto">
      <section className="cartao canhoto__foto" aria-labelledby="canhoto-foto">
        <h2 id="canhoto-foto" className="bloco__titulo">Foto da entrega</h2>
        {canhoto.fotoUrl && !imagemFalhou ? (
          <img src={canhoto.fotoUrl} alt={`Foto da carga entregue, recebida por ${canhoto.nomeRecebedor}`} className="canhoto__imagem"
            width={1600} height={1200} onError={() => setImagemFalhou(true)} />
        ) : (
          <div className="canhoto__sem-imagem">
            <p>O link da foto venceu.</p>
            <button type="button" className="botao botao--secundario" onClick={() => { setImagemFalhou(false); aoRecarregar() }}>Abrir de novo</button>
          </div>
        )}
      </section>

      <section className="cartao canhoto__dados" aria-labelledby="canhoto-dados">
        <h2 id="canhoto-dados" className="bloco__titulo">Canhoto</h2>
        <dl className="ficha">
          <div><dt>Recebido por</dt><dd>{canhoto.nomeRecebedor}</dd></div>
          <div><dt>Quando</dt><dd>{dataHora(canhoto.registradoEm)}</dd></div>
          <div>
            <dt>Local</dt>
            <dd>
              {canhoto.localConferido && canhoto.distanciaDestinoKm != null
                ? `A ${Math.round(canhoto.distanciaDestinoKm * 1000)} m do endereço de entrega`
                : 'Não conferido: o endereço de entrega não tinha coordenadas'}
            </dd>
          </div>
        </dl>
        {canhoto.assinaturaUrl && !imagemFalhou && (
          <figure className="canhoto__assinatura">
            <img src={canhoto.assinaturaUrl} alt={`Assinatura de ${canhoto.nomeRecebedor}`} width={400} height={180} onError={() => setImagemFalhou(true)} />
            <figcaption className="detalhe">Assinatura de quem recebeu</figcaption>
          </figure>
        )}

        <div aria-live="polite" className="canhoto__contestacao">
          {canhoto.resolucao ? (
            <Aviso tom="info" titulo="Contestação analisada.">{RESOLUCAO[canhoto.resolucao]}</Aviso>
          ) : canhoto.contestado ? (
            <Aviso tom="alerta" titulo="Entrega contestada.">
              {canhoto.motivoContestacao ? `“${canhoto.motivoContestacao}” ` : ''}O saldo do motorista fica parado até a análise.
            </Aviso>
          ) : noPrazo ? (
            <Contestar canhoto={canhoto} aoContestar={aoMudar} />
          ) : (
            <p className="detalhe">O prazo para contestar terminou em {dataHora(canhoto.contestacaoAte)}.</p>
          )}
        </div>
      </section>
    </div>
  )
}

function Contestar({ canhoto, aoContestar }: { canhoto: Canhoto; aoContestar: () => void }) {
  const [aberto, setAberto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(null)
  const campo = useRef<HTMLTextAreaElement>(null)
  // Abriu a contestação: o foco vai para o motivo.
  useEffect(() => {
    if (aberto) campo.current?.focus()
  }, [aberto])

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setProblema(null)
    if (!motivo.trim()) {
      setProblema({ title: '', detail: '', status: 400, erros: { motivo: 'Conte o que houve com a entrega.' } })
      return
    }
    setEnviando(true)
    try {
      await api('POST', `/api/fretes/${canhoto.freteId}/canhoto/contestacao`, { motivo: motivo.trim() })
      aoContestar()
    } catch (falha) {
      setProblema(comoProblema(falha))
      setEnviando(false)
    }
  }

  if (!aberto) {
    return (
      <div className="canhoto__prazo">
        <p>O saldo do motorista sai depois de <strong>{dataHora(canhoto.contestacaoAte)}</strong>. Se a carga chegou com problema, conteste antes.</p>
        <button type="button" className="botao botao--secundario" onClick={() => setAberto(true)}>Contestar entrega</button>
      </div>
    )
  }
  const erroMotivo = problema?.erros?.motivo
  return (
    <form className="canhoto__prazo" onSubmit={enviar} noValidate>
      <div className="campo">
        <label htmlFor="motivo-contestacao" className="campo__rotulo">O que houve com a entrega</label>
        <textarea id="motivo-contestacao" className="campo__entrada campo__entrada--texto" rows={3} maxLength={500} value={motivo}
          onChange={(e) => setMotivo(e.target.value)} placeholder="Faltaram 2 paletes" ref={campo}
          aria-invalid={erroMotivo ? true : undefined} aria-describedby={erroMotivo ? 'motivo-contestacao-erro' : 'motivo-contestacao-ajuda'} />
        {erroMotivo
          ? <p id="motivo-contestacao-erro" className="campo__erro">{erroMotivo}</p>
          : <p id="motivo-contestacao-ajuda" className="campo__ajuda">Contestar segura o saldo do motorista até a análise.</p>}
      </div>
      {problema && !erroMotivo && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}
      <div className="cancelar__botoes">
        <button type="submit" className="botao botao--primario" disabled={enviando}>{enviando ? 'Enviando…' : 'Contestar entrega'}</button>
        <button type="button" className="botao botao--fantasma" disabled={enviando} onClick={() => { setAberto(false); setProblema(null) }}>Voltar</button>
      </div>
    </form>
  )
}
