import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, comoProblema } from '../../api/cliente'
import type { CategoriaVeiculo, Motorista, NovoVeiculo, PerfilMotorista, Veiculo } from '../../api/tipos'
import { useRecurso } from '../../api/useRecurso'
import { Avatar } from '../../components/Avatar'
import { CabecalhoPagina } from '../../components/CabecalhoPagina'
import { BotaoTema } from '../../components/Layouts'
import { Aviso, ErroCarga, Esqueleto } from '../../components/ui'
import { CARROCERIAS, CATEGORIAS, ORDEM_CATEGORIAS, TIPOS_CAMINHAO, telefone as comMascara } from '../../formato'
import { useComputador } from '../../largura'
import { useSessao } from '../../sessao'
import { useTitulo } from '../../useTitulo'

const RAIOS = [10, 25, 50] as const
const PLACA = /^[A-Z]{3}\d[A-Z0-9]\d{2}$/
const PLACA_INVALIDA = 'Placa inválida. Use o formato ABC1234 ou ABC1D23.'

/** O tipo de chave Pix só ajuda a pessoa a digitar e a conferir o formato; a API recebe a chave. */
const TIPOS_PIX = {
  CELULAR: { rotulo: 'Celular', exemplo: '(71) 98877-1234', modo: 'tel', valida: (s: string) => /^\d{10,11}$/.test(s.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')) },
  CPF: { rotulo: 'CPF', exemplo: '000.000.000-00', modo: 'numeric', valida: (s: string) => s.replace(/\D/g, '').length === 11 },
  EMAIL: { rotulo: 'E-mail', exemplo: 'voce@email.com', modo: 'email', valida: (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim()) },
  ALEATORIA: { rotulo: 'Chave aleatória', exemplo: '123e4567-e89b-12d3-a456-426614174000', modo: 'text', valida: (s: string) => /^[0-9a-f-]{32,36}$/i.test(s.trim()) },
} as const
type TipoPix = keyof typeof TIPOS_PIX

function Bloco({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section className="perfil-m__bloco" aria-labelledby={id}>
      <h2 id={id}>{titulo}</h2>
      {children}
    </section>
  )
}

/*
 * O perfil do motorista, como no canvas: quem ele é (nota, fretes e documentos), contato, a chave Pix
 * onde o dinheiro cai, os veículos com que roda, os avisos de frete novo e os documentos. No celular,
 * o tema e o Sair ficam aqui, porque o motorista não tem barra de cima.
 */
export function Perfil() {
  useTitulo('Perfil')
  const computador = useComputador()
  const { tokens, sair } = useSessao()
  const navegar = useNavigate()
  const id = tokens?.usuarioId ?? ''
  const [estado, recarregar] = useRecurso(async () => {
    const [motorista, reputacao, veiculos] = await Promise.all([
      api<Motorista>('GET', `/api/motoristas/${id}`),
      api<PerfilMotorista>('GET', `/api/motoristas/${id}/perfil`).catch(() => null),
      api<Veiculo[]>('GET', `/api/motoristas/${id}/veiculos`),
    ])
    return { motorista, reputacao, veiculos }
  }, [id])

  if (estado.fase === 'carregando') return <div className="perfil-m">{estado.mostrarEsqueleto && <><Esqueleto linhas={2} /><Esqueleto linhas={3} /><Esqueleto linhas={4} /></>}</div>
  if (estado.fase === 'erro') return <div className="perfil-m"><ErroCarga problema={estado.problema} tentarDeNovo={recarregar} /></div>

  const { motorista, reputacao, veiculos } = estado.dados
  const docs = reputacao?.documentosVerificados ?? []
  return (
    <div className="perfil-m">
      {computador ? <h1 className="titulo-pagina meus-m__titulo">Perfil</h1> : <CabecalhoPagina titulo="Perfil"><BotaoTema /></CabecalhoPagina>}

      <section className="perfil-m__voce" aria-label="Você">
        <Avatar nome={motorista.nome} grande />
        <span className="quem__texto">
          <strong>{motorista.nome}</strong>
          {reputacao && <span>{reputacao.mediaNotas != null ? `Nota ${reputacao.mediaNotas.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}` : 'Sem nota ainda'} · {reputacao.fretesConcluidos} {reputacao.fretesConcluidos === 1 ? 'frete' : 'fretes'}</span>}
          <span className={docs.length >= 2 ? 'perfil-m__docs perfil-m__docs--ok' : 'perfil-m__docs'}>
            {docs.length >= 2 ? 'CNH e CRLV conferidos' : docs.length === 1 ? `${docs[0]} conferida; falta ${docs[0] === 'CNH' ? 'o CRLV' : 'a CNH'}` : 'Documentos ainda não conferidos'}
          </span>
        </span>
      </section>

      <div className="perfil-m__grade">
        <Contato motorista={motorista} />
        <ChavePix motorista={motorista} />
        <Veiculos motoristaId={motorista.id} veiculos={veiculos} aoMudar={recarregar} />
        <Avisos motorista={motorista} />
        <Bloco id="t-docs" titulo="Documentos">
          <ul className="perfil-m__lista">
            {['CNH', 'CRLV'].map((d) => (
              <li key={d} className="perfil-m__linha"><span>{d}</span><span className={docs.includes(d) ? 'perfil-m__ok' : 'perfil-m__pendente'}>{docs.includes(d) ? 'Conferido' : 'Pendente'}</span></li>
            ))}
          </ul>
          <p className="frete-c__texto--menor">A CNH e o CRLV vão em cada frete fechado, pela tela do frete. Um administrador confere antes do primeiro frete.</p>
          <Link to="/motorista/meus-fretes" className="botao botao--secundario">Enviar pelos meus fretes</Link>
        </Bloco>
      </div>

      <button type="button" className="botao botao--secundario botao--largo perfil-m__sair" onClick={async () => { await sair(); navegar('/entrar') }}>Sair</button>
    </div>
  )
}

function Contato({ motorista }: { motorista: Motorista }) {
  // A API guarda o telefone só com dígitos: o campo abre com o DDD entre parênteses, como a pessoa digita.
  const [telefone, setTelefone] = useState(() => comMascara(motorista.telefone))
  const [enviando, setEnviando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setSalvo(false)
    setEnviando(true)
    try {
      await api('PUT', `/api/motoristas/${motorista.id}`, { nome: motorista.nome, telefone: telefone.trim() })
      setSalvo(true)
    } catch (falha) {
      const p = comoProblema(falha)
      setErro(p.erros?.telefone ?? p.detail)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Bloco id="t-contato" titulo="Contato">
      <form className="perfil-m__form" onSubmit={salvar} noValidate>
        <div className="campo">
          <label htmlFor="celular" className="campo__rotulo">Celular com WhatsApp</label>
          <input id="celular" type="tel" className="campo__entrada" autoComplete="tel" value={telefone} onChange={(e) => { setTelefone(e.target.value); setSalvo(false) }}
            aria-invalid={erro ? true : undefined} aria-describedby={erro ? 'celular-erro' : undefined} />
          {erro && <p id="celular-erro" className="campo__erro">{erro}</p>}
        </div>
        <div className="campo">
          <label htmlFor="email" className="campo__rotulo">E-mail</label>
          <input id="email" type="email" className="campo__entrada" value={motorista.email} readOnly aria-describedby="email-ajuda" />
          <p id="email-ajuda" className="campo__ajuda">O e-mail é a sua entrada no Fretaí e não muda por aqui.</p>
        </div>
        <button type="submit" className="botao botao--secundario" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar contato'}</button>
        {salvo && <p role="status" className="perfil-m__ok">Contato salvo.</p>}
      </form>
    </Bloco>
  )
}

function ChavePix({ motorista }: { motorista: Motorista }) {
  const [tipo, setTipo] = useState<TipoPix>('CELULAR')
  const [chave, setChave] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [salva, setSalva] = useState(motorista.temChavePix)
  const [acabouDeSalvar, setAcabouDeSalvar] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const t = TIPOS_PIX[tipo]

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setAcabouDeSalvar(false)
    if (!t.valida(chave)) return setErro(`Confira a chave: não parece ${tipo === 'EMAIL' ? 'um e-mail' : tipo === 'ALEATORIA' ? 'uma chave aleatória' : `um ${t.rotulo.toLowerCase()}`}.`)
    setEnviando(true)
    try {
      await api('PUT', `/api/motoristas/${motorista.id}/chave-pix`, { chavePix: chave.trim() })
      setSalva(true)
      setAcabouDeSalvar(true)
      setChave('')
    } catch (falha) {
      const p = comoProblema(falha)
      setErro(p.erros?.chavePix ?? p.detail)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Bloco id="t-pix" titulo="Chave Pix para receber">
      {!salva && <Aviso tom="alerta" titulo="Falta a chave Pix.">Sem ela, o dinheiro dos fretes não tem para onde ir.</Aviso>}
      {salva && !acabouDeSalvar && <p className="frete-c__texto--menor">Você já tem uma chave cadastrada. Por segurança ela não volta para a tela; salve outra para trocar.</p>}
      <form className="perfil-m__form" onSubmit={salvar} noValidate>
        <div className="perfil-m__par">
          <div className="campo">
            <label htmlFor="tipoPix" className="campo__rotulo">Tipo de chave</label>
            <select id="tipoPix" className="campo__entrada" value={tipo} onChange={(e) => { setTipo(e.target.value as TipoPix); setErro(null) }}>
              {(Object.keys(TIPOS_PIX) as TipoPix[]).map((k) => <option key={k} value={k}>{TIPOS_PIX[k].rotulo}</option>)}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="chavePix" className="campo__rotulo">Chave</label>
            <input id="chavePix" className="campo__entrada" inputMode={t.modo} autoComplete="off" spellCheck={false} maxLength={77} placeholder={t.exemplo}
              value={chave} onChange={(e) => setChave(e.target.value)} aria-invalid={erro ? true : undefined} aria-describedby={erro ? 'chavePix-erro' : undefined} />
            {erro && <p id="chavePix-erro" className="campo__erro">{erro}</p>}
          </div>
        </div>
        <button type="submit" className="botao botao--secundario" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar chave Pix'}</button>
        {acabouDeSalvar && <p role="status" className="perfil-m__ok">Chave salva. O dinheiro dos fretes vai para ela.</p>}
      </form>
    </Bloco>
  )
}

function Veiculos({ motoristaId, veiculos, aoMudar }: { motoristaId: string; veiculos: Veiculo[]; aoMudar: () => void }) {
  const [novo, setNovo] = useState(false)
  return (
    <Bloco id="t-veic" titulo="Veículos">
      {veiculos.length === 0 && <p className="frete-c__texto">Cadastre um veículo para poder aceitar fretes.</p>}
      {veiculos.length > 0 && <ul className="perfil-m__lista">{veiculos.map((v) => <LinhaVeiculo key={v.id} motoristaId={motoristaId} veiculo={v} aoMudar={aoMudar} />)}</ul>}
      {novo
        ? <NovoVeiculoForm motoristaId={motoristaId} aoSalvar={() => { setNovo(false); aoMudar() }} aoCancelar={() => setNovo(false)} />
        : <button type="button" className="botao botao--secundario" onClick={() => setNovo(true)}>Adicionar veículo</button>}
    </Bloco>
  )
}

function LinhaVeiculo({ motoristaId, veiculo: v, aoMudar }: { motoristaId: string; veiculo: Veiculo; aoMudar: () => void }) {
  const [fase, setFase] = useState<'parado' | 'confirmar' | 'enviando' | 'completar'>('parado')
  const [erro, setErro] = useState<string | null>(null)
  const incompleto = v.categoria === 'CAMINHAO' && (!v.tipo || !v.carroceria || !v.numeroEixos)

  async function remover() {
    setFase('enviando')
    setErro(null)
    try {
      await api('DELETE', `/api/motoristas/${motoristaId}/veiculos/${v.id}`)
      aoMudar()
    } catch (falha) {
      setErro(comoProblema(falha).detail)
      setFase('parado')
    }
  }

  return (
    <li className="perfil-m__veiculo">
      <div className="perfil-m__linha">
        <span className="quem__texto"><strong>{v.modelo ?? CATEGORIAS[v.categoria].nome}</strong><span>{CATEGORIAS[v.categoria].nome} <span className="placa-mono">{v.placa}</span></span></span>
        {fase === 'confirmar' ? (
          <span className="perfil-m__acoes">
            <button type="button" className="botao botao--perigo" onClick={remover}>Remover {v.placa}</button>
            <button type="button" className="botao botao--fantasma" onClick={() => setFase('parado')}>Manter</button>
          </span>
        ) : (
          <button type="button" className="botao botao--fantasma" disabled={fase === 'enviando'} onClick={() => setFase('confirmar')} aria-label={`Remover o veículo ${v.placa}`}>
            {fase === 'enviando' ? 'Removendo…' : 'Remover'}
          </button>
        )}
      </div>
      {erro && <p className="campo__erro" role="alert">{erro}</p>}
      {incompleto && fase !== 'completar' && (
        <button type="button" className="botao botao--fantasma perfil-m__completar" onClick={() => setFase('completar')}>Completar dados do caminhão</button>
      )}
      {fase === 'completar' && <DadosCaminhao motoristaId={motoristaId} veiculo={v} aoSalvar={aoMudar} aoCancelar={() => setFase('parado')} />}
    </li>
  )
}

function NovoVeiculoForm({ motoristaId, aoSalvar, aoCancelar }: { motoristaId: string; aoSalvar: () => void; aoCancelar: () => void }) {
  const [categoria, setCategoria] = useState<CategoriaVeiculo>('VAN')
  const [modelo, setModelo] = useState('')
  const [placa, setPlaca] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    const p = placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!PLACA.test(p)) return setErro(PLACA_INVALIDA)
    setEnviando(true)
    const pedido: NovoVeiculo = { placa: p, categoria, modelo: modelo.trim() || null, rastreador: false }
    try {
      await api('POST', `/api/motoristas/${motoristaId}/veiculos`, pedido)
      aoSalvar()
    } catch (falha) {
      const pr = comoProblema(falha)
      setErro(pr.erros?.placa ?? pr.detail)
      setEnviando(false)
    }
  }

  return (
    <form className="perfil-m__form perfil-m__novo" onSubmit={salvar} noValidate aria-label="Novo veículo">
      <div className="campo">
        <label htmlFor="novoCategoria" className="campo__rotulo">Tipo</label>
        <select id="novoCategoria" className="campo__entrada" value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaVeiculo)}>
          {ORDEM_CATEGORIAS.map((c) => <option key={c} value={c}>{CATEGORIAS[c].nome}</option>)}
        </select>
      </div>
      <div className="perfil-m__par">
        <div className="campo">
          <label htmlFor="novoModelo" className="campo__rotulo">Modelo</label>
          <input id="novoModelo" className="campo__entrada" maxLength={60} placeholder="Ex.: Fiat Fiorino" value={modelo} onChange={(e) => setModelo(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="novaPlaca" className="campo__rotulo">Placa</label>
          <input id="novaPlaca" className="campo__entrada campo__entrada--placa" maxLength={8} autoComplete="off" spellCheck={false} placeholder="ABC1D23"
            value={placa} onChange={(e) => setPlaca(e.target.value)} aria-invalid={erro ? true : undefined} aria-describedby={erro ? 'novaPlaca-erro' : undefined} />
          {erro && <p id="novaPlaca-erro" className="campo__erro" role="alert">{erro}</p>}
        </div>
      </div>
      <p className="frete-c__texto--menor">Carro de passeio e moto não fazem frete no Fretaí.</p>
      <div className="perfil-m__acoes">
        <button type="submit" className="botao botao--primario" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar veículo'}</button>
        <button type="button" className="botao botao--fantasma" onClick={aoCancelar}>Cancelar</button>
      </div>
    </form>
  )
}

/** Os dados que o frete de empresa exige do caminhão: RNTRC, tipo, carroceria, eixos e rastreador. */
function DadosCaminhao({ motoristaId, veiculo: v, aoSalvar, aoCancelar }: { motoristaId: string; veiculo: Veiculo; aoSalvar: () => void; aoCancelar: () => void }) {
  const [rntrc, setRntrc] = useState('')
  const [tipo, setTipo] = useState(v.tipo ?? 'TRES_QUARTOS')
  const [carroceria, setCarroceria] = useState(v.carroceria ?? 'BAU')
  const [eixos, setEixos] = useState(v.numeroEixos ?? TIPOS_CAMINHAO.find((t) => t.valor === tipo)?.eixos ?? 2)
  const [rastreador, setRastreador] = useState(v.rastreador)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    const pedido: NovoVeiculo = { placa: v.placa, categoria: 'CAMINHAO', modelo: v.modelo, rntrc: rntrc.trim() || null, tipo, carroceria, numeroEixos: eixos, rastreador }
    try {
      await api('PUT', `/api/motoristas/${motoristaId}/veiculos/${v.id}`, pedido)
      aoSalvar()
    } catch (falha) {
      setErro(comoProblema(falha).detail)
      setEnviando(false)
    }
  }

  return (
    <form className="perfil-m__form perfil-m__novo" onSubmit={salvar} noValidate aria-label={`Dados do caminhão ${v.placa}`}>
      <div className="perfil-m__par">
        <div className="campo">
          <label htmlFor={`rntrc-${v.id}`} className="campo__rotulo">RNTRC</label>
          <input id={`rntrc-${v.id}`} className="campo__entrada" inputMode="numeric" maxLength={9} value={rntrc} onChange={(e) => setRntrc(e.target.value.replace(/\D/g, ''))} placeholder="045821937" />
        </div>
        <div className="campo">
          <label htmlFor={`tipo-${v.id}`} className="campo__rotulo">Tipo</label>
          <select id={`tipo-${v.id}`} className="campo__entrada" value={tipo}
            onChange={(e) => { setTipo(e.target.value); setEixos(TIPOS_CAMINHAO.find((t) => t.valor === e.target.value)?.eixos ?? eixos) }}>
            {TIPOS_CAMINHAO.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor={`carroceria-${v.id}`} className="campo__rotulo">Carroceria</label>
          <select id={`carroceria-${v.id}`} className="campo__entrada" value={carroceria} onChange={(e) => setCarroceria(e.target.value)}>
            {CARROCERIAS.map((c) => <option key={c.valor} value={c.valor}>{c.rotulo}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor={`eixos-${v.id}`} className="campo__rotulo">Eixos</label>
          <select id={`eixos-${v.id}`} className="campo__entrada" value={eixos} onChange={(e) => setEixos(Number(e.target.value))}>
            {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>
      <label className="opcao"><input type="checkbox" checked={rastreador} onChange={(e) => setRastreador(e.target.checked)} /><span>Tem rastreador</span></label>
      {erro && <p className="campo__erro" role="alert">{erro}</p>}
      <div className="perfil-m__acoes">
        <button type="submit" className="botao botao--primario" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar dados do caminhão'}</button>
        <button type="button" className="botao botao--fantasma" onClick={aoCancelar}>Cancelar</button>
      </div>
    </form>
  )
}

function Avisos({ motorista }: { motorista: Motorista }) {
  const [cep, setCep] = useState('')
  const [raio, setRaio] = useState<number>(25)
  const [feriado, setFeriado] = useState(motorista.aceitaFeriado)
  const [estado, setEstado] = useState<{ fase: 'parado' | 'salvando' } | { fase: 'salvo'; texto: string } | { fase: 'erro'; texto: string }>({ fase: 'parado' })

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const d = cep.replace(/\D/g, '')
    if (d && d.length !== 8) return setEstado({ fase: 'erro', texto: 'Digite os 8 números do CEP.' })
    setEstado({ fase: 'salvando' })
    try {
      if (d) await api('PUT', `/api/motoristas/${motorista.id}/base`, { cep: `${d.slice(0, 5)}-${d.slice(5)}`, raioKm: raio })
      if (feriado !== motorista.aceitaFeriado) await api('PATCH', `/api/motoristas/${motorista.id}/preferencias`, { aceitaFeriado: feriado })
      setEstado({ fase: 'salvo', texto: `${d ? `Você recebe aviso de frete a até ${raio} km do CEP ${d.slice(0, 5)}-${d.slice(5)}.` : 'Preferências salvas.'} ${feriado ? 'Frete em feriado também.' : 'Frete em feriado, não.'}` })
    } catch (falha) {
      setEstado({ fase: 'erro', texto: comoProblema(falha).detail })
    }
  }

  return (
    <Bloco id="t-avisos" titulo="Avisos de frete novo">
      <form className="perfil-m__form" onSubmit={salvar} noValidate>
        <div className="campo">
          <label htmlFor="base" className="campo__rotulo">Sua base (CEP)</label>
          <input id="base" inputMode="numeric" autoComplete="postal-code" className="campo__entrada campo__entrada--cep" placeholder="00000-000" value={cep} onChange={(e) => setCep(e.target.value)} />
        </div>
        <div className="busca-m__raios" role="group" aria-label="Raio dos avisos">
          {RAIOS.map((r) => <button key={r} type="button" className="busca-m__raio" aria-pressed={raio === r} onClick={() => setRaio(r)}>{r} km</button>)}
        </div>
        <label className="cadastro__aceite"><input type="checkbox" checked={feriado} onChange={(e) => setFeriado(e.target.checked)} /><span>Aceito frete em feriado</span></label>
        <button type="submit" className="botao botao--secundario" disabled={estado.fase === 'salvando'}>{estado.fase === 'salvando' ? 'Salvando…' : 'Salvar avisos'}</button>
        <div aria-live="polite">
          {estado.fase === 'salvo' && <p role="status" className="perfil-m__ok">{estado.texto}</p>}
          {estado.fase === 'erro' && <p className="campo__erro" role="alert">{estado.texto}</p>}
        </div>
      </form>
    </Bloco>
  )
}
