import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, MODO_DEMO } from '../../api/cliente'
import type { FreteEncontrado, Pagina, PerfilEmpresa } from '../../api/tipos'
import { useRecurso } from '../../api/useRecurso'
import { CardFrete } from '../../components/CardFrete'
import { useTitulo } from '../../useTitulo'
import { ErroCarga, Esqueleto, Indicador, Vazio } from '../../components/ui'

const RAIOS = [50, 100, 200]

/** A origem e o raio ficam na URL: voltar do detalhe devolve a mesma busca. */
export function BuscaFretes() {
  useTitulo('Fretes perto de você')
  const [params, setParams] = useSearchParams()
  const raio = Number(params.get('raio') ?? 100)
  const cep = params.get('cep') ?? (MODO_DEMO ? '13069-380' : '')
  const lat = params.get('lat')
  const lng = params.get('lng')
  const temOrigem = Boolean(cep || (lat && lng))

  function trocar(novos: Record<string, string | null>) {
    const p = new URLSearchParams(params)
    for (const [k, v] of Object.entries(novos)) {
      if (v == null) p.delete(k)
      else p.set(k, v)
    }
    setParams(p)
  }

  return (
    <div className="busca">
      <h1 className="busca__titulo">Fretes perto de você</h1>
      {/* key: trocar a origem pela URL recria o campo com o valor novo, sem efeito sincronizando estado. */}
      <Origem key={cep} cep={cep} usandoGps={Boolean(lat && lng)} aoMudar={trocar} />

      <div className="segmentado" role="group" aria-label="Raio da busca">
        {RAIOS.map((r) => (
          <button key={r} type="button" className="segmentado__opcao" aria-pressed={raio === r} onClick={() => trocar({ raio: String(r) })}>
            {raio === r && <Indicador id="raio" forma="fundo" />}
            {r}&nbsp;km
          </button>
        ))}
      </div>

      {temOrigem ? (
        <Resultados raio={raio} cep={cep} lat={lat} lng={lng} aoAumentar={raio < 200 ? () => trocar({ raio: String(RAIOS[RAIOS.indexOf(raio) + 1] ?? 200) }) : undefined} />
      ) : (
        <Vazio titulo="De onde você sai?">Informe o CEP ou use a localização do celular para ver os fretes no seu raio.</Vazio>
      )}
    </div>
  )
}

function Origem({ cep, usandoGps, aoMudar }: { cep: string; usandoGps: boolean; aoMudar: (n: Record<string, string | null>) => void }) {
  const [texto, setTexto] = useState(cep)
  const [gps, setGps] = useState<'parado' | 'buscando' | 'negado'>('parado')

  function enviar(e: FormEvent) {
    e.preventDefault()
    aoMudar({ cep: texto.trim() || null, lat: null, lng: null })
  }

  function usarLocalizacao() {
    setGps('buscando')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps('parado')
        aoMudar({ lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5), cep: null })
      },
      () => setGps('negado'),
      { timeout: 10_000 },
    )
  }

  return (
    <form className="origem" onSubmit={enviar}>
      <div className="campo origem__campo">
        <label htmlFor="cep-origem" className="campo__rotulo">{usandoGps ? 'Usando sua localização' : 'CEP de onde você sai'}</label>
        <div className="origem__linha">
          <input id="cep-origem" name="cep" inputMode="numeric" autoComplete="postal-code" spellCheck={false} placeholder="13069-380"
            pattern="\d{5}-?\d{3}" className="campo__entrada" value={texto} onChange={(e) => setTexto(e.target.value)} />
          <button type="submit" className="botao botao--secundario">Buscar</button>
        </div>
      </div>
      <button type="button" className="botao botao--fantasma origem__gps" onClick={usarLocalizacao} disabled={gps === 'buscando'}>
        {gps === 'buscando' ? 'Pegando localização…' : 'Usar minha localização'}
      </button>
      <p aria-live="polite" className="origem__aviso">
        {gps === 'negado' && 'Sem acesso à localização. Use o CEP ou libere o GPS nas configurações do navegador.'}
      </p>
    </form>
  )
}

function Resultados({ raio, cep, lat, lng, aoAumentar }: { raio: number; cep: string; lat: string | null; lng: string | null; aoAumentar?: () => void }) {
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
    return estado.mostrarEsqueleto ? <div className="lista-cards">{[0, 1, 2].map((i) => <Esqueleto key={i} linhas={4} />)}</div> : <div className="lista-cards lista-cards--reserva" />
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
      <p className="busca__contagem" aria-live="polite">{achados.length === 1 ? '1 frete' : `${achados.length} fretes`} em até {raio}&nbsp;km, do mais perto ao mais longe</p>
      <div className="lista-cards">
        {achados.map((a) => (
          <CardFrete key={a.frete.id} frete={a.frete} distanciaOrigemKm={a.distanciaOrigemKm} perfil={a.frete.empresa ? perfis[a.frete.empresa.id] : undefined} />
        ))}
      </div>
    </>
  )
}
