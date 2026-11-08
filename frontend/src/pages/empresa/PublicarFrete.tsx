import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ErroApi } from '../../api/cliente'
import type { EnderecoPedido, Frete, Problema, PublicarFrete as Pedido, VerificacaoData } from '../../api/tipos'
import { Aviso } from '../../components/ui'
import { CARGAS_ANTT, CARROCERIAS, dataCurta, lerReais, TIPOS_CAMINHAO } from '../../formato'
import { useSessao } from '../../sessao'
import { useTitulo } from '../../useTitulo'

type Ponta = { cep: string; numero: string; complemento: string; pontoReferencia: string }
const PONTA_VAZIA: Ponta = { cep: '', numero: '', complemento: '', pontoReferencia: '' }

/** Hoje no fuso de quem está publicando: a API recusa coleta no passado. */
const hoje = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Campos que mostram o próprio erro. Os nomes são os da validação da API (PublicarFreteRequest). */
const CAMPOS_DESENHADOS = new Set(['coleta', 'coleta.cep', 'entrega', 'entrega.cep', 'dataColeta', 'descricaoCarga', 'especieCarga',
  'pesoKg', 'tipoCargaAntt', 'valor', 'valorCoerente'])

const pedidoDe = (p: Ponta): EnderecoPedido => ({
  cep: p.cep.trim(),
  numero: p.numero.trim() || null,
  complemento: p.complemento.trim() || null,
  pontoReferencia: p.pontoReferencia.trim() || null,
})

/*
 * Publicar frete: o formulário segue a ordem em que a empresa pensa o frete (de onde para onde, quando,
 * o quê, em que caminhão, por quanto). Cada assunto num cartão. A cidade e a distância saem do CEP, na
 * API; o piso ANTT aparece no detalhe logo depois de publicar, já com a distância calculada.
 */
export function PublicarFrete() {
  useTitulo('Publicar frete')
  const { tokens } = useSessao()
  const navegar = useNavigate()

  const [coleta, setColeta] = useState<Ponta>(PONTA_VAZIA)
  const [entrega, setEntrega] = useState<Ponta>(PONTA_VAZIA)
  const [dataColeta, setDataColeta] = useState('')
  const [descricao, setDescricao] = useState('')
  const [especie, setEspecie] = useState('')
  const [tipoCarga, setTipoCarga] = useState('CARGA_GERAL')
  const [peso, setPeso] = useState('')
  const [veiculos, setVeiculos] = useState<string[]>([])
  const [carrocerias, setCarrocerias] = useState<string[]>([])
  const [rastreador, setRastreador] = useState(false)
  const [complemento, setComplemento] = useState(false)
  const [aCombinar, setACombinar] = useState(false)
  const [valor, setValor] = useState('')

  const [dia, setDia] = useState<VerificacaoData | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(null)
  const formulario = useRef<HTMLFormElement>(null)

  // Alterou alguma coisa: fechar a aba ou recarregar pergunta antes. Accepted cost: um clique num link
  // do próprio app não pergunta, porque o BrowserRouter não tem bloqueio de navegação (só o data router).
  const alterado = [coleta.cep, entrega.cep, descricao, especie, peso, valor, dataColeta].some((v) => v.trim() !== '')
  useEffect(() => {
    if (!alterado || enviando) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [alterado, enviando])

  // Feriado e domingo mudam quem pode pegar o frete: a empresa fica sabendo enquanto escolhe a data.
  useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataColeta)) return
    let vivo = true
    api<VerificacaoData>('GET', `/api/calendario/verificacao?data=${dataColeta}`)
      .then((v) => vivo && setDia(v))
      .catch(() => undefined) // sem a verificação o formulário segue; a API marca o feriado ao publicar
    return () => {
      vivo = false
    }
  }, [dataColeta])

  // A resposta vale só para a data que está no campo: trocar a data some com o aviso da anterior.
  const diaAtual = dia?.data === dataColeta ? dia : null
  const erro = (...campos: string[]) => campos.map((c) => problema?.erros?.[c]).find(Boolean)

  async function publicar(e: FormEvent) {
    e.preventDefault()
    setProblema(null)
    const numeroValor = aCombinar ? null : lerReais(valor)
    const numeroPeso = lerReais(peso)
    const pedido: Pedido = {
      coleta: pedidoDe(coleta),
      entrega: pedidoDe(entrega),
      descricaoCarga: descricao.trim(),
      especieCarga: especie.trim(),
      tipoCargaAntt: tipoCarga,
      pesoKg: Number.isFinite(numeroPeso) ? numeroPeso : 0,
      valor: numeroValor != null && Number.isFinite(numeroValor) ? numeroValor : null,
      valorACombinar: aCombinar,
      dataColeta,
      veiculosAceitos: veiculos,
      carroceriasAceitas: carrocerias,
      exigeRastreador: rastreador,
      complemento,
    }
    setEnviando(true)
    try {
      const novo = await api<Frete>('POST', `/api/fretes/empresa/${tokens?.empresaId}`, pedido)
      navegar(`/empresa/fretes/${novo.id}`, { state: { publicado: true } })
    } catch (falha) {
      const p = falha instanceof ErroApi ? falha.problema : { title: 'Erro', detail: String(falha), status: 0 }
      setProblema(p)
      setEnviando(false)
      // O primeiro campo com erro recebe o foco; sem erro por campo, o aviso no fim do formulário.
      requestAnimationFrame(() => {
        const primeiro = formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ;(primeiro ?? document.getElementById('erro-publicar'))?.focus()
      })
    }
  }

  const alternar = (lista: string[], valor: string) => (lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor])
  // Erro de campo que não tem lugar no formulário (ex.: coleta.numero) sobe para o aviso do fim, para não sumir.
  const soltos = Object.entries(problema?.erros ?? {}).filter(([c]) => !CAMPOS_DESENHADOS.has(c)).map(([, m]) => m)

  return (
    <div className="publicar">
      <Link to="/empresa" className="voltar">Todos os fretes</Link>
      <h1 className="titulo-pagina">Publicar frete</h1>

      <form ref={formulario} className="publicar__form" onSubmit={publicar} noValidate>
        <fieldset className="publicar__grupo cartao">
          <legend className="publicar__legenda">De onde para onde</legend>
          <div className="publicar__pontas">
            <CamposPonta id="coleta" titulo="Coleta" exemploCep="13069-380" ponta={coleta} mudar={setColeta} erroCep={erro('coleta.cep', 'coleta')} />
            <CamposPonta id="entrega" titulo="Entrega" exemploCep="20931-000" ponta={entrega} mudar={setEntrega} erroCep={erro('entrega.cep', 'entrega')} />
          </div>
          <p className="campo__ajuda">A cidade e a distância saem do CEP. Motoristas perto da coleta recebem o aviso.</p>
        </fieldset>

        <fieldset className="publicar__grupo cartao">
          <legend className="publicar__legenda">Quando</legend>
          <Campo id="data-coleta" rotulo="Data da coleta" erro={erro('dataColeta')}>
            <input id="data-coleta" type="date" className="campo__entrada publicar__data" min={hoje()} value={dataColeta}
              onChange={(e) => setDataColeta(e.target.value)} aria-invalid={erro('dataColeta') ? true : undefined}
              aria-describedby={erro('dataColeta') ? 'data-coleta-erro' : 'data-coleta-dia'} />
          </Campo>
          <p id="data-coleta-dia" className="publicar__dia" aria-live="polite">
            {diaAtual?.feriado && `${dataCurta(diaAtual.data)} é feriado${diaAtual.nomeFeriado ? ` (${diaAtual.nomeFeriado})` : ''}. Motorista que não pega frete em feriado não consegue fechar este.`}
            {diaAtual && !diaAtual.feriado && diaAtual.domingo && `${dataCurta(diaAtual.data)} é domingo.`}
          </p>
        </fieldset>

        <fieldset className="publicar__grupo cartao">
          <legend className="publicar__legenda">Carga</legend>
          <Campo id="descricao" rotulo="O que vai" erro={erro('descricaoCarga')}>
            <input id="descricao" className="campo__entrada" maxLength={500} value={descricao} onChange={(e) => setDescricao(e.target.value)}
              placeholder="Pisos cerâmicos paletizados" aria-invalid={erro('descricaoCarga') ? true : undefined} aria-describedby={erro('descricaoCarga') ? 'descricao-erro' : undefined} />
          </Campo>
          <div className="publicar__linha">
            <Campo id="especie" rotulo="Como vai embalada" erro={erro('especieCarga')}>
              <input id="especie" className="campo__entrada" maxLength={100} value={especie} onChange={(e) => setEspecie(e.target.value)}
                placeholder="Paletes" aria-invalid={erro('especieCarga') ? true : undefined} aria-describedby={erro('especieCarga') ? 'especie-erro' : undefined} />
            </Campo>
            <Campo id="peso" rotulo="Peso (kg)" erro={erro('pesoKg')}>
              <input id="peso" inputMode="decimal" className="campo__entrada campo__entrada--numero" value={peso} onChange={(e) => setPeso(e.target.value)}
                placeholder="27.000" aria-invalid={erro('pesoKg') ? true : undefined} aria-describedby={erro('pesoKg') ? 'peso-erro' : undefined} />
            </Campo>
          </div>
          <Campo id="tipo-carga" rotulo="Tipo de carga na tabela ANTT" erro={erro('tipoCargaAntt')} ajuda="Define o piso mínimo do frete.">
            <select id="tipo-carga" className="campo__entrada" value={tipoCarga} onChange={(e) => setTipoCarga(e.target.value)}
              aria-invalid={erro('tipoCargaAntt') ? true : undefined} aria-describedby={erro('tipoCargaAntt') ? 'tipo-carga-erro' : 'tipo-carga-ajuda'}>
              {CARGAS_ANTT.map((c) => <option key={c.valor} value={c.valor}>{c.rotulo}</option>)}
            </select>
          </Campo>
        </fieldset>

        <fieldset className="publicar__grupo cartao">
          <legend className="publicar__legenda">Caminhão</legend>
          <Escolhas titulo="Tipos aceitos" ajuda="Nenhum marcado: qualquer caminhão." opcoes={TIPOS_CAMINHAO} marcados={veiculos}
            alternar={(v) => setVeiculos((l) => alternar(l, v))} />
          <Escolhas titulo="Carrocerias aceitas" ajuda="Nenhuma marcada: qualquer carroceria." opcoes={CARROCERIAS} marcados={carrocerias}
            alternar={(v) => setCarrocerias((l) => alternar(l, v))} />
          <div className="publicar__opcoes">
            <label className="opcao">
              <input type="checkbox" checked={rastreador} onChange={(e) => setRastreador(e.target.checked)} />
              <span>Exige rastreador</span>
            </label>
            <label className="opcao">
              <input type="checkbox" checked={complemento} onChange={(e) => setComplemento(e.target.checked)} />
              <span>A carga não enche o caminhão: o motorista pode completar com outra</span>
            </label>
          </div>
        </fieldset>

        <fieldset className="publicar__grupo cartao">
          <legend className="publicar__legenda">Valor</legend>
          <div className="escolhas" role="radiogroup" aria-label="Como fica o valor">
            <label className="escolha">
              <input type="radio" name="modo-valor" className="escolha__caixa" checked={!aCombinar} onChange={() => setACombinar(false)} />
              <span>Valor fechado</span>
            </label>
            <label className="escolha">
              <input type="radio" name="modo-valor" className="escolha__caixa" checked={aCombinar} onChange={() => setACombinar(true)} />
              <span>A combinar</span>
            </label>
          </div>
          {aCombinar ? (
            <p className="campo__ajuda">O frete aparece sem valor e só fecha por proposta. Você compara as propostas lado a lado.</p>
          ) : (
            <Campo id="valor" rotulo="Valor do frete (R$)" erro={erro('valor', 'valorCoerente')} ajuda="O motorista pode aceitar direto por esse valor ou mandar proposta.">
              <input id="valor" inputMode="decimal" className="campo__entrada campo__entrada--numero publicar__valor" value={valor}
                onChange={(e) => setValor(e.target.value)} placeholder="4.850"
                aria-invalid={erro('valor', 'valorCoerente') ? true : undefined}
                aria-describedby={erro('valor', 'valorCoerente') ? 'valor-erro' : 'valor-ajuda'} />
            </Campo>
          )}
        </fieldset>

        <div className="publicar__fim" aria-live="polite">
          <div id="erro-publicar" tabIndex={-1}>
            {problema && (!problema.erros || soltos.length > 0) && <Aviso tom="perigo" titulo={problema.title}>{soltos.join(' ') || problema.detail}</Aviso>}
          </div>
          <div className="publicar__botoes">
            <button type="submit" className="botao botao--primario" disabled={enviando}>{enviando ? 'Publicando…' : 'Publicar frete'}</button>
            <Link to="/empresa" className="botao botao--fantasma">Cancelar</Link>
          </div>
        </div>
      </form>
    </div>
  )
}

function Campo({ id, rotulo, erro, ajuda, children }: { id: string; rotulo: string; erro?: string; ajuda?: string; children: ReactNode }) {
  return (
    <div className="campo">
      <label htmlFor={id} className="campo__rotulo">{rotulo}</label>
      {children}
      {erro ? <p id={`${id}-erro`} className="campo__erro">{erro}</p> : ajuda ? <p id={`${id}-ajuda`} className="campo__ajuda">{ajuda}</p> : null}
    </div>
  )
}

function CamposPonta({ id, titulo, exemploCep, ponta, mudar, erroCep }: { id: string; titulo: string; exemploCep: string; ponta: Ponta; mudar: (p: Ponta) => void; erroCep?: string }) {
  const muda = (campo: keyof Ponta) => (e: { target: { value: string } }) => mudar({ ...ponta, [campo]: e.target.value })
  return (
    <div className="publicar__ponta">
      <p className="publicar__ponta-titulo">{titulo}</p>
      <Campo id={`${id}-cep`} rotulo="CEP" erro={erroCep}>
        <input id={`${id}-cep`} className="campo__entrada campo__entrada--cep" inputMode="numeric" autoComplete="off" spellCheck={false}
          maxLength={9} placeholder={exemploCep} value={ponta.cep} onChange={muda('cep')}
          aria-invalid={erroCep ? true : undefined} aria-describedby={erroCep ? `${id}-cep-erro` : undefined} />
      </Campo>
      <div className="publicar__linha publicar__linha--numero">
        <Campo id={`${id}-numero`} rotulo="Número">
          <input id={`${id}-numero`} className="campo__entrada" maxLength={20} autoComplete="off" value={ponta.numero} onChange={muda('numero')} />
        </Campo>
        <Campo id={`${id}-complemento`} rotulo="Complemento">
          <input id={`${id}-complemento`} className="campo__entrada" maxLength={255} autoComplete="off" placeholder="Doca 3" value={ponta.complemento} onChange={muda('complemento')} />
        </Campo>
      </div>
      <Campo id={`${id}-referencia`} rotulo="Ponto de referência">
        <input id={`${id}-referencia`} className="campo__entrada" maxLength={255} autoComplete="off" value={ponta.pontoReferencia} onChange={muda('pontoReferencia')} />
      </Campo>
    </div>
  )
}

function Escolhas({ titulo, ajuda, opcoes, marcados, alternar }: {
  titulo: string
  ajuda: string
  opcoes: readonly { valor: string; rotulo: string }[]
  marcados: string[]
  alternar: (valor: string) => void
}) {
  return (
    <fieldset className="publicar__escolhas">
      <legend className="campo__rotulo">{titulo}</legend>
      <div className="escolhas">
        {opcoes.map((o) => (
          <label key={o.valor} className="escolha">
            <input type="checkbox" className="escolha__caixa" checked={marcados.includes(o.valor)} onChange={() => alternar(o.valor)} />
            <span>{o.rotulo}</span>
          </label>
        ))}
      </div>
      <p className="campo__ajuda">{marcados.length ? `Só ${opcoes.filter((o) => marcados.includes(o.valor)).map((o) => o.rotulo).join(', ')}.` : ajuda}</p>
    </fieldset>
  )
}
