import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, ErroApi } from '../../api/cliente'
import type { PedidoCalculo, Problema, ResultadoCalculo } from '../../api/tipos'
import { Valor } from '../../components/Dinheiro'
import { Aviso, Campo } from '../../components/ui'
import { CARGAS_ANTT, carga, lerReais, reais, reaisCentavos } from '../../formato'
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

const numeroOuNulo = (t: string) => {
  const n = lerReais(t)
  return Number.isFinite(n) ? n : null
}

/*
 * "Esse frete paga a viagem?": a conta do caminhoneiro, feita pela API (diesel, pedágio, outros e o
 * piso ANTT). Vindo de um frete, a distância, o valor, a carga e os eixos já chegam pelo endereço da
 * página (?km=&valor=&carga=&eixos=), então dá para mandar a conta para alguém e ela abre igual.
 */
export function Calculadora() {
  useTitulo('Calculadora')
  const [params, setParams] = useSearchParams()
  const custos = lerCustos()
  const [km, setKm] = useState(params.get('km') ?? '')
  const [valor, setValor] = useState(params.get('valor') ?? '')
  const [consumo, setConsumo] = useState(custos.consumo)
  const [diesel, setDiesel] = useState(custos.diesel)
  const [pedagio, setPedagio] = useState('')
  const [outros, setOutros] = useState('')
  const [tipoCarga, setTipoCarga] = useState(params.get('carga') ?? '')
  const [eixos, setEixos] = useState(params.get('eixos') ?? '')
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(null)
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null)
  const areaResultado = useRef<HTMLDivElement>(null)
  // No celular o resultado nasce abaixo do formulário: a tela desce até ele.
  useEffect(() => {
    if (resultado) areaResultado.current?.scrollIntoView({ block: 'start' })
  }, [resultado])

  async function calcular(e: FormEvent) {
    e.preventDefault()
    setProblema(null)
    const pedido: PedidoCalculo = {
      distanciaKm: numeroOuNulo(km) ?? 0,
      consumoKmPorLitro: numeroOuNulo(consumo) ?? 0,
      precoDieselLitro: numeroOuNulo(diesel) ?? 0,
      pedagio: numeroOuNulo(pedagio),
      outrosCustos: numeroOuNulo(outros),
      tipoCargaAntt: tipoCarga || null,
      numeroEixos: eixos ? Number(eixos) : null,
      valorOferecido: numeroOuNulo(valor),
    }
    setEnviando(true)
    try {
      setResultado(await api<ResultadoCalculo>('POST', '/api/calculadora/frete', pedido))
      localStorage.setItem(CHAVE_CUSTOS, JSON.stringify({ consumo, diesel }))
      // A conta feita fica no endereço: voltar, recarregar ou mandar o link abre a mesma conta.
      setParams(Object.fromEntries(Object.entries({ km, valor, carga: tipoCarga, eixos }).filter(([, v]) => v)), { replace: true })
    } catch (falha) {
      setProblema(falha instanceof ErroApi ? falha.problema : { title: 'Erro', detail: String(falha), status: 0 })
      setResultado(null)
    } finally {
      setEnviando(false)
    }
  }

  const erro = (c: string) => problema?.erros?.[c]
  const campo = (id: string, rotulo: string, chaveErro: string, valorCampo: string, mudar: (v: string) => void, exemplo: string, ajuda?: string) => (
    <Campo id={id} rotulo={rotulo} erro={erro(chaveErro)} ajuda={ajuda}>
      <input id={id} inputMode="decimal" className="campo__entrada" value={valorCampo} onChange={(e) => mudar(e.target.value)} placeholder={exemplo}
        aria-invalid={erro(chaveErro) ? true : undefined} aria-describedby={erro(chaveErro) ? `${id}-erro` : ajuda ? `${id}-ajuda` : undefined} />
    </Campo>
  )

  return (
    <div className="calculadora">
      <div className="calculadora__cabeca">
        <h1 className="busca__titulo">Esse frete paga a viagem?</h1>
        <p className="detalhe">Diesel, pedágio e o resto, contra o valor oferecido e o piso da ANTT.</p>
      </div>

      <form className="cartao calculadora__form" onSubmit={calcular} noValidate>
        <div className="publicar__linha">
          {campo('calc-km', 'Distância (km)', 'distanciaKm', km, setKm, '430')}
          {campo('calc-valor', 'Valor oferecido (R$)', 'valorOferecido', valor, setValor, '4.850')}
        </div>
        <div className="publicar__linha">
          {campo('calc-consumo', 'Consumo (km/l)', 'consumoKmPorLitro', consumo, setConsumo, '2,5')}
          {campo('calc-diesel', 'Diesel (R$/l)', 'precoDieselLitro', diesel, setDiesel, '6,20')}
        </div>
        <div className="publicar__linha">
          {campo('calc-pedagio', 'Pedágio (R$)', 'pedagio', pedagio, setPedagio, '380')}
          {campo('calc-outros', 'Outros custos (R$)', 'outrosCustos', outros, setOutros, '150', 'Comida, chapa, pernoite.')}
        </div>
        <div className="publicar__linha">
          <Campo id="calc-carga" rotulo="Tipo de carga" ajuda="Com carga e eixos, entra o piso ANTT.">
            <select id="calc-carga" className="campo__entrada" value={tipoCarga} onChange={(e) => setTipoCarga(e.target.value)} aria-describedby="calc-carga-ajuda">
              <option value="">Sem piso</option>
              {CARGAS_ANTT.map((c) => <option key={c.valor} value={c.valor}>{c.rotulo}</option>)}
            </select>
          </Campo>
          <Campo id="calc-eixos" rotulo="Eixos" erro={erro('numeroEixos')}>
            <select id="calc-eixos" className="campo__entrada" value={eixos} onChange={(e) => setEixos(e.target.value)}>
              <option value="">—</option>
              {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Campo>
        </div>
        {problema && !problema.erros && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}
        <button type="submit" className="botao botao--primario botao--largo" disabled={enviando}>{enviando ? 'Fazendo a conta…' : 'Fazer a conta'}</button>
        <p className="campo__ajuda">Consumo e diesel ficam guardados neste aparelho para a próxima conta.</p>
      </form>

      <div ref={areaResultado} className="calculadora__area" aria-live="polite">{resultado && <Resultado r={resultado} />}</div>
    </div>
  )
}

function Resultado({ r }: { r: ResultadoCalculo }) {
  const sobra = r.margem != null && r.margem >= 0
  return (
    <section className="cartao calculadora__resultado" aria-labelledby="calc-resultado">
      <h2 id="calc-resultado" className="bloco__titulo">Resultado</h2>
      {r.margem != null ? (
        <p className={sobra ? 'calculadora__margem' : 'calculadora__margem calculadora__margem--falta'}>
          <span>{sobra ? 'Sobra' : 'Falta'}</span>
          <Valor valor={Math.abs(r.margem)} tamanho="grande" />
        </p>
      ) : (
        <p className="calculadora__margem"><span>A viagem custa</span><Valor valor={r.custo.total} tamanho="grande" /></p>
      )}
      <dl className="ficha">
        <div><dt>Diesel</dt><dd>{reaisCentavos(r.custo.litros)}&nbsp;l · R$&nbsp;{reais(r.custo.combustivel)}</dd></div>
        {r.custo.pedagio > 0 && <div><dt>Pedágio</dt><dd>R$&nbsp;{reais(r.custo.pedagio)}</dd></div>}
        {r.custo.outros > 0 && <div><dt>Outros</dt><dd>R$&nbsp;{reais(r.custo.outros)}</dd></div>}
        <div><dt>Custo total</dt><dd className="calculadora__total">R$&nbsp;{reais(r.custo.total)}</dd></div>
        {r.valorOferecido != null && <div><dt>Oferecido</dt><dd>R$&nbsp;{reais(r.valorOferecido)}</dd></div>}
      </dl>
      {r.piso && (
        r.abaixoDoPiso ? (
          <Aviso tom="alerta" titulo={`Abaixo do piso ANTT de R$ ${reais(r.piso.valor)}.`}>
            {carga(r.piso.tipoCarga)}, {r.piso.numeroEixos} eixos.{r.piso.coeficientesDeExemplo ? ' Calculado com coeficientes de exemplo.' : ''}
          </Aviso>
        ) : (
          <p className="detalhe">
            Piso ANTT: <strong className="calculadora__piso">R$&nbsp;{reais(r.piso.valor)}</strong> ({carga(r.piso.tipoCarga)}, {r.piso.numeroEixos} eixos)
            {r.piso.coeficientesDeExemplo ? ', calculado com coeficientes de exemplo.' : '.'}
          </p>
        )
      )}
    </section>
  )
}
