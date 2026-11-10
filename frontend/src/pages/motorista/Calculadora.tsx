import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, comoProblema } from '../../api/cliente'
import type { ResultadoCalculo } from '../../api/tipos'
import { CabecalhoPagina } from '../../components/CabecalhoPagina'
import { Valor } from '../../components/Dinheiro'
import { Aviso, Campo } from '../../components/ui'
import { calcularViagem } from '../../calculo'
import { CARGAS_ANTT, carga, lerReais, reais, reaisCentavos } from '../../formato'
import { useComputador } from '../../largura'
import { useTitulo } from '../../useTitulo'

/** Consumo e diesel são do caminhão e da bomba de quem usa: ficam neste aparelho para a próxima conta. */
const CHAVE_CUSTOS = 'fretai.calculadora'
const lerCustos = (): { consumo: string; diesel: string } => {
  try {
    return { consumo: '', diesel: '', ...JSON.parse(localStorage.getItem(CHAVE_CUSTOS) ?? '{}') }
  } catch {
    return { consumo: '', diesel: '' }
  }
}
const guardarCustos = (consumo: string, diesel: string) => {
  try {
    localStorage.setItem(CHAVE_CUSTOS, JSON.stringify({ consumo, diesel }))
  } catch {
    // Sem armazenamento (aba anônima): a conta funciona igual, só não lembra na próxima vez.
  }
}
const numero = (t: string) => {
  const n = lerReais(t)
  return Number.isFinite(n) ? n : null
}

type Campos = { valor: string; km: string; consumo: string; diesel: string; pedagio: string; outros: string; volta: boolean }

/*
 * "Esse frete paga a viagem?", como no canvas: a conta é feita no aparelho a cada tecla (diesel, com a
 * volta vazio, pedágio e outros contra o valor). O piso ANTT fica numa parte opcional, que pergunta à API
 * só quando tem o tipo de carga e os eixos. Vindo de um frete, os números chegam pelo endereço
 * (?km=&valor=&carga=&eixos=).
 */
export function Calculadora() {
  useTitulo('Calculadora')
  const computador = useComputador()
  const [params] = useSearchParams()
  const [c, setC] = useState<Campos>(() => {
    const custos = lerCustos()
    return { valor: params.get('valor') ?? '', km: params.get('km') ?? '', consumo: custos.consumo, diesel: custos.diesel, pedagio: '', outros: '', volta: true }
  })
  const muda = (campo: keyof Campos) => (v: string | boolean) => setC((x) => {
    const novo = { ...x, [campo]: v }
    if (campo === 'consumo' || campo === 'diesel') guardarCustos(novo.consumo, novo.diesel)
    return novo
  })
  const conta = calcularViagem({
    valor: numero(c.valor), distanciaKm: numero(c.km), consumoKmL: numero(c.consumo), dieselLitro: numero(c.diesel),
    pedagio: numero(c.pedagio), outros: numero(c.outros), voltaVazio: c.volta,
  })
  const kmTotal = (numero(c.km) ?? 0) * (c.volta ? 2 : 1)

  const campo = (id: keyof Campos, rotulo: string, exemplo: string) => (
    <Campo id={`calc-${id}`} rotulo={rotulo}>
      <input id={`calc-${id}`} inputMode="decimal" className="campo__entrada campo__entrada--numero" value={c[id] as string} placeholder={exemplo}
        onChange={(e) => muda(id)(e.target.value)} />
    </Campo>
  )

  return (
    <div className="calc-m">
      {computador ? <h1 className="titulo-pagina meus-m__titulo">Calculadora</h1> : <CabecalhoPagina titulo="Calculadora" />}
      <p className="frete-c__texto">Esse frete paga a viagem? Coloque os números e veja quanto sobra.</p>

      <div className="calc-m__colunas">
        <section className="calc-m__numeros" aria-label="Números da viagem">
          <div className="calc-m__grade">
            {campo('valor', 'Valor do frete (R$)', '380')}
            {campo('km', 'Distância (km)', '22')}
            {campo('consumo', 'Consumo (km/l)', '9')}
            {campo('diesel', 'Diesel (R$/l)', '6,19')}
            {campo('pedagio', 'Pedágio (R$)', '0')}
            {campo('outros', 'Outros custos (R$)', '0')}
          </div>
          <label className="cadastro__aceite">
            <input type="checkbox" checked={c.volta} onChange={(e) => muda('volta')(e.target.checked)} />
            <span>Contar a volta vazio</span>
          </label>
          <p className="frete-c__texto--menor">Consumo e diesel ficam guardados neste aparelho para a próxima conta.</p>
        </section>

        <section className="calc-m__resultado" aria-labelledby="t-resultado">
          <h2 id="t-resultado">Resultado</h2>
          {conta ? (
            <>
              <dl className="pedido__resumo">
                <div><dt>Diesel ({reais(kmTotal)} km)</dt><dd>R$ {reaisCentavos(conta.diesel)}</dd></div>
                <div><dt>Pedágio e outros</dt><dd>R$ {reaisCentavos(conta.pedagioEOutros)}</dd></div>
                <div><dt>Custo da viagem</dt><dd>R$ {reaisCentavos(conta.custo)}</dd></div>
              </dl>
              <div role="status" aria-live="polite" className={conta.sobra != null && conta.sobra < 0 ? 'calc-m__sobra calc-m__sobra--falta' : 'calc-m__sobra'}>
                {conta.sobra != null ? (
                  <>
                    <span>{conta.sobra < 0 ? 'Falta' : 'Sobra'}</span>
                    <Valor valor={Math.abs(conta.sobra)} tamanho="grande" />
                    {conta.porKm != null && <span className="frete-c__texto--menor">R$ {reaisCentavos(conta.porKm)} por km rodado com carga</span>}
                  </>
                ) : (
                  <><span>A viagem custa</span><Valor valor={conta.custo} tamanho="grande" /><span className="frete-c__texto--menor">Coloque o valor do frete para ver quanto sobra.</span></>
                )}
              </div>
            </>
          ) : (
            <p className="frete-c__texto" role="status">Coloque a distância, o consumo e o preço do diesel.</p>
          )}
          <button type="button" className="botao botao--secundario botao--largo"
            onClick={() => setC((x) => ({ ...x, valor: '', km: '', consumo: '', pedagio: '', outros: '' }))}>Limpar os números</button>
        </section>
      </div>

      <PisoAntt km={numero(c.km)} valor={numero(c.valor)} consumo={numero(c.consumo)} diesel={numero(c.diesel)} cargaInicial={params.get('carga') ?? ''} eixosIniciais={params.get('eixos') ?? ''} />
    </div>
  )
}

/** O piso ANTT, opcional: com o tipo de carga e os eixos, a API diz o mínimo da tabela para a distância. */
function PisoAntt({ km, valor, consumo, diesel, cargaInicial, eixosIniciais }: {
  km: number | null; valor: number | null; consumo: number | null; diesel: number | null; cargaInicial: string; eixosIniciais: string
}) {
  const [tipoCarga, setTipoCarga] = useState(cargaInicial)
  const [eixos, setEixos] = useState(eixosIniciais)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [r, setR] = useState<ResultadoCalculo | null>(null)
  const pronto = Boolean(tipoCarga && eixos && km)

  async function consultar() {
    if (!pronto) return
    setEnviando(true)
    setErro(null)
    try {
      setR(await api<ResultadoCalculo>('POST', '/api/calculadora/frete', {
        distanciaKm: km, consumoKmPorLitro: consumo ?? 1, precoDieselLitro: diesel ?? 0, pedagio: null, outrosCustos: null,
        tipoCargaAntt: tipoCarga, numeroEixos: Number(eixos), valorOferecido: valor,
      }))
    } catch (e) {
      setErro(comoProblema(e).detail)
      setR(null)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <details className="calc-m__piso">
      <summary>Piso ANTT (opcional)</summary>
      <div className="calc-m__grade">
        <Campo id="calc-carga" rotulo="Tipo de carga">
          <select id="calc-carga" className="campo__entrada" value={tipoCarga} onChange={(e) => setTipoCarga(e.target.value)}>
            <option value="">Escolha</option>
            {CARGAS_ANTT.map((x) => <option key={x.valor} value={x.valor}>{x.rotulo}</option>)}
          </select>
        </Campo>
        <Campo id="calc-eixos" rotulo="Eixos">
          <select id="calc-eixos" className="campo__entrada" value={eixos} onChange={(e) => setEixos(e.target.value)}>
            <option value="">Escolha</option>
            {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Campo>
      </div>
      <button type="button" className="botao botao--secundario" onClick={consultar} disabled={!pronto || enviando}>{enviando ? 'Consultando…' : 'Ver o piso'}</button>
      {!km && <p className="frete-c__texto--menor">Coloque a distância lá em cima.</p>}
      {erro && <Aviso tom="perigo" titulo="Não deu para consultar.">{erro}</Aviso>}
      {r?.piso && (
        r.abaixoDoPiso ? (
          <Aviso tom="alerta" titulo={`Abaixo do piso ANTT de R$ ${reais(r.piso.valor)}.`}>
            {carga(r.piso.tipoCarga)}, {r.piso.numeroEixos} eixos.{r.piso.coeficientesDeExemplo ? ' Calculado com coeficientes de exemplo.' : ''}
          </Aviso>
        ) : (
          <p>Piso ANTT: <strong>R$&nbsp;{reais(r.piso.valor)}</strong> ({carga(r.piso.tipoCarga)}, {r.piso.numeroEixos} eixos){r.piso.coeficientesDeExemplo ? ', calculado com coeficientes de exemplo.' : '.'}</p>
        )
      )}
    </details>
  )
}
