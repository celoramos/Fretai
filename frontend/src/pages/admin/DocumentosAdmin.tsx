import { useEffect, useRef, useState } from 'react'
import { api, comoProblema } from '../../api/cliente'
import type { Documento, PerfilMotorista, Problema } from '../../api/tipos'
import { ouNulo, useRecurso } from '../../api/useRecurso'
import { Aviso, ErroCarga, Esqueleto, Vazio } from '../../components/ui'
import { abrirDocumento, formatoArquivo, rotuloDocumento, tamanhoArquivo } from '../../documento'
import { dataHora } from '../../formato'
import { useTitulo } from '../../useTitulo'

/*
 * Fila de documentos, do mais antigo para o mais novo. Verificar faz o documento aparecer para as
 * empresas como conferido pelo Fretaí e não tem volta pela API: por isso pede confirmação, e a
 * confirmação avisa quando o documento nem foi aberto.
 */
export function DocumentosAdmin() {
  useTitulo('Documentos para verificar')
  const [estado, recarregar] = useRecurso(async () => {
    const docs = await api<Documento[]>('GET', '/api/documentos/pendentes')
    const ids = [...new Set(docs.map((d) => d.motoristaId))]
    const perfis = await Promise.all(ids.map((id) => ouNulo(api<PerfilMotorista>('GET', `/api/motoristas/${id}/perfil`))))
    return { docs, perfis: Object.fromEntries(perfis.filter((p): p is PerfilMotorista => p != null).map((p) => [p.id, p])) }
  }, [])
  // Verificado sai da fila na hora, sem recarregar a lista inteira.
  const [verificados, setVerificados] = useState<string[]>([])
  const fila = estado.fase === 'pronto' ? estado.dados.docs.filter((d) => !verificados.includes(d.id)) : []

  return (
    <div className="fila">
      <header className="fila__cabeca">
        <h1 className="titulo-pagina">Documentos para verificar</h1>
        <p className="detalhe">Do mais antigo para o mais novo. Verificado, o documento aparece para as empresas como conferido pelo Fretaí.</p>
      </header>
      <div className="perfil__estado" aria-live="polite">
        {verificados.length > 0 && <p className="perfil__ok">{verificados.length === 1 ? '1 documento verificado.' : `${verificados.length} documentos verificados.`}</p>}
      </div>
      {estado.fase === 'carregando' && estado.mostrarEsqueleto && <><Esqueleto linhas={3} /><Esqueleto linhas={3} /></>}
      {estado.fase === 'erro' && <ErroCarga problema={estado.problema} tentarDeNovo={recarregar} />}
      {estado.fase === 'pronto' && fila.length === 0 && (
        <Vazio titulo="Nenhum documento esperando.">Quando um motorista enviar CNH, CRLV ou outro comprovante, ele entra aqui.</Vazio>
      )}
      {fila.length > 0 && (
        <ul className="fila__lista">
          {fila.map((d) => (
            <ItemDocumento key={d.id} doc={d} perfil={estado.fase === 'pronto' ? estado.dados.perfis[d.motoristaId] : undefined}
              aoVerificar={() => setVerificados((v) => [...v, d.id])} />
          ))}
        </ul>
      )}
    </div>
  )
}

function ItemDocumento({ doc, perfil, aoVerificar }: { doc: Documento; perfil?: PerfilMotorista; aoVerificar: () => void }) {
  const [abriu, setAbriu] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [ocupado, setOcupado] = useState<'abrir' | 'verificar' | null>(null)
  const [problema, setProblema] = useState<Problema | null>(null)
  const pergunta = useRef<HTMLParagraphElement>(null)
  // A pergunta abre no lugar dos botões: o foco vai para ela, para o leitor de tela ler o aviso inteiro.
  useEffect(() => {
    if (confirmando) pergunta.current?.focus()
  }, [confirmando])

  async function abrir() {
    setOcupado('abrir')
    setProblema(null)
    try {
      await abrirDocumento(doc.id)
      setAbriu(true)
    } catch (falha) {
      setProblema(comoProblema(falha))
    } finally {
      setOcupado(null)
    }
  }

  async function verificar() {
    setOcupado('verificar')
    setProblema(null)
    try {
      await api('POST', `/api/documentos/${doc.id}/verificacao`)
      aoVerificar()
    } catch (falha) {
      setProblema(comoProblema(falha))
      setOcupado(null)
    }
  }

  return (
    <li className="cartao fila__item">
      <div className="fila__dados">
        <p className="fila__titulo">{rotuloDocumento(doc.tipo)} <span className="fila__de">de {perfil?.nome ?? 'motorista sem perfil'}</span></p>
        <p className="detalhe">Enviado {dataHora(doc.criadoEm)} · {formatoArquivo(doc.contentType)}, {tamanhoArquivo(doc.tamanhoBytes)}</p>
        {perfil && (
          <p className="detalhe">
            Já verificados deste motorista: {perfil.documentosVerificados.length ? perfil.documentosVerificados.map(rotuloDocumento).join(', ') : 'nenhum'}
          </p>
        )}
      </div>
      <div className="fila__fim" aria-live="polite">
        {problema && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}
        {confirmando ? (
          <>
            <p ref={pergunta} tabIndex={-1} className="fila__pergunta">
              {abriu ? '' : 'Você ainda não abriu este documento. '}
              Depois de verificado, ele aparece para as empresas como conferido pelo Fretaí, e não há como desfazer por aqui.
            </p>
            <div className="fila__acoes">
              <button type="button" className="botao botao--primario" disabled={ocupado != null} onClick={verificar}>
                {ocupado === 'verificar' ? 'Verificando…' : 'Confirmar verificação'}
              </button>
              <button type="button" className="botao botao--fantasma" disabled={ocupado === 'verificar'} onClick={() => setConfirmando(false)}>Voltar</button>
            </div>
          </>
        ) : (
          <div className="fila__acoes">
            <button type="button" className="botao botao--secundario" disabled={ocupado === 'abrir'} onClick={abrir}>{ocupado === 'abrir' ? 'Abrindo…' : 'Abrir'}</button>
            <button type="button" className="botao botao--primario" onClick={() => setConfirmando(true)}>Verificar</button>
          </div>
        )}
      </div>
    </li>
  )
}
