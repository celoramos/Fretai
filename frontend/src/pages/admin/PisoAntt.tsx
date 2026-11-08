import { useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, comoProblema } from '../../api/cliente'
import type { Coeficiente, Problema } from '../../api/tipos'
import { useRecurso } from '../../api/useRecurso'
import { SairSemSalvar } from '../../components/SairSemSalvar'
import { Aviso, Campo, Etiqueta, ErroCarga, Esqueleto } from '../../components/ui'
import { CARGAS_ANTT, carga as rotuloCarga, dataCurta, lerReais, paraDigitar, reaisCentavos } from '../../formato'
import { useTitulo } from '../../useTitulo'

type Edicao = { ccd: string; cc: string }
const chave = (c: Pick<Coeficiente, 'tipoCarga' | 'numeroEixos'>) => `${c.tipoCarga}/${c.numeroEixos}`
const comoTexto = (c: Coeficiente): Edicao => ({ ccd: paraDigitar(c.ccd, 4), cc: paraDigitar(c.cc, 2) })
/** Distância da coluna de conferência: um número redondo para bater o olho no piso que a linha gera. */
const KM_CONFERENCIA = 100

/*
 * Piso mínimo da ANTT (Lei 13.703/2018): piso = distância × CCD + CC, por tipo de carga e número de
 * eixos. Os números da tabela vigente entram aqui, e não no código; até lá, o sistema roda com valores
 * de exemplo e marca o piso como "exemplo" em toda tela que o mostra. Uma carga por vez (na URL), e
 * "Salvar" manda todas as linhas alteradas, de qualquer carga, com a mesma fonte.
 */
export function PisoAntt() {
  useTitulo('Piso ANTT')
  const [params, setParams] = useSearchParams()
  const cargaAtual = params.get('carga') ?? CARGAS_ANTT[0].valor
  const [estado, recarregar] = useRecurso(() => api<Coeficiente[]>('GET', '/api/piso-antt'), [])
  const [salvos, setSalvos] = useState<Record<string, Coeficiente>>({})
  const [edicoes, setEdicoes] = useState<Record<string, Edicao>>({})
  const [errosLinha, setErrosLinha] = useState<Record<string, string>>({})
  const [fonte, setFonte] = useState('')
  const [problema, setProblema] = useState<Problema | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)
  const campoFonte = useRef<HTMLInputElement>(null)

  if (estado.fase === 'carregando') return <div className="piso">{estado.mostrarEsqueleto && <><Esqueleto linhas={2} /><Esqueleto linhas={8} /></>}</div>
  if (estado.fase === 'erro') return <div className="piso"><ErroCarga problema={estado.problema} tentarDeNovo={recarregar} /></div>

  const todos = estado.dados.map((c) => salvos[chave(c)] ?? c)
  const linhas = todos.filter((c) => c.tipoCarga === cargaAtual).sort((a, z) => a.numeroEixos - z.numeroEixos)
  const exemplos = todos.filter((c) => c.exemplo).length
  const alteradas = Object.keys(edicoes)

  function mudar(c: Coeficiente, campo: keyof Edicao, valor: string) {
    setResultado(null)
    setEdicoes((atual) => {
      const k = chave(c)
      const nova = { ...(atual[k] ?? comoTexto(c)), [campo]: valor }
      const original = comoTexto(c)
      if (nova.ccd === original.ccd && nova.cc === original.cc) {
        const { [k]: _desfeita, ...resto } = atual
        return resto
      }
      return { ...atual, [k]: nova }
    })
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setProblema(null)
    setResultado(null)
    if (alteradas.length === 0) {
      setResultado('Nenhuma linha alterada.')
      return
    }
    if (!fonte.trim()) {
      setProblema({ title: '', detail: '', status: 400, erros: { fonte: 'Informe de que resolução da ANTT saíram os números.' } })
      campoFonte.current?.focus()
      return
    }
    // Número ilegível não sai daqui: a linha mostra o erro e as outras esperam.
    const erros: Record<string, string> = {}
    for (const k of alteradas) {
      const { ccd, cc } = edicoes[k]
      if (!(lerReais(ccd) >= 0) || !(lerReais(cc) >= 0)) erros[k] = 'Use números como 2,1234 (CCD) e 350,00 (CC).'
    }
    if (Object.keys(erros).length) {
      setErrosLinha(erros)
      return
    }
    setEnviando(true)
    setErrosLinha({})
    let gravadas = 0
    for (const k of alteradas) {
      const [tipoCarga, eixos] = k.split('/')
      try {
        const novo = await api<Coeficiente>('PUT', `/api/piso-antt/${tipoCarga}/${eixos}`,
          { ccd: lerReais(edicoes[k].ccd), cc: lerReais(edicoes[k].cc), fonte: fonte.trim() })
        gravadas++
        setSalvos((s) => ({ ...s, [k]: novo }))
        setEdicoes(({ [k]: _gravada, ...resto }) => resto)
      } catch (falha) {
        const p = comoProblema(falha)
        if (p.erros?.fonte) {
          setProblema(p)
          campoFonte.current?.focus()
          break
        }
        setErrosLinha((atual) => ({ ...atual, [k]: Object.values(p.erros ?? {})[0] ?? p.detail }))
      }
    }
    setEnviando(false)
    if (gravadas > 0) setResultado(gravadas === 1 ? '1 linha salva.' : `${gravadas} linhas salvas.`)
  }

  const erroFonte = problema?.erros?.fonte
  return (
    <div className="piso">
      <header className="fila__cabeca">
        <h1 className="titulo-pagina">Piso mínimo da ANTT</h1>
        <p className="detalhe">Piso = distância × CCD + CC (Lei 13.703/2018), por tipo de carga e número de eixos. É deste quadro que sai o piso mostrado nos fretes e na calculadora.</p>
      </header>
      {exemplos > 0 && (
        <Aviso tom="alerta" titulo={`${exemplos} de ${todos.length} coeficientes ainda são de exemplo.`}>
          Enquanto forem, o piso aparece marcado como “exemplo” para motoristas e empresas. Troque pelos números da tabela vigente da ANTT.
        </Aviso>
      )}

      <form className="piso__form" onSubmit={salvar} noValidate>
        <div className="piso__campos">
          <Campo id="piso-carga" rotulo="Tipo de carga">
            <select id="piso-carga" className="campo__entrada" value={cargaAtual} onChange={(e) => setParams({ carga: e.target.value })}>
              {CARGAS_ANTT.map((c) => {
                const mexidas = alteradas.filter((k) => k.startsWith(`${c.valor}/`)).length
                return <option key={c.valor} value={c.valor}>{c.rotulo}{mexidas ? ` (${mexidas} sem salvar)` : ''}</option>
              })}
            </select>
          </Campo>
          <Campo id="piso-fonte" rotulo="Fonte dos números" erro={erroFonte} ajuda="A resolução da ANTT de onde saíram. Vai junto de cada linha salva.">
            <input id="piso-fonte" ref={campoFonte} className="campo__entrada" maxLength={200} value={fonte} onChange={(e) => setFonte(e.target.value)}
              placeholder="Resolução ANTT nº 0.000/2026" aria-invalid={erroFonte ? true : undefined}
              aria-describedby={erroFonte ? 'piso-fonte-erro' : 'piso-fonte-ajuda'} />
          </Campo>
        </div>

        <div className="tabela-rolagem cartao">
          <table className="tabela piso__tabela">
            <caption className="visualmente-oculto">Coeficientes de {rotuloCarga(cargaAtual)}</caption>
            <thead>
              <tr>
                <th scope="col">Eixos</th>
                <th scope="col">CCD (R$ por km)</th>
                <th scope="col">CC (R$ carga e descarga)</th>
                <th scope="col" className="tabela__num">Piso em {KM_CONFERENCIA} km</th>
                <th scope="col">Origem</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((c) => {
                const k = chave(c)
                const valores = edicoes[k] ?? comoTexto(c)
                const ccd = lerReais(valores.ccd)
                const cc = lerReais(valores.cc)
                const erro = errosLinha[k]
                const idErro = `piso-erro-${c.tipoCarga}-${c.numeroEixos}`
                return (
                  <tr key={k} className={edicoes[k] ? 'piso__linha--alterada' : undefined}>
                    <th scope="row" className="piso__eixos">{c.numeroEixos}</th>
                    <td>
                      <input className="campo__entrada campo__entrada--numero piso__entrada" inputMode="decimal" value={valores.ccd}
                        aria-label={`CCD, ${c.numeroEixos} eixos`} onChange={(e) => mudar(c, 'ccd', e.target.value)}
                        aria-invalid={erro ? true : undefined} aria-describedby={erro ? idErro : undefined} />
                    </td>
                    <td>
                      <input className="campo__entrada campo__entrada--numero piso__entrada" inputMode="decimal" value={valores.cc}
                        aria-label={`CC, ${c.numeroEixos} eixos`} onChange={(e) => mudar(c, 'cc', e.target.value)}
                        aria-invalid={erro ? true : undefined} aria-describedby={erro ? idErro : undefined} />
                    </td>
                    <td className="tabela__num">{ccd >= 0 && cc >= 0 ? `R$ ${reaisCentavos(KM_CONFERENCIA * ccd + cc)}` : '—'}</td>
                    <td>
                      {erro ? <p id={idErro} className="campo__erro">{erro}</p>
                        : edicoes[k] ? <span className="tabela__sub">sem salvar</span>
                          : c.exemplo ? <Etiqueta tom="alerta">exemplo</Etiqueta>
                            : <span className="tabela__sub">{c.fonte}, {dataCurta(c.atualizadoEm)}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="piso__fim" aria-live="polite">
          {problema && !problema.erros && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}
          <button type="submit" className="botao botao--primario" disabled={enviando}>
            {enviando ? 'Salvando…' : alteradas.length > 1 ? `Salvar ${alteradas.length} linhas` : 'Salvar'}
          </button>
          {resultado && <p className="perfil__ok">{resultado}</p>}
        </div>
      </form>
      <SairSemSalvar alterado={alteradas.length > 0 && !enviando} />
    </div>
  )
}
