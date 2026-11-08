import { useRef, useState } from 'react'
import { api, comoProblema } from '../api/cliente'
import type { AcessoDocumento, Documento, LinkDocumento, Problema } from '../api/tipos'
import { useRecurso } from '../api/useRecurso'
import { prepararFoto } from '../foto'
import { dataHora } from '../formato'
import { Aviso } from './ui'

const TIPOS_DOCUMENTO = [
  { valor: 'CNH', rotulo: 'CNH' },
  { valor: 'CRLV', rotulo: 'CRLV' },
  { valor: 'COMPROVANTE', rotulo: 'Outro comprovante' },
] as const
const rotuloDoc = (t: string) => TIPOS_DOCUMENTO.find((x) => x.valor === t)?.rotulo ?? t

/*
 * Documentos do motorista para um frete. Quem manda é o motorista; quem abre é a empresa, por um link
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
      <p className="detalhe">A empresa abre por um link que vence em minutos, e cada abertura fica registrada aqui.</p>
      {lista.length > 0 && (
        <ul className="documentos__lista">
          {lista.map(({ doc, acessos }) => (
            <li key={doc.id} className="documentos__item">
              <span className="documentos__tipo">{rotuloDoc(doc.tipo)}</span>
              <span className={doc.verificado ? 'doc doc--ok' : 'detalhe'}>{doc.verificado ? 'verificado' : `enviado ${dataHora(doc.criadoEm)}`}</span>
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

/** A empresa vê os documentos de cada motorista do frete e abre um por vez. Cada "Abrir" gera um link novo. */
export function DocumentosParaEmpresa({ freteId, nomes }: { freteId: string; nomes: Record<string, string> }) {
  const [estado] = useRecurso(() => api<Documento[]>('GET', `/api/fretes/${freteId}/documentos`), [freteId])
  const [abrindo, setAbrindo] = useState<string | null>(null)
  const [problema, setProblema] = useState<Problema | null>(null)

  async function abrir(doc: Documento) {
    setAbrindo(doc.id)
    setProblema(null)
    // A aba abre já no clique: navegador bloqueia janela aberta depois de uma espera de rede.
    const janela = window.open('', '_blank')
    try {
      const link = await api<LinkDocumento>('POST', `/api/documentos/${doc.id}/link`)
      if (janela) janela.location.href = link.url
      else window.location.assign(link.url)
    } catch (falha) {
      janela?.close()
      setProblema(comoProblema(falha))
    } finally {
      setAbrindo(null)
    }
  }

  if (estado.fase !== 'pronto') return null
  const porMotorista = new Map<string, Documento[]>()
  for (const d of estado.dados) porMotorista.set(d.motoristaId, [...(porMotorista.get(d.motoristaId) ?? []), d])
  if (porMotorista.size === 0) {
    return <p className="detalhe">Nenhum documento enviado neste frete ainda. O motorista manda a CNH e o CRLV pelo aplicativo.</p>
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
                <span className="documentos__tipo">{rotuloDoc(d.tipo)}</span>
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
