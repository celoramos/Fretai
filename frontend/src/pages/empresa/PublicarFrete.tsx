import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, comoProblema } from '../../api/cliente'
import type { Frete, Problema, PublicarFrete as Pedido, VerificacaoData } from '../../api/tipos'
import { useRecurso } from '../../api/useRecurso'
import { CamposPonta } from '../../components/CamposPonta'
import { SairSemSalvar } from '../../components/SairSemSalvar'
import { Aviso, Campo, ErroCarga, Esqueleto } from '../../components/ui'
import { CARGAS_ANTT, CARROCERIAS, dataCurta, hoje, lerReais, paraDigitar, TIPOS_CAMINHAO } from '../../formato'
import { enderecoDe, PONTA_VAZIA, pontaDe, type Ponta } from '../../ponta'
import { useSessao } from '../../sessao'
import { useTitulo } from '../../useTitulo'

/** O formulário inteiro num objeto só: é o que se compara com o começo para saber se há algo a perder. */
interface Rascunho {
  coleta: Ponta
  entrega: Ponta
  dataColeta: string
  descricao: string
  especie: string
  tipoCarga: string
  peso: string
  veiculos: string[]
  carrocerias: string[]
  rastreador: boolean
  complemento: boolean
  aCombinar: boolean
  valor: string
}

const RASCUNHO_VAZIO: Rascunho = {
  coleta: PONTA_VAZIA, entrega: PONTA_VAZIA, dataColeta: '', descricao: '', especie: '', tipoCarga: 'CARGA_GERAL', peso: '',
  veiculos: [], carrocerias: [], rastreador: false, complemento: false, aCombinar: false, valor: '',
}

/** O frete publicado de volta no formulário, no formato em que a empresa digitaria. */
function rascunhoDe(f: Frete): Rascunho {
  return {
    coleta: pontaDe(f.coleta), entrega: pontaDe(f.entrega), dataColeta: f.dataColeta, descricao: f.descricaoCarga ?? '',
    especie: f.especieCarga ?? '', tipoCarga: f.tipoCargaAntt ?? 'CARGA_GERAL', peso: f.pesoKg != null ? paraDigitar(f.pesoKg) : '',
    veiculos: f.veiculosAceitos, carrocerias: f.carroceriasAceitas, rastreador: f.exigeRastreador, complemento: f.complemento,
    aCombinar: f.valorACombinar, valor: f.valor != null ? paraDigitar(f.valor) : '',
  }
}

// A ordem em que os caminhões foram marcados não muda o frete: a comparação ordena as listas.
const assinatura = (r: Rascunho) => JSON.stringify({ ...r, veiculos: [...r.veiculos].sort(), carrocerias: [...r.carrocerias].sort() })

/** Campos que mostram o próprio erro. Os nomes são os da validação da API (PublicarFreteRequest). */
const CAMPOS_DESENHADOS = new Set(['coleta', 'coleta.cep', 'entrega', 'entrega.cep', 'dataColeta', 'descricaoCarga', 'especieCarga',
  'pesoKg', 'tipoCargaAntt', 'valor', 'valorCoerente'])

function pedidoDe(r: Rascunho): Pedido {
  const valor = r.aCombinar ? null : lerReais(r.valor)
  const peso = lerReais(r.peso)
  return {
    coleta: enderecoDe(r.coleta),
    entrega: enderecoDe(r.entrega),
    descricaoCarga: r.descricao.trim(),
    especieCarga: r.especie.trim(),
    tipoCargaAntt: r.tipoCarga,
    pesoKg: Number.isFinite(peso) ? peso : 0,
    valor: valor != null && Number.isFinite(valor) ? valor : null,
    valorACombinar: r.aCombinar,
    dataColeta: r.dataColeta,
    veiculosAceitos: r.veiculos,
    carroceriasAceitas: r.carrocerias,
    exigeRastreador: r.rastreador,
    complemento: r.complemento,
  }
}

/*
 * Publicar frete: o formulário segue a ordem em que a empresa pensa o frete (de onde para onde, quando,
 * o quê, em que caminhão, por quanto). Cada assunto num cartão. A cidade e a distância saem do CEP, na
 * API; o piso ANTT aparece no detalhe logo depois de publicar, já com a distância calculada.
 */
export function PublicarFrete() {
  useTitulo('Publicar frete')
  const { tokens } = useSessao()
  const navegar = useNavigate()
  return (
    <div className="publicar">
      <Link to="/empresa" className="voltar">Todos os fretes</Link>
      <h1 className="titulo-pagina">Publicar frete</h1>
      <FormularioFrete inicial={RASCUNHO_VAZIO} rotuloEnviar="Publicar frete" rotuloEnviando="Publicando…" cancelarPara="/empresa"
        enviar={async (pedido) => {
          const novo = await api<Frete>('POST', `/api/fretes/empresa/${tokens?.empresaId}`, pedido)
          navegar(`/empresa/fretes/${novo.id}`, { state: { publicado: true } })
        }} />
    </div>
  )
}

/*
 * Editar: o mesmo formulário, preenchido. A API só aceita enquanto o frete não recebeu proposta (depois
 * disso o motorista negociou em cima do anúncio, e mudar o anúncio mudaria o que ele aceitou).
 */
export function EditarFrete() {
  useTitulo('Editar frete')
  const { id = '' } = useParams()
  const navegar = useNavigate()
  const [estado, recarregar] = useRecurso(() => api<Frete>('GET', `/api/fretes/${id}`), [id])

  if (estado.fase === 'carregando') return <div className="publicar">{estado.mostrarEsqueleto && <><Esqueleto linhas={2} /><Esqueleto linhas={6} /></>}</div>
  if (estado.fase === 'erro') return <div className="publicar"><ErroCarga problema={estado.problema} tentarDeNovo={recarregar} /></div>

  const frete = estado.dados
  const voltar = <Link to={`/empresa/fretes/${frete.id}`} className="voltar">{frete.coleta.cidade} para {frete.entrega.cidade}</Link>
  if (frete.status !== 'PUBLICADO') {
    return (
      <div className="publicar">
        {voltar}
        <h1 className="titulo-pagina">Editar frete</h1>
        <Aviso tom="alerta" titulo="Este frete não pode mais ser editado."
          acao={<Link to={`/empresa/fretes/${frete.id}`} className="botao botao--secundario">Ver o frete</Link>}>
          {frete.status === 'CANCELADO'
            ? 'Frete cancelado fica como está.'
            : 'Depois da primeira proposta o anúncio fica como está, porque o motorista negociou em cima dele. Para mudar alguma coisa, cancele e publique de novo.'}
        </Aviso>
      </div>
    )
  }
  return (
    <div className="publicar">
      {voltar}
      <h1 className="titulo-pagina">Editar frete</h1>
      <p className="detalhe">Dá para editar enquanto nenhum motorista mandou proposta. A distância e o piso ANTT são calculados de novo com o que você salvar.</p>
      <FormularioFrete key={frete.id} inicial={rascunhoDe(frete)} rotuloEnviar="Salvar alterações" rotuloEnviando="Salvando…"
        cancelarPara={`/empresa/fretes/${frete.id}`}
        enviar={async (pedido) => {
          await api<Frete>('PUT', `/api/fretes/${frete.id}`, pedido)
          navegar(`/empresa/fretes/${frete.id}`, { state: { editado: true } })
        }} />
    </div>
  )
}

function FormularioFrete({ inicial, enviar, rotuloEnviar, rotuloEnviando, cancelarPara }: {
  inicial: Rascunho
  /** Manda o pedido e navega; se lançar, o erro aparece no formulário. */
  enviar: (pedido: Pedido) => Promise<void>
  rotuloEnviar: string
  rotuloEnviando: string
  cancelarPara: string
}) {
  const [r, setR] = useState(inicial)
  const [base] = useState(() => assinatura(inicial))
  const muda = <K extends keyof Rascunho>(campo: K) => (valor: Rascunho[K]) => setR((x) => ({ ...x, [campo]: valor }))

  const [dia, setDia] = useState<VerificacaoData | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(null)
  const formulario = useRef<HTMLFormElement>(null)

  // Mudou alguma coisa desde que abriu: sair por link, voltar, fechar a aba ou recarregar pergunta antes.
  const alterado = assinatura(r) !== base

  // Feriado e domingo mudam quem pode pegar o frete: a empresa fica sabendo enquanto escolhe a data.
  useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.dataColeta)) return
    let vivo = true
    api<VerificacaoData>('GET', `/api/calendario/verificacao?data=${r.dataColeta}`)
      .then((v) => vivo && setDia(v))
      .catch(() => undefined) // sem a verificação o formulário segue; a API marca o feriado ao salvar
    return () => {
      vivo = false
    }
  }, [r.dataColeta])

  // A resposta vale só para a data que está no campo: trocar a data some com o aviso da anterior.
  const diaAtual = dia?.data === r.dataColeta ? dia : null
  const erro = (...campos: string[]) => campos.map((c) => problema?.erros?.[c]).find(Boolean)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setProblema(null)
    setEnviando(true)
    try {
      await enviar(pedidoDe(r))
    } catch (falha) {
      setProblema(comoProblema(falha))
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
    <>
      <form ref={formulario} className="publicar__form" onSubmit={salvar} noValidate>
        <fieldset className="publicar__grupo cartao">
          <legend className="publicar__legenda">De onde para onde</legend>
          <div className="publicar__pontas">
            <CamposPonta id="coleta" titulo="Coleta" exemploCep="13069-380" exemploComplemento="Doca 3" ponta={r.coleta} mudar={muda('coleta')} erroCep={erro('coleta.cep', 'coleta')} />
            <CamposPonta id="entrega" titulo="Entrega" exemploCep="20931-000" exemploComplemento="Doca 3" ponta={r.entrega} mudar={muda('entrega')} erroCep={erro('entrega.cep', 'entrega')} />
          </div>
          <p className="campo__ajuda">A cidade e a distância saem do CEP. Motoristas perto da coleta recebem o aviso.</p>
        </fieldset>

        <fieldset className="publicar__grupo cartao">
          <legend className="publicar__legenda">Quando</legend>
          <Campo id="data-coleta" rotulo="Data da coleta" erro={erro('dataColeta')}>
            <input id="data-coleta" type="date" className="campo__entrada publicar__data" min={hoje()} value={r.dataColeta}
              onChange={(e) => muda('dataColeta')(e.target.value)} aria-invalid={erro('dataColeta') ? true : undefined}
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
            <input id="descricao" className="campo__entrada" maxLength={500} value={r.descricao} onChange={(e) => muda('descricao')(e.target.value)}
              placeholder="Pisos cerâmicos paletizados" aria-invalid={erro('descricaoCarga') ? true : undefined} aria-describedby={erro('descricaoCarga') ? 'descricao-erro' : undefined} />
          </Campo>
          <div className="publicar__linha">
            <Campo id="especie" rotulo="Como vai embalada" erro={erro('especieCarga')}>
              <input id="especie" className="campo__entrada" maxLength={100} value={r.especie} onChange={(e) => muda('especie')(e.target.value)}
                placeholder="Paletes" aria-invalid={erro('especieCarga') ? true : undefined} aria-describedby={erro('especieCarga') ? 'especie-erro' : undefined} />
            </Campo>
            <Campo id="peso" rotulo="Peso (kg)" erro={erro('pesoKg')}>
              <input id="peso" inputMode="decimal" className="campo__entrada campo__entrada--numero" value={r.peso} onChange={(e) => muda('peso')(e.target.value)}
                placeholder="27.000" aria-invalid={erro('pesoKg') ? true : undefined} aria-describedby={erro('pesoKg') ? 'peso-erro' : undefined} />
            </Campo>
          </div>
          <Campo id="tipo-carga" rotulo="Tipo de carga na tabela ANTT" erro={erro('tipoCargaAntt')} ajuda="Define o piso mínimo do frete.">
            <select id="tipo-carga" className="campo__entrada" value={r.tipoCarga} onChange={(e) => muda('tipoCarga')(e.target.value)}
              aria-invalid={erro('tipoCargaAntt') ? true : undefined} aria-describedby={erro('tipoCargaAntt') ? 'tipo-carga-erro' : 'tipo-carga-ajuda'}>
              {CARGAS_ANTT.map((c) => <option key={c.valor} value={c.valor}>{c.rotulo}</option>)}
            </select>
          </Campo>
        </fieldset>

        <fieldset className="publicar__grupo cartao">
          <legend className="publicar__legenda">Caminhão</legend>
          <Escolhas titulo="Tipos aceitos" ajuda="Nenhum marcado: qualquer caminhão." opcoes={TIPOS_CAMINHAO} marcados={r.veiculos}
            alternar={(v) => setR((x) => ({ ...x, veiculos: alternar(x.veiculos, v) }))} />
          <Escolhas titulo="Carrocerias aceitas" ajuda="Nenhuma marcada: qualquer carroceria." opcoes={CARROCERIAS} marcados={r.carrocerias}
            alternar={(v) => setR((x) => ({ ...x, carrocerias: alternar(x.carrocerias, v) }))} />
          <div className="publicar__opcoes">
            <label className="opcao">
              <input type="checkbox" checked={r.rastreador} onChange={(e) => muda('rastreador')(e.target.checked)} />
              <span>Exige rastreador</span>
            </label>
            <label className="opcao">
              <input type="checkbox" checked={r.complemento} onChange={(e) => muda('complemento')(e.target.checked)} />
              <span>A carga não enche o caminhão: o motorista pode completar com outra</span>
            </label>
          </div>
        </fieldset>

        <fieldset className="publicar__grupo cartao">
          <legend className="publicar__legenda">Valor</legend>
          <div className="escolhas" role="radiogroup" aria-label="Como fica o valor">
            <label className="escolha">
              <input type="radio" name="modo-valor" className="escolha__caixa" checked={!r.aCombinar} onChange={() => muda('aCombinar')(false)} />
              <span>Valor fechado</span>
            </label>
            <label className="escolha">
              <input type="radio" name="modo-valor" className="escolha__caixa" checked={r.aCombinar} onChange={() => muda('aCombinar')(true)} />
              <span>A combinar</span>
            </label>
          </div>
          {r.aCombinar ? (
            <p className="campo__ajuda">O frete aparece sem valor e só fecha por proposta. Você compara as propostas lado a lado.</p>
          ) : (
            <Campo id="valor" rotulo="Valor do frete (R$)" erro={erro('valor', 'valorCoerente')} ajuda="O motorista pode aceitar direto por esse valor ou mandar proposta.">
              <input id="valor" inputMode="decimal" className="campo__entrada campo__entrada--numero publicar__valor" value={r.valor}
                onChange={(e) => muda('valor')(e.target.value)} placeholder="4.850"
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
            <button type="submit" className="botao botao--primario" disabled={enviando}>{enviando ? rotuloEnviando : rotuloEnviar}</button>
            <Link to={cancelarPara} className="botao botao--fantasma">Cancelar</Link>
          </div>
        </div>
      </form>
      <SairSemSalvar alterado={alterado && !enviando} />
    </>
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
