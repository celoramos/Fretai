import { useRef, useState } from 'react'
import { api, comoProblema } from '../api/cliente'
import type { AcessoDocumento, Documento, Problema, StatusFrete } from '../api/tipos'
import { useRecurso } from '../api/useRecurso'
import { abrirDocumento, rotuloDocumento, TIPOS_DOCUMENTO } from '../documento'
import { prepararFoto } from '../foto'
import { dataHora } from '../formato'
import { Aviso } from './ui'

/** A API mostra os documentos do motorista a quem contratou só depois do aceite (Documento.podeSerVistoPor). */
const CONTRATANTE_VE: StatusFrete[] = ['ACEITO', 'EM_TRANSITO', 'ENTREGUE', 'PAGO']

/*
 * Documentos do motorista para um frete. Quem manda é o motorista; quem abre é quem contratou, por um link
 * que vence em minutos, e cada abertura fica registrada para o motorista ver. É a promessa da página
 * inicial ("fica registrado quem abriu") virando tela.
 */
export function DocumentosDoMotorista({ freteId, motoristaId }: { freteId: string; motoristaId: string }) {
  const [estado, recarregar] = useRecurso(async () => {
    const docs = (await api<Documento[]>('GET', `/api/fretes/${freteId}/documentos`)).filter((d) => d.motoristaId === motoristaId)
    const acessos = await Promise.all(docs.map((d) => api<AcessoDocumento[]>('GET', `/api/documentos/${d.id}/acessos`).catch(() => [])))
    return docs.map((d, i) => ({ doc: d, acessos: acessos[i].filter((a) => a.papel !== 'MOTORISTA') }))
  }, [freteId, motoristaId])
  const [enviando, setEnviando] = useState<string | null>(null)
  const [problema, setProblema] = useState<Problema | null>(null)
  const campos = useRef<Record<string, HTMLInputElement | null>>({})

  async function enviar(tipo: string, arquivo: File | undefined) {
    if (!arquivo) return
    setEnviando(tipo)
    setProblema(null)
    try {
      // Foto de documento passa pela mesma redução da foto do canhoto; PDF vai como está.
      const corpo = arquivo.type === 'application/pdf' ? arquivo : await prepararFoto(arquivo)
      const dados = new FormData()
      dados.append('tipo', tipo)
      dados.append('arquivo', corpo, arquivo.type === 'application/pdf' ? arquivo.name : `${tipo.toLowerCase()}.jpg`)
      await api('POST', `/api/fretes/${freteId}/documentos`, dados)
      recarregar()
    } catch (falha) {
      setProblema(comoProblema(falha, 'Não deu para enviar'))
    } finally {
      setEnviando(null)
      const campo = campos.current[tipo]
      if (campo) campo.value = ''
    }
  }

  const lista = estado.fase === 'pronto' ? estado.dados : []
  return (
    <div className="documentos">
      <p className="detalhe">Quem contratou só vê depois de aceitar a sua proposta, por um link que vence em minutos. Cada abertura fica registrada aqui.</p>
      {lista.length > 0 && (
        <ul className="documentos__lista">
          {lista.map(({ doc, acessos }) => (
            <li key={doc.id} className="documentos__item">
              <span className="documentos__tipo">{rotuloDocumento(doc.tipo)}</span>
              {doc.recusadoEm
                ? <span className="doc doc--recusado">recusado</span>
                : <span className={doc.verificado ? 'doc doc--ok' : 'detalhe'}>{doc.verificado ? 'verificado' : `enviado ${dataHora(doc.criadoEm)}`}</span>}
              {doc.recusadoEm && <span className="documentos__motivo">Motivo: {doc.motivoRecusa} Envie outro arquivo.</span>}
              <span className="detalhe documentos__acessos">
                {acessos.length === 0 ? 'Ninguém abriu ainda.'
                  : `Aberto ${acessos.length === 1 ? '1 vez' : `${acessos.length} vezes`}, a última em ${dataHora(acessos[acessos.length - 1].acessadoEm)}.`}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="documentos__enviar" aria-live="polite">
        {problema && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}
        {TIPOS_DOCUMENTO.map((t) => (
          <label key={t.valor} className="botao botao--secundario documentos__botao">
            <input ref={(el) => { campos.current[t.valor] = el }} type="file" accept="application/pdf,image/jpeg,image/png,image/*"
              className="entrega__arquivo" disabled={enviando != null} onChange={(e) => enviar(t.valor, e.target.files?.[0])} />
            {enviando === t.valor ? 'Enviando…' : `Enviar ${t.rotulo}`}
          </label>
        ))}
      </div>
    </div>
  )
}

/** Quem contratou vê os documentos do motorista que aceitou e abre um por vez. Cada "Abrir" gera um link novo. */
export function DocumentosParaContratante({ freteId, status, nomes }: { freteId: string; status: StatusFrete; nomes: Record<string, string> }) {
  const visivel = CONTRATANTE_VE.includes(status)
  const [estado] = useRecurso(() => (visivel ? api<Documento[]>('GET', `/api/fretes/${freteId}/documentos`) : Promise.resolve([])), [freteId, visivel])
  const [abrindo, setAbrindo] = useState<string | null>(null)
  const [problema, setProblema] = useState<Problema | null>(null)

  async function abrir(doc: Documento) {
    setAbrindo(doc.id)
    setProblema(null)
    try {
      await abrirDocumento(doc.id)
    } catch (falha) {
      setProblema(comoProblema(falha))
    } finally {
      setAbrindo(null)
    }
  }

  if (!visivel) {
    return (
      <p className="detalhe">
        {status === 'CANCELADO'
          ? 'Frete cancelado antes do aceite: nenhum documento foi aberto.'
          : 'A CNH e o CRLV do motorista aparecem aqui depois que você aceitar a proposta dele. Antes disso, cada proposta já mostra a reputação e os documentos que o Fretaí verificou.'}
      </p>
    )
  }
  if (estado.fase !== 'pronto') return null
  const porMotorista = new Map<string, Documento[]>()
  for (const d of estado.dados) porMotorista.set(d.motoristaId, [...(porMotorista.get(d.motoristaId) ?? []), d])
  if (porMotorista.size === 0) {
    return <p className="detalhe">O motorista ainda não enviou documentos para este frete. Ele manda a CNH e o CRLV pelo aplicativo.</p>
  }
  return (
    <div className="documentos" aria-live="polite">
      {problema && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}
      {[...porMotorista].map(([motoristaId, docs]) => (
        <div key={motoristaId} className="documentos__motorista">
          <p className="documentos__nome">{nomes[motoristaId] ?? 'Motorista'}</p>
          <ul className="documentos__lista">
            {docs.map((d) => (
              <li key={d.id} className="documentos__item">
                <span className="documentos__tipo">{rotuloDocumento(d.tipo)}</span>
                <span className={d.verificado ? 'doc doc--ok' : 'detalhe'}>{d.verificado ? 'verificado pelo Fretaí' : 'ainda não verificado'}</span>
                <button type="button" className="botao botao--secundario" disabled={abrindo === d.id} onClick={() => abrir(d)}>
                  {abrindo === d.id ? 'Abrindo…' : 'Abrir'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="detalhe">Cada abertura fica registrada e o motorista vê quando o documento foi aberto.</p>
    </div>
  )
}
