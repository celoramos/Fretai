import { useEffect, useRef, useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { useSearchParams } from 'react-router-dom'
import { api, MODO_DEMO } from '../../api/cliente'
import type { ConsultaCep, FreteEncontrado, Pagina, PerfilEmpresa, Veiculo } from '../../api/tipos'
import { ouNulo, useRecurso } from '../../api/useRecurso'
import { CardFrete } from '../../components/CardFrete'
import { CabecalhoPagina } from '../../components/CabecalhoPagina'
import { ErroCarga, Esqueleto, Vazio } from '../../components/ui'
import { motivoDeNenhumLevar } from '../../compatibilidade'
import { useComputador } from '../../largura'
import { lista } from '../../movimento'
import { useSessao } from '../../sessao'
import { useTitulo } from '../../useTitulo'

const RAIOS = [10, 25, 50]
const RAIO_PADRAO = 25
const ESPERA_GPS_MS = 10_000
const digitos = (s: string) => s.replace(/\D/g, '')
const comMascara = (d: string) => `${d.slice(0, 5)}-${d.slice(5)}`

/** A origem e o raio ficam na URL: voltar do detalhe devolve a mesma busca. */
export function BuscaFretes() {
  useTitulo('Fretes perto de você')
  const computador = useComputador()
  const [params, setParams] = useSearchParams()
  const raioUrl = Number(params.get('raio'))
  const raio = RAIOS.includes(raioUrl) ? raioUrl : RAIO_PADRAO
  const cep = params.get('cep') ?? (MODO_DEMO ? '13069-380' : '')
  const lat = params.get('lat')
  const lng = params.get('lng')
  const gpsAtivo = Boolean(lat && lng)
  const temOrigem = Boolean(cep || gpsAtivo)
  const [cepAberto, setCepAberto] = useState(!temOrigem)
  const [gps, setGps] = useState<'parado' | 'localizando' | 'sem-acesso'>('parado')
  const desistir = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(desistir.current), [])

  function trocar(novos: Record<string, string | null>) {
    const p = new URLSearchParams(params)
    for (const [k, v] of Object.entries(novos)) {
      if (v == null) p.delete(k)
      else p.set(k, v)
    }
    setParams(p)
  }

  // O pedido de posição desiste em 10 s, mesmo se a pessoa nunca responder à pergunta do navegador.
  function usarGps() {
    if (!navigator.geolocation) return semAcesso()
    setGps('localizando')
    let respondeu = false
    window.clearTimeout(desistir.current)
    desistir.current = window.setTimeout(() => { if (!respondeu) semAcesso() }, ESPERA_GPS_MS)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        respondeu = true
        window.clearTimeout(desistir.current)
        setGps('parado')
        setCepAberto(false)
        trocar({ lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5), cep: null })
      },
      () => { respondeu = true; window.clearTimeout(desistir.current); semAcesso() },
      { timeout: ESPERA_GPS_MS },
    )
  }
  function semAcesso() {
    setGps('sem-acesso')
    setCepAberto(true)
  }

  return (
    <div className="busca-m">
      <div className="busca-m__topo">
        <CabecalhoPagina titulo="Fretes perto de você" />
        <div className="busca-m__origem">
          <span className="busca-m__local"><span>Perto de</span><strong><Local cep={cep} gps={gpsAtivo} /></strong></span>
          <div className="busca-m__botoes">
            <button type="button" className="botao botao--secundario" aria-expanded={cepAberto} aria-controls="busca-cep" onClick={() => setCepAberto(!cepAberto)}>
              {computador ? 'Buscar por CEP' : 'CEP'}
            </button>
            <button type="button" className="botao botao--secundario" onClick={usarGps} disabled={gps === 'localizando'}>
              <svg className="icone-traco" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="7" /></svg>
              {gps === 'localizando' ? 'Localizando…' : 'Usar GPS'}
            </button>
          </div>
        </div>
        <p className="busca-m__aviso" aria-live="polite">{gps === 'sem-acesso' && 'Sem acesso à localização. Busque pelo CEP.'}</p>
        {cepAberto && <BuscaCep key={cep} inicial={cep} aoBuscar={(c) => { setCepAberto(false); setGps('parado'); trocar({ cep: c, lat: null, lng: null }) }} />}
        <div className="busca-m__raios" role="group" aria-label="Raio da busca">
          {RAIOS.map((r) => (
            <button key={r} type="button" className="busca-m__raio" aria-pressed={raio === r} onClick={() => trocar({ raio: String(r) })}>{r} km</button>
          ))}
        </div>
      </div>

      {temOrigem ? (
        <Resultados raio={raio} cep={cep} lat={lat} lng={lng} aoAumentar={raio < 50 ? () => trocar({ raio: String(RAIOS[RAIOS.indexOf(raio) + 1]) }) : undefined} />
      ) : (
        <Vazio titulo="De onde você sai?">Busque pelo CEP ou use o GPS do celular para ver os fretes no seu raio.</Vazio>
      )}
    </div>
  )
}

/** "Pituba, Salvador" pelo CEP; "sua localização" pelo GPS. */
function Local({ cep, gps }: { cep: string; gps: boolean }) {
  const d = digitos(cep)
  const [lugar] = useRecurso(() => (!gps && d.length === 8 ? ouNulo(api<ConsultaCep>('GET', `/api/enderecos/cep/${comMascara(d)}`)) : Promise.resolve(null)), [d, gps])
  if (gps) return <>sua localização (GPS)</>
  if (lugar.fase === 'pronto' && lugar.dados) return <>{lugar.dados.bairro ? `${lugar.dados.bairro}, ${lugar.dados.cidade}` : `${lugar.dados.cidade}/${lugar.dados.uf}`}</>
  return <>{d.length === 8 ? `CEP ${comMascara(d)}` : 'escolha de onde'}</>
}

function BuscaCep({ inicial, aoBuscar }: { inicial: string; aoBuscar: (cep: string) => void }) {
  const [texto, setTexto] = useState(inicial)
  const [erro, setErro] = useState(false)
  function enviar(e: FormEvent) {
    e.preventDefault()
    const d = digitos(texto)
    if (d.length !== 8) return setErro(true)
    setErro(false)
    aoBuscar(comMascara(d))
  }
  return (
    <form id="busca-cep" className="busca-m__cep" onSubmit={enviar} noValidate>
      <div className="campo">
        <label htmlFor="cep-origem" className="campo__rotulo">CEP de onde buscar</label>
        <input id="cep-origem" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" className="campo__entrada campo__entrada--cep"
          value={texto} onChange={(e) => setTexto(e.target.value)} aria-invalid={erro || undefined} aria-describedby={erro ? 'cep-origem-erro' : undefined} autoFocus />
      </div>
      <button type="submit" className="botao botao--primario">Buscar</button>
      {erro && <p id="cep-origem-erro" className="campo__erro" role="alert">Digite os 8 números do CEP.</p>}
    </form>
  )
}

function Resultados({ raio, cep, lat, lng, aoAumentar }: { raio: number; cep: string; lat: string | null; lng: string | null; aoAumentar?: () => void }) {
  const { tokens } = useSessao()
  const motoristaId = tokens?.usuarioId ?? ''
  // Os veículos do motorista decidem qual cartão fica apagado. Sem eles, nenhum fica.
  const [veiculos] = useRecurso(() => ouNulo(api<Veiculo[]>('GET', `/api/motoristas/${motoristaId}/veiculos`)).catch(() => null), [motoristaId])
  const meus = veiculos.fase === 'pronto' ? veiculos.dados : null
  const [estado, recarregar] = useRecurso(async () => {
    const q = new URLSearchParams({ raioKm: String(raio) })
    if (lat && lng) { q.set('origemLat', lat); q.set('origemLng', lng) } else q.set('origemCep', cep)
    const pagina = await api<Pagina<FreteEncontrado>>('GET', `/api/fretes/busca?${q}`)
    // Reputação: uma consulta por empresa distinta, não por card. Falha aqui não derruba a lista.
    const ids = [...new Set(pagina.content.map((a) => a.frete.empresa?.id).filter((x): x is string => Boolean(x)))]
    const perfis = await Promise.all(ids.map((id) => api<PerfilEmpresa>('GET', `/api/empresas/${id}/perfil`).catch(() => null)))
    return { achados: pagina.content, perfis: Object.fromEntries(perfis.filter((p): p is PerfilEmpresa => p != null).map((p) => [p.id, p])) }
  }, [raio, cep, lat, lng])

  if (estado.fase === 'carregando') {
    return estado.mostrarEsqueleto ? <div className="busca-m__lista">{[0, 1, 2].map((i) => <Esqueleto key={i} linhas={4} />)}</div> : <div className="busca-m__lista lista-cards--reserva" />
  }
  if (estado.fase === 'erro') return <ErroCarga problema={estado.problema} tentarDeNovo={recarregar} />
  const { achados, perfis } = estado.dados
  if (achados.length === 0) {
    return (
      <Vazio titulo={`Nenhum frete em ${raio} km agora.`}
        acao={aoAumentar && <button type="button" className="botao botao--primario" onClick={aoAumentar}>Aumentar o raio</button>}>
        {aoAumentar ? 'Aumente o raio ou volte mais tarde: frete novo entra o dia todo.' : 'Volte mais tarde: frete novo entra o dia todo.'}
      </Vazio>
    )
  }
  return (
    <>
      <p className="busca-m__resumo" role="status">{achados.length === 1 ? '1 frete' : `${achados.length} fretes`} até {raio} km</p>
      <motion.div className="busca-m__lista" variants={lista} initial="oculta" animate="visivel">
        {achados.map((a) => (
          <CardFrete key={a.frete.id} frete={a.frete} distanciaOrigemKm={a.distanciaOrigemKm} perfil={a.frete.empresa ? perfis[a.frete.empresa.id] : undefined}
            naoLeva={motivoDeNenhumLevar(a.frete, meus)} />
        ))}
      </motion.div>
    </>
  )
}
