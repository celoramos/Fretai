import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, comoProblema } from '../../api/cliente'
import type { CategoriaVeiculo, ConsultaCep, Frete, Problema, SolicitarFrete, TipoCarga, VerificacaoData } from '../../api/tipos'
import { CabecalhoPagina } from '../../components/CabecalhoPagina'
import { CamposPonta } from '../../components/CamposPonta'
import { SairSemSalvar } from '../../components/SairSemSalvar'
import { Aviso, Campo } from '../../components/ui'
import { CAPACIDADE_KG, CATEGORIAS, FAIXAS_PESO, ORDEM_CATEGORIAS, TIPOS_CARGA, dataCurta, diaDaSemana, hoje, lerReais, levaCategoria, reais, suportaPeso } from '../../formato'
import { useComputador } from '../../largura'
import { PONTA_VAZIA, enderecoDe, pontaDe, type Ponta } from '../../ponta'
import { useSessao } from '../../sessao'
import { useTitulo } from '../../useTitulo'

/** faixa: o kg de cima da faixa escolhida, ou "mais" (acima de 1,5 t), que pede o peso em kg. */
interface Rascunho {
  coleta: Ponta
  entrega: Ponta
  dataColeta: string
  tipo: TipoCarga | null
  descricao: string
  faixa: string
  pesoKg: string
  categoria: CategoriaVeiculo
  nomeDestinatario: string
  telefoneDestinatario: string
  valor: string
}

const VAZIO: Rascunho = {
  coleta: PONTA_VAZIA, entrega: PONTA_VAZIA, dataColeta: '', tipo: null, descricao: '', faixa: '', pesoKg: '',
  categoria: 'VAN', nomeDestinatario: '', telefoneDestinatario: '', valor: '',
}

const MAX_FOTOS = 5
const MAIS = 'mais'

/** Os campos do passo 1 no celular, com os nomes da validação da API (SolicitarFreteRequest). */
const DO_PASSO_1 = ['coleta', 'coleta.cep', 'entrega', 'entrega.cep', 'dataColeta', 'tipoCarga', 'descricaoCarga', 'pesoKg']
/** Campos que mostram o próprio erro; o resto sobe para o aviso do fim, para não sumir. */
const kg = (n: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(n)
const DESENHADOS = new Set([...DO_PASSO_1, 'categoriaVeiculo', 'nomeDestinatario', 'telefoneDestinatario', 'valor', 'fotos'])

const soDigitos = (s: string) => s.replace(/\D/g, '')
const pesoDe = (r: Rascunho) => (r.faixa === MAIS ? lerReais(r.pesoKg) : Number(r.faixa))

/** O que o passo 1 precisa antes do Continuar. A API confere tudo de novo ao pedir. */
function errosDoPasso1(r: Rascunho): Record<string, string> {
  const e: Record<string, string> = {}
  if (soDigitos(r.coleta.cep).length !== 8) e['coleta.cep'] = 'Digite os 8 números do CEP da coleta.'
  if (soDigitos(r.entrega.cep).length !== 8) e['entrega.cep'] = 'Digite os 8 números do CEP da entrega.'
  if (!r.dataColeta) e.dataColeta = 'Escolha o dia da coleta.'
  else if (r.dataColeta < hoje()) e.dataColeta = 'O dia da coleta não pode ter passado.'
  if (!r.tipo) e.tipoCarga = 'Diga o que vai levar.'
  if (!r.descricao.trim()) e.descricaoCarga = 'Conte o que vai no veículo.'
  if (!r.faixa) e.pesoKg = 'Escolha o peso aproximado.'
  else if (r.faixa === MAIS && !(pesoDe(r) > 0)) e.pesoKg = 'Digite o peso em kg.'
  return e
}

/** "Pituba, Salvador" depois que o CEP tem 8 números; null enquanto não tem ou se o CEP não existe. */
function useLugar(cep: string) {
  const digitos = soDigitos(cep)
  const [lugar, setLugar] = useState<{ cep: string; texto: string | null } | null>(null)
  useEffect(() => {
    if (digitos.length !== 8) return
    let vivo = true
    api<ConsultaCep>('GET', `/api/enderecos/cep/${digitos.slice(0, 5)}-${digitos.slice(5)}`)
      .then((c) => vivo && setLugar({ cep: digitos, texto: c.bairro ? `${c.bairro}, ${c.cidade}` : `${c.cidade}/${c.uf}` }))
      .catch(() => vivo && setLugar({ cep: digitos, texto: null }))
    return () => {
      vivo = false
    }
  }, [digitos])
  return lugar?.cep === digitos ? lugar : null
}

/*
 * Pedir frete, como no canvas: no celular em dois passos (o que e onde; veículo, quem recebe e valor), com o
 * passo na URL para o voltar do navegador voltar ao passo 1; no computador uma página, com o resumo ao lado.
 * O endereço é CEP, número e complemento, porque é do CEP que a API tira a cidade e a distância.
 */
export function PedirFrete() {
  useTitulo('Pedir frete')
  const { tokens } = useSessao()
  const navegar = useNavigate()
  const computador = useComputador()
  const [params, setParams] = useSearchParams()
  const passo = !computador && params.get('passo') === '2' ? 2 : 1
  const [r, setR] = useState<Rascunho>(() => {
    const tipo = params.get('tipo') as TipoCarga | null
    return tipo && tipo in TIPOS_CARGA ? { ...VAZIO, tipo } : VAZIO
  })
  const muda = <K extends keyof Rascunho>(campo: K) => (valor: Rascunho[K]) => setR((x) => ({ ...x, [campo]: valor }))
  const [fotos, setFotos] = useState<{ arquivo: File; url: string }[]>([])
  const [erroFotos, setErroFotos] = useState<string | null>(null)
  // Depois da primeira tentativa, os erros do passo 1 acompanham o que a pessoa corrige.
  const [tentou, setTentou] = useState(false)
  const locais = tentou ? errosDoPasso1(r) : {}
  const [problema, setProblema] = useState<Problema | null>(null)
  const [enviando, setEnviando] = useState(false)
  const pedindo = useRef(false)
  const formulario = useRef<HTMLFormElement>(null)
  const alterado = JSON.stringify(r) !== JSON.stringify(VAZIO) || fotos.length > 0

  // "Pedir de novo": a rota, o que vai, o tamanho e o peso do frete anterior. A data e o valor são novos.
  const de = params.get('de')
  useEffect(() => {
    if (!de) return
    let vivo = true
    api<Frete>('GET', `/api/fretes/${de}`).then((f) => {
      if (!vivo) return
      const faixa = f.pesoKg == null ? '' : FAIXAS_PESO.find((x) => x.kg != null && f.pesoKg! <= x.kg)?.kg?.toString() ?? MAIS
      setR((x) => ({
        ...x, coleta: pontaDe(f.coleta), entrega: pontaDe(f.entrega), descricao: f.descricaoCarga ?? '', tipo: f.tipoCarga ?? x.tipo,
        categoria: f.categoriaVeiculo ?? x.categoria, faixa, pesoKg: faixa === MAIS ? String(f.pesoKg) : '',
        nomeDestinatario: f.nomeDestinatario ?? '', telefoneDestinatario: f.telefoneDestinatario ?? '',
      }))
    }).catch(() => undefined) // sem o frete anterior a pessoa preenche do zero
    return () => {
      vivo = false
    }
  }, [de])

  // Feriado muda o preço (a API soma um adicional) e quem aceita: a pessoa fica sabendo enquanto escolhe a data.
  const [dia, setDia] = useState<VerificacaoData | null>(null)
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
  const diaAtual = dia?.data === r.dataColeta ? dia : null

  const lugarColeta = useLugar(r.coleta.cep)
  const lugarEntrega = useLugar(r.entrega.cep)

  // Abrir direto no passo 2 com o passo 1 vazio (recarregar a página) volta ao passo 1.
  useEffect(() => {
    if (passo === 2 && Object.keys(errosDoPasso1(r)).length > 0) irPara(1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo])

  // As miniaturas são URLs do navegador: liberadas quando a foto sai ou a página fecha.
  const urls = useRef(fotos)
  urls.current = fotos
  useEffect(() => () => urls.current.forEach((f) => URL.revokeObjectURL(f.url)), [])

  function irPara(n: 1 | 2, trocar = false) {
    const novos = new URLSearchParams(params)
    if (n === 2) novos.set('passo', '2')
    else novos.delete('passo')
    setParams(novos, { replace: trocar })
    window.scrollTo({ top: 0 })
  }

  function focarPrimeiroErro() {
    requestAnimationFrame(() => {
      const primeiro = formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ;(primeiro ?? document.getElementById('erro-pedir'))?.focus()
    })
  }

  function continuar() {
    const e = errosDoPasso1(r)
    setTentou(true)
    setProblema(null)
    if (Object.keys(e).length) return focarPrimeiroErro()
    irPara(2)
  }

  function escolherFotos(lista: FileList | null) {
    if (!lista) return
    const novas = [...lista].filter((f) => f.type === 'image/jpeg' || f.type === 'image/png')
    const cabem = MAX_FOTOS - fotos.length
    setErroFotos(novas.length > cabem ? `Escolha até ${MAX_FOTOS} fotos.` : novas.length < lista.length ? 'As fotos têm que ser JPEG ou PNG.' : null)
    setFotos((x) => [...x, ...novas.slice(0, Math.max(cabem, 0)).map((arquivo) => ({ arquivo, url: URL.createObjectURL(arquivo) }))])
  }
  function tirarFoto(i: number) {
    URL.revokeObjectURL(fotos[i].url)
    setFotos((x) => x.filter((_, j) => j !== i))
    setErroFotos(null)
  }

  async function pedir(e: FormEvent) {
    e.preventDefault()
    if (pedindo.current) return
    if (passo === 1 && !computador) return continuar()
    const doPasso1 = errosDoPasso1(r)
    setTentou(true)
    if (Object.keys(doPasso1).length) {
      if (!computador) irPara(1)
      return focarPrimeiroErro()
    }
    pedindo.current = true
    setEnviando(true)
    setProblema(null)
    const valor = lerReais(r.valor)
    const pedido: SolicitarFrete = {
      clienteId: tokens?.usuarioId ?? '',
      coleta: enderecoDe(r.coleta),
      entrega: enderecoDe(r.entrega),
      nomeDestinatario: r.nomeDestinatario.trim(),
      telefoneDestinatario: r.telefoneDestinatario.trim(),
      descricaoCarga: r.descricao.trim(),
      pesoKg: pesoDe(r),
      valor: Number.isFinite(valor) ? valor : 0,
      dataColeta: r.dataColeta,
      categoriaVeiculo: r.categoria,
      tipoCarga: r.tipo ?? 'OUTRO',
    }
    let novo: Frete
    try {
      novo = await api<Frete>('POST', '/api/fretes', pedido)
    } catch (falha) {
      const p = comoProblema(falha)
      setProblema(p)
      setEnviando(false)
      pedindo.current = false
      // No celular, erro de um campo do passo 1 leva de volta a ele.
      if (!computador && passo === 2 && Object.keys(p.erros ?? {}).some((c) => DO_PASSO_1.includes(c))) irPara(1)
      return focarPrimeiroErro()
    }
    // As fotos vão uma por uma depois que o frete existe. A que falhar não perde o pedido: o frete avisa e pede de novo.
    let falharam = 0
    for (const { arquivo } of fotos) {
      const dados = new FormData()
      dados.append('foto', arquivo)
      try {
        await api('POST', `/api/fretes/${novo.id}/fotos`, dados)
      } catch {
        falharam++
      }
    }
    navegar(`/cliente/fretes/${novo.id}`, { state: { publicado: true, fotosQueFalharam: falharam || undefined } })
  }

  const erro = (...campos: string[]) => campos.map((c) => locais[c] ?? problema?.erros?.[c]).find(Boolean)
  const invalido = (c: string) => (erro(c) ? true : undefined)
  const descrito = (c: string, ajuda?: string) => (erro(c) ? `${c.replace('.', '-')}-erro` : ajuda)
  const soltos = Object.entries(problema?.erros ?? {}).filter(([c]) => !DESENHADOS.has(c)).map(([, m]) => m)
  const valor = lerReais(r.valor)
  const rotuloPedir = enviando ? 'Pedindo…' : Number.isFinite(valor) && valor > 0 ? `Pedir frete por R$ ${reais(valor)}` : 'Pedir frete'
  const mostra1 = computador || passo === 1
  const mostra2 = computador || passo === 2
  // O tamanho escolhido não leva o peso: aponta o menor que leva (CategoriaVeiculo.suporta da API).
  const peso = pesoDe(r)
  const pequeno = Number.isFinite(peso) && peso > 0 && !suportaPeso(r.categoria, peso)
  const maiorQueLeva = ORDEM_CATEGORIAS.find((c) => levaCategoria(c, r.categoria) && suportaPeso(c, peso))
  const lugar = (l: ReturnType<typeof useLugar>) => (l ? l.texto ?? 'CEP não encontrado' : null)
  const rota = lugarColeta?.texto && lugarEntrega?.texto ? `${lugarColeta.texto.split(',')[0]} → ${lugarEntrega.texto.split(',')[0]}` : null

  const resumo = (
    <dl className="pedido__resumo">
      <div><dt>O quê</dt><dd>{r.tipo ? TIPOS_CARGA[r.tipo] : 'Falta escolher'}</dd></div>
      <div><dt>Quando</dt><dd>{r.dataColeta ? diaDaSemana(r.dataColeta) : 'Falta escolher'}</dd></div>
      <div><dt>Rota</dt><dd>{rota ?? 'Falta o CEP'}</dd></div>
      <div><dt>Veículo</dt><dd>{CATEGORIAS[r.categoria].nome}</dd></div>
    </dl>
  )

  const campoValor = (
    <div className="campo">
      <label htmlFor="valor" className="campo__rotulo">{computador ? 'Quanto você oferece' : 'Valor oferecido em reais'}</label>
      <div className="pedido__reais">
        <span aria-hidden="true">R$</span>
        <input id="valor" inputMode="decimal" className="campo__entrada campo__entrada--numero" value={r.valor} placeholder="380"
          onChange={(e) => muda('valor')(e.target.value)} aria-invalid={invalido('valor')} aria-describedby={descrito('valor', 'valor-ajuda')} />
      </div>
      {erro('valor') ? <p id="valor-erro" className="campo__erro">{erro('valor')}</p>
        : <p id="valor-ajuda" className="campo__ajuda">O motorista pode aceitar esse valor ou mandar outro. Você só paga quando fechar com um deles, por Pix, e o dinheiro fica guardado até a entrega.</p>}
    </div>
  )

  const avisoGeral = (
    <div id="erro-pedir" tabIndex={-1} aria-live="polite">
      {problema && (!problema.erros || soltos.length > 0) && <Aviso tom="perigo" titulo={problema.title}>{soltos.join(' ') || problema.detail}</Aviso>}
    </div>
  )

  return (
    <div className="pedido">
      {computador ? (
        <div className="pedido__topo">
          <Link to="/cliente" className="voltar">Meus fretes</Link>
          <h1 className="titulo-pagina">Pedir frete</h1>
        </div>
      ) : (
        <>
          <CabecalhoPagina titulo="Pedir frete" voltar={passo === 2 ? `?${new URLSearchParams([...params].filter(([k]) => k !== 'passo'))}` : '/cliente'}>
            <span className="pedido__passo">{passo} de 2</span>
          </CabecalhoPagina>
          <div className="pedido__progresso" aria-hidden="true"><span className="pedido__barra pedido__barra--feita" /><span className={passo === 2 ? 'pedido__barra pedido__barra--feita' : 'pedido__barra'} /></div>
        </>
      )}

      <form ref={formulario} id="pedido-form" className="pedido__corpo" onSubmit={pedir} noValidate>
        <div className="pedido__campos">
          {mostra1 && (
            <>
              <Secao titulo="De onde e para onde" id="t-rota">
                <div className="pedido__pontas">
                  <div className="pedido__ponta">
                    <CamposPonta id="coleta" titulo="Coleta" exemploCep="41810-000" exemploComplemento="Apto 302" ponta={r.coleta}
                      mudar={muda('coleta')} erroCep={erro('coleta.cep', 'coleta')} />
                    {lugar(lugarColeta) && <p className="pedido__lugar">{lugar(lugarColeta)}</p>}
                  </div>
                  <div className="pedido__ponta">
                    <CamposPonta id="entrega" titulo="Entrega" exemploCep="42700-000" exemploComplemento="Casa 2" ponta={r.entrega}
                      mudar={muda('entrega')} erroCep={erro('entrega.cep', 'entrega')} />
                    {lugar(lugarEntrega) && <p className="pedido__lugar">{lugar(lugarEntrega)}</p>}
                  </div>
                </div>
                <Campo id="dataColeta" rotulo="Dia da coleta" erro={erro('dataColeta')}>
                  <input id="dataColeta" type="date" className="campo__entrada pedido__data" min={hoje()} value={r.dataColeta}
                    onChange={(e) => muda('dataColeta')(e.target.value)} aria-invalid={invalido('dataColeta')}
                    aria-describedby={descrito('dataColeta', 'data-coleta-dia')} />
                </Campo>
                <p id="data-coleta-dia" className="campo__ajuda" aria-live="polite">
                  {diaAtual?.feriado && `${dataCurta(diaAtual.data)} é feriado${diaAtual.nomeFeriado ? ` (${diaAtual.nomeFeriado})` : ''}. Frete em feriado tem um adicional sobre o valor, e nem todo motorista pega.`}
                  {diaAtual && !diaAtual.feriado && diaAtual.domingo && `${dataCurta(diaAtual.data)} é domingo.`}
                </p>
              </Secao>

              <Secao titulo="O que vai levar" id="t-carga">
                <fieldset className="pedido__tipos" aria-describedby={erro('tipoCarga') ? 'tipoCarga-erro' : undefined}>
                  <legend className="visualmente-oculto">Tipo de frete</legend>
                  <div className="escolhas">
                    {(Object.keys(TIPOS_CARGA) as TipoCarga[]).map((t) => (
                      <label key={t} className="escolha">
                        <input type="radio" name="tipo" className="escolha__caixa" checked={r.tipo === t} onChange={() => muda('tipo')(t)}
                          aria-invalid={invalido('tipoCarga')} />
                        {TIPOS_CARGA[t]}
                      </label>
                    ))}
                  </div>
                  {erro('tipoCarga') && <p id="tipoCarga-erro" className="campo__erro">{erro('tipoCarga')}</p>}
                </fieldset>
                <Campo id="descricaoCarga" rotulo="Conte o que vai no veículo" erro={erro('descricaoCarga')}>
                  <textarea id="descricaoCarga" className="campo__entrada pedido__descricao" maxLength={500} value={r.descricao}
                    placeholder="Geladeira, fogão, cama de casal e umas 15 caixas." onChange={(e) => muda('descricao')(e.target.value)}
                    aria-invalid={invalido('descricaoCarga')} aria-describedby={descrito('descricaoCarga')} />
                </Campo>
                <div className="pedido__par">
                  <div className="pedido__peso">
                    <Campo id="pesoKg" rotulo="Peso aproximado" erro={r.faixa === MAIS ? undefined : erro('pesoKg')}>
                      <select id="pesoKg" className="campo__entrada" value={r.faixa} onChange={(e) => muda('faixa')(e.target.value)}
                        aria-invalid={r.faixa === MAIS ? undefined : invalido('pesoKg')} aria-describedby={r.faixa === MAIS ? undefined : descrito('pesoKg')}>
                        <option value="" disabled>Escolha</option>
                        {FAIXAS_PESO.map((f) => <option key={f.rotulo} value={f.kg ?? MAIS}>{f.rotulo}</option>)}
                      </select>
                    </Campo>
                    {r.faixa === MAIS && (
                      <Campo id="pesoKgNumero" rotulo="Peso em kg" erro={erro('pesoKg')}>
                        <input id="pesoKgNumero" inputMode="decimal" className="campo__entrada campo__entrada--numero" value={r.pesoKg} placeholder="2500"
                          onChange={(e) => muda('pesoKg')(e.target.value)} aria-invalid={invalido('pesoKg')}
                          aria-describedby={erro('pesoKg') ? 'pesoKgNumero-erro' : undefined} />
                      </Campo>
                    )}
                  </div>
                  <Fotos fotos={fotos} erro={erroFotos} escolher={escolherFotos} tirar={tirarFoto} />
                </div>
              </Secao>
            </>
          )}

          {mostra2 && (
            <>
              <fieldset className="pedido__secao pedido__veiculos">
                <legend>Qual veículo?</legend>
                <div className="opcoes">
                  {ORDEM_CATEGORIAS.map((c) => (
                    <label key={c} className="opcao">
                      <input type="radio" name="categoria" checked={r.categoria === c} onChange={() => muda('categoria')(c)} />
                      <span className="opcao__texto"><strong>{CATEGORIAS[c].nome}</strong><span>{CATEGORIAS[c].cabe}</span><span>{CATEGORIAS[c].exemplo}</span></span>
                    </label>
                  ))}
                </div>
                {erro('categoriaVeiculo') && <p className="campo__erro">{erro('categoriaVeiculo')}</p>}
                <div aria-live="polite">
                  {pequeno && maiorQueLeva && (
                    <Aviso tom="alerta" titulo={`${CATEGORIAS[r.categoria].nome} leva até ${kg(CAPACIDADE_KG[r.categoria]!)} kg.`}
                      acao={<button type="button" className="botao botao--secundario" onClick={() => muda('categoria')(maiorQueLeva)}>
                        Pedir {CATEGORIAS[maiorQueLeva].nome.toLowerCase()}
                      </button>}>
                      Sua carga {r.faixa === MAIS ? 'tem' : 'pode chegar a'} {kg(peso)} kg. Assim, só {maiorQueLeva === 'CAMINHAO' ? 'caminhão' : 'van ou caminhão'} vai poder aceitar o frete.
                    </Aviso>
                  )}
                </div>
                <p className="campo__ajuda">Carro de passeio e moto não fazem frete no Fretaí.</p>
              </fieldset>

              <Secao titulo="Quem recebe" id="t-recebe">
                <div className="pedido__par">
                  <Campo id="nomeDestinatario" rotulo="Nome" erro={erro('nomeDestinatario')}>
                    <input id="nomeDestinatario" className="campo__entrada" maxLength={100} autoComplete="off" value={r.nomeDestinatario}
                      onChange={(e) => muda('nomeDestinatario')(e.target.value)} aria-invalid={invalido('nomeDestinatario')} aria-describedby={descrito('nomeDestinatario')} />
                  </Campo>
                  <Campo id="telefoneDestinatario" rotulo="Celular" erro={erro('telefoneDestinatario')}>
                    <input id="telefoneDestinatario" type="tel" inputMode="tel" className="campo__entrada" maxLength={20} autoComplete="off" placeholder="(71) 98877-1234"
                      value={r.telefoneDestinatario} onChange={(e) => muda('telefoneDestinatario')(e.target.value)}
                      aria-invalid={invalido('telefoneDestinatario')} aria-describedby={descrito('telefoneDestinatario', 'quem-recebe-ajuda')} />
                  </Campo>
                </div>
                <p id="quem-recebe-ajuda" className="campo__ajuda">É quem assina na entrega. Essa pessoa recebe um código para avisar se algo chegar errado.</p>
              </Secao>

              {!computador && (
                <>
                  <Secao titulo="Quanto você oferece" id="t-valor">{campoValor}</Secao>
                  <Secao titulo="Resumo" id="t-resumo">{resumo}</Secao>
                  {avisoGeral}
                </>
              )}
            </>
          )}
          {!computador && passo === 1 && avisoGeral}
        </div>

        {computador && (
          <aside className="pedido__lado" aria-labelledby="t-seu-pedido">
            <h2 id="t-seu-pedido">Seu pedido</h2>
            {resumo}
            {campoValor}
            {avisoGeral}
            <button type="submit" className="botao botao--primario botao--largo" disabled={enviando}>{rotuloPedir}</button>
          </aside>
        )}
      </form>

      {/* No celular o botão fica preso embaixo, como no canvas. */}
      {!computador && (
        <div className="pedido__rodape">
          {passo === 1
            ? <button type="button" className="botao botao--primario botao--largo" onClick={continuar}>Continuar</button>
            : <button type="submit" form="pedido-form" className="botao botao--primario botao--largo" disabled={enviando}>{rotuloPedir}</button>}
        </div>
      )}
      <SairSemSalvar alterado={alterado && !enviando} />
    </div>
  )
}

function Secao({ titulo, id, children }: { titulo: string; id: string; children: ReactNode }) {
  return (
    <section className="pedido__secao" aria-labelledby={id}>
      <h2 id={id}>{titulo}</h2>
      {children}
    </section>
  )
}

/** Até cinco fotos da carga, com miniatura e remover. Ajudam o motorista a decidir. */
function Fotos({ fotos, erro, escolher, tirar }: { fotos: { arquivo: File; url: string }[]; erro: string | null; escolher: (l: FileList | null) => void; tirar: (i: number) => void }) {
  return (
    <div className="campo">
      <span className="campo__rotulo" id="fotos-rotulo">Fotos <span className="pedido__opcional">(opcional, ajudam o motorista a decidir)</span></span>
      {fotos.length > 0 && (
        <ul className="pedido__fotos" aria-labelledby="fotos-rotulo">
          {fotos.map((f, i) => (
            <li key={f.url} className="pedido__foto">
              <img src={f.url} alt={`Foto ${i + 1} da carga`} />
              <button type="button" className="pedido__tirar" onClick={() => tirar(i)} aria-label={`Tirar a foto ${i + 1}`}>
                <svg className="icone-traco" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </li>
          ))}
        </ul>
      )}
      {fotos.length < MAX_FOTOS && (
        <label className="pedido__enviar">
          <svg className="icone-traco" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
          <span>{fotos.length ? `${fotos.length} de ${MAX_FOTOS}. Adicionar mais` : 'Adicionar fotos'}</span>
          <input type="file" accept="image/jpeg,image/png" multiple className="visualmente-oculto" aria-describedby={erro ? 'fotos-erro' : undefined}
            onChange={(e) => { escolher(e.target.files); e.target.value = '' }} />
        </label>
      )}
      {erro && <p id="fotos-erro" className="campo__erro" role="alert">{erro}</p>}
    </div>
  )
}
