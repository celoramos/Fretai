import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api, comoProblema } from '../../api/cliente'
import type { Documento, PerfilMotorista, Problema } from '../../api/tipos'
import { ouNulo, useRecurso } from '../../api/useRecurso'
import { Aviso, Campo, ErroCarga, Esqueleto, Vazio } from '../../components/ui'
import { abrirDocumento, formatoArquivo, rotuloDocumento, tamanhoArquivo } from '../../documento'
import { dataHora } from '../../formato'
import { useTitulo } from '../../useTitulo'

type Saida = 'verificado' | 'recusado'

/*
 * Fila de documentos, do mais antigo para o mais novo. As duas saídas não têm volta pela API: verificado,
 * o documento aparece para as empresas como conferido pelo Fretaí, e por isso pede confirmação (que avisa
 * quando o documento nem foi aberto); recusado, volta para o motorista com o motivo, e o motivo é o passo
 * deliberado: sem ele não se recusa.
 */
export function DocumentosAdmin() {
  useTitulo('Documentos para verificar')
  const [estado, recarregar] = useRecurso(async () => {
    const docs = await api<Documento[]>('GET', '/api/documentos/pendentes')
    const ids = [...new Set(docs.map((d) => d.motoristaId))]
    const perfis = await Promise.all(ids.map((id) => ouNulo(api<PerfilMotorista>('GET', `/api/motoristas/${id}/perfil`))))
    return { docs, perfis: Object.fromEntries(perfis.filter((p): p is PerfilMotorista => p != null).map((p) => [p.id, p])) }
  }, [])
  // Verificado ou recusado sai da fila na hora, sem recarregar a lista inteira.
  const [saidos, setSaidos] = useState<{ id: string; saida: Saida }[]>([])
  const fila = estado.fase === 'pronto' ? estado.dados.docs.filter((d) => !saidos.some((s) => s.id === d.id)) : []
  const quantos = (saida: Saida) => saidos.filter((s) => s.saida === saida).length

  return (
    <div className="fila">
      <header className="fila__cabeca">
        <h1 className="titulo-pagina">Documentos para verificar</h1>
        <p className="detalhe">Do mais antigo para o mais novo. Verificado, o documento aparece para as empresas como conferido pelo Fretaí. Recusado, volta para o motorista com o motivo.</p>
      </header>
      <div className="perfil__estado" aria-live="polite">
        {(['verificado', 'recusado'] as const).map((s) => quantos(s) > 0 && (
          <p key={s} className="perfil__ok">{quantos(s) === 1 ? `1 documento ${s}.` : `${quantos(s)} documentos ${s}s.`}</p>
        ))}
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
              aoSair={(saida) => setSaidos((v) => [...v, { id: d.id, saida }])} />
          ))}
        </ul>
      )}
    </div>
  )
}

function ItemDocumento({ doc, perfil, aoSair }: { doc: Documento; perfil?: PerfilMotorista; aoSair: (saida: Saida) => void }) {
  const [abriu, setAbriu] = useState(false)
  const [modo, setModo] = useState<'parado' | 'verificar' | 'recusar'>('parado')
  const [motivo, setMotivo] = useState('')
  const [ocupado, setOcupado] = useState<'abrir' | Saida | null>(null)
  const [problema, setProblema] = useState<Problema | null>(null)
  const pergunta = useRef<HTMLParagraphElement>(null)
  const campoMotivo = useRef<HTMLTextAreaElement>(null)
  // A pergunta e o motivo abrem no lugar dos botões: o foco vai para eles, para o leitor de tela ler o que mudou.
  useEffect(() => {
    if (modo === 'verificar') pergunta.current?.focus()
    if (modo === 'recusar') campoMotivo.current?.focus()
  }, [modo])

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
    setOcupado('verificado')
    setProblema(null)
    try {
      await api('POST', `/api/documentos/${doc.id}/verificacao`)
      aoSair('verificado')
    } catch (falha) {
      setProblema(comoProblema(falha))
      setOcupado(null)
    }
  }

  async function recusar(e: FormEvent) {
    e.preventDefault()
    setOcupado('recusado')
    setProblema(null)
    try {
      await api('POST', `/api/documentos/${doc.id}/recusa`, { motivo: motivo.trim() })
      aoSair('recusado')
    } catch (falha) {
      setProblema(comoProblema(falha))
      setOcupado(null)
      requestAnimationFrame(() => campoMotivo.current?.focus())
    }
  }

  const voltar = () => { setModo('parado'); setProblema(null) }
  const erroMotivo = problema?.erros?.motivo
  const idMotivo = `motivo-${doc.id}`
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
        {problema && !erroMotivo && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}
        {modo === 'verificar' && (
          <>
            <p ref={pergunta} tabIndex={-1} className="fila__pergunta">
              {abriu ? '' : 'Você ainda não abriu este documento. '}
              Depois de verificado, ele aparece para as empresas como conferido pelo Fretaí, e não há como desfazer por aqui.
            </p>
            <div className="fila__acoes">
              <button type="button" className="botao botao--primario" disabled={ocupado != null} onClick={verificar}>
                {ocupado === 'verificado' ? 'Verificando…' : 'Confirmar verificação'}
              </button>
              <button type="button" className="botao botao--fantasma" disabled={ocupado === 'verificado'} onClick={voltar}>Voltar</button>
            </div>
          </>
        )}
        {modo === 'recusar' && (
          <form className="fila__recusa" onSubmit={recusar} noValidate>
            <Campo id={idMotivo} rotulo="Por que recusar" erro={erroMotivo} ajuda="O motorista lê isto junto do documento e manda outro arquivo.">
              <textarea ref={campoMotivo} id={idMotivo} className="campo__entrada campo__entrada--texto" rows={2} maxLength={300}
                placeholder="Foto tremida: a placa não dá para ler." value={motivo} onChange={(e) => setMotivo(e.target.value)}
                aria-invalid={erroMotivo ? true : undefined} aria-describedby={erroMotivo ? `${idMotivo}-erro` : `${idMotivo}-ajuda`} />
            </Campo>
            <div className="fila__acoes">
              <button type="submit" className="botao botao--perigo" disabled={ocupado != null}>{ocupado === 'recusado' ? 'Recusando…' : 'Recusar documento'}</button>
              <button type="button" className="botao botao--fantasma" disabled={ocupado === 'recusado'} onClick={voltar}>Voltar</button>
            </div>
          </form>
        )}
        {modo === 'parado' && (
          <div className="fila__acoes">
            <button type="button" className="botao botao--secundario" disabled={ocupado === 'abrir'} onClick={abrir}>{ocupado === 'abrir' ? 'Abrindo…' : 'Abrir'}</button>
            <button type="button" className="botao botao--primario" onClick={() => setModo('verificar')}>Verificar</button>
            <button type="button" className="botao botao--fantasma" onClick={() => setModo('recusar')}>Recusar</button>
          </div>
        )}
      </div>
    </li>
  )
}
