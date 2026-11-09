import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { api, comoProblema } from '../api/cliente'
import type { CadastroCliente, CadastroEmpresa, CadastroMotorista, CategoriaVeiculo, DadosCnpj, Problema, TipoEmpresa } from '../api/tipos'
import { BotaoGoogle } from '../components/BotaoGoogle'
import { GOOGLE_DISPONIVEL } from '../google'
import { INICIO } from '../inicio'
import { Marca } from '../components/Marca'
import { Aviso } from '../components/ui'
import { transicao } from '../movimento'
import { useSessao } from '../sessao'
import { useTitulo } from '../useTitulo'

type Perfil = 'MOTORISTA' | 'EMPRESA' | 'CLIENTE'
/** O que o login com Google devolve quando a pessoa ainda não tem conta (Entrar.tsx manda pelo state). */
interface ContaGoogle { credencial: string; email: string; nome: string | null }

const VEICULOS: { valor: CategoriaVeiculo; rotulo: string }[] = [
  { valor: 'CAMINHAO', rotulo: 'Caminhão' },
  { valor: 'VAN', rotulo: 'Van / furgão' },
  { valor: 'UTILITARIO', rotulo: 'Utilitário (Fiorino, Kangoo)' },
]

const digitos = (v: string) => v.replace(/\D/g, '')

export function Cadastro() {
  useTitulo('Criar conta')
  const { tokens, entrar, entrarComGoogle } = useSessao()
  const navegar = useNavigate()
  const estado = useLocation().state as { google?: ContaGoogle } | null
  const [params] = useSearchParams()
  const [google, setGoogle] = useState<ContaGoogle | null>(estado?.google ?? null)
  // O link "frete avulso" da página inicial já chega com o perfil de cliente escolhido.
  const [perfil, setPerfil] = useState<Perfil | null>(params.get('perfil') === 'cliente' ? 'CLIENTE' : null)
  const [campos, setCampos] = useState<Record<string, string>>(() => ({ nome: estado?.google?.nome ?? '', tipoVeiculo: 'CAMINHAO', tipo: 'EMBARCADOR' }))
  const [empresaReceita, setEmpresaReceita] = useState<DadosCnpj | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(null)
  const formulario = useRef<HTMLFormElement>(null)

  // Depois de um erro, o foco vai para o primeiro campo marcado (ou para o aviso, se não for de campo).
  useEffect(() => {
    if (!problema) return
    const alvo = formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ?? document.getElementById('erro-cadastro')
    alvo?.focus()
  }, [problema])

  if (tokens) return <Navigate to="/" replace />

  const muda = (nome: string) => (e: { target: { value: string } }) => setCampos((c) => ({ ...c, [nome]: e.target.value }))
  /** Erro de um campo, já traduzido do nome da API (responsavel.cpf, senhaOuGoogle) para o nome do formulário. */
  const erro = (nome: string) => {
    const e = problema?.erros
    if (!e) return undefined
    if (nome === 'senha') return e.senha ?? e.senhaOuGoogle ?? e['responsavel.senha'] ?? e['responsavel.senhaOuGoogle']
    return perfil === 'EMPRESA' && ['cpf', 'nome', 'email', 'telefoneResponsavel'].includes(nome)
      ? e[`responsavel.${nome === 'telefoneResponsavel' ? 'telefone' : nome}`]
      : e[nome]
  }

  async function comGoogle(credencial: string) {
    setProblema(null)
    try {
      // Quem já tem conta com esse Google entra direto; quem não tem segue o cadastro com os dados dele.
      const t = await entrarComGoogle(credencial)
      navegar(INICIO[t.papel])
    } catch (erro) {
      const p = comoProblema(erro)
      if (p.codigo === 'CADASTRO_NECESSARIO' && p.email) {
        setGoogle({ credencial, email: p.email, nome: p.nome ?? null })
        setCampos((c) => ({ ...c, nome: c.nome || p.nome || '' }))
      } else setProblema(p)
    }
  }

  async function buscarCnpj() {
    const cnpj = digitos(campos.cnpj ?? '')
    if (cnpj.length !== 14) return
    try {
      setEmpresaReceita(await api<DadosCnpj>('GET', `/api/empresas/${cnpj}`))
    } catch {
      setEmpresaReceita(null)
    }
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setProblema(null)
    setEnviando(true)
    const email = google ? google.email : (campos.email ?? '').trim()
    const acesso = google ? { credencialGoogle: google.credencial } : { senha: campos.senha ?? '' }
    try {
      if (perfil === 'MOTORISTA') {
        const corpo: CadastroMotorista = {
          cpf: digitos(campos.cpf ?? ''), nome: (campos.nome ?? '').trim(), email, telefone: digitos(campos.telefone ?? ''),
          tipoVeiculo: campos.tipoVeiculo as CategoriaVeiculo, placa: (campos.placa ?? '').trim().toUpperCase(), ...acesso,
        }
        await api('POST', '/api/motoristas', corpo)
      } else if (perfil === 'CLIENTE') {
        const corpo: CadastroCliente = {
          cpf: digitos(campos.cpf ?? ''), nome: (campos.nome ?? '').trim(), email, telefone: digitos(campos.telefone ?? ''), ...acesso,
        }
        await api('POST', '/api/clientes', corpo)
      } else {
        const corpo: CadastroEmpresa = {
          cnpj: digitos(campos.cnpj ?? ''), tipo: campos.tipo as TipoEmpresa, telefone: digitos(campos.telefone ?? ''),
          nomeFantasia: campos.nomeFantasia?.trim() || undefined,
          responsavel: { cpf: digitos(campos.cpf ?? ''), nome: (campos.nome ?? '').trim(), email, telefone: digitos(campos.telefoneResponsavel ?? ''), ...acesso },
        }
        await api('POST', '/api/empresas', corpo)
      }
      const t = google ? await entrarComGoogle(google.credencial) : await entrar(email, campos.senha ?? '')
      navegar(INICIO[t.papel])
    } catch (erro) {
      setProblema(comoProblema(erro))
    } finally {
      setEnviando(false)
    }
  }

  const erroGeral = problema && !problema.erros

  return (
    <main className="cadastro">
      <div className="cadastro__caixa">
        <Link to="/" className="entrar__marca" aria-label="Fretaí, página inicial"><Marca /></Link>

        <AnimatePresence mode="wait" initial={false}>
          {!perfil ? (
            <motion.section key="perfil" className="cadastro__passo" aria-labelledby="cadastro-titulo"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={transicao}>
              <h1 id="cadastro-titulo" className="formulario__titulo">Criar conta</h1>
              {google ? (
                <p className="cadastro__google">Com o Google como <strong>{google.email}</strong>. Falta pouco.</p>
              ) : GOOGLE_DISPONIVEL && (
                <>
                  <BotaoGoogle texto="signup_with" aoReceber={comGoogle} />
                  <p className="formulario__ou"><span>ou escolha e preencha</span></p>
                </>
              )}
              <h2 className="cadastro__pergunta">Como você vai usar o Fretaí?</h2>
              <div className="cadastro__perfis">
                <button type="button" className="cadastro__perfil" onClick={() => setPerfil('MOTORISTA')}>
                  <span className="cadastro__perfil-titulo">Sou motorista</span>
                  <span>Procuro frete com o pagamento garantido antes de carregar.</span>
                </button>
                <button type="button" className="cadastro__perfil" onClick={() => setPerfil('EMPRESA')}>
                  <span className="cadastro__perfil-titulo">Tenho carga</span>
                  <span>Publico fretes, escolho o motorista e acompanho a entrega.</span>
                </button>
              </div>
              {/* Entrada secundária, como pede o briefing: o foco é o marketplace de empresas. */}
              <div className="cadastro__avulso">
                <p>Pessoa física com um frete avulso, como uma mudança?</p>
                <button type="button" className="botao botao--secundario" onClick={() => setPerfil('CLIENTE')}>Pedir como pessoa física</button>
              </div>
              <div aria-live="polite" id="erro-cadastro" tabIndex={-1}>
                {erroGeral && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}
              </div>
              <p className="formulario__troca">Já tem conta? <Link to="/entrar">Entrar</Link></p>
            </motion.section>
          ) : (
            <motion.form key="dados" ref={formulario} className="cadastro__passo" onSubmit={enviar} noValidate aria-labelledby="dados-titulo"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={transicao}>
              <button type="button" className="botao botao--fantasma cadastro__voltar" onClick={() => { setPerfil(null); setProblema(null) }}>
                ← Trocar perfil
              </button>
              <h1 id="dados-titulo" className="formulario__titulo">{perfil === 'MOTORISTA' ? 'Seus dados de motorista' : perfil === 'CLIENTE' ? 'Seus dados' : 'Dados da empresa'}</h1>
              {perfil === 'CLIENTE' && (
                <p className="cadastro__google">Com a conta você pede o frete, escolhe o motorista pelas propostas e paga por Pix. O dinheiro fica guardado até a entrega.</p>
              )}

              {perfil === 'EMPRESA' && (
                <fieldset className="cadastro__grupo">
                  <legend>Empresa</legend>
                  <Campo nome="cnpj" rotulo="CNPJ" erro={erro('cnpj')} value={campos.cnpj ?? ''} onChange={muda('cnpj')} onBlur={buscarCnpj}
                    inputMode="numeric" autoComplete="off" placeholder="00.000.000/0000-00"
                    ajuda={empresaReceita ? `${empresaReceita.razaoSocial} · ${empresaReceita.situacaoCadastral.toLowerCase()} na Receita` : 'A razão social vem da Receita Federal. Só empresa ativa entra.'} />
                  <div className="campo" role="radiogroup" aria-label="Tipo de empresa">
                    <span className="campo__rotulo">A empresa é</span>
                    <div className="cadastro__opcoes">
                      {([['EMBARCADOR', 'Embarcador', 'dona da carga'], ['AGENCIADOR', 'Agenciador', 'intermedeia o frete']] as const).map(([v, r, d]) => (
                        <label key={v} className="cadastro__opcao">
                          <input type="radio" name="tipo" value={v} checked={campos.tipo === v} onChange={muda('tipo')} />
                          <span><strong>{r}</strong> · {d}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <Campo nome="nomeFantasia" rotulo="Nome fantasia (opcional)" erro={erro('nomeFantasia')} value={campos.nomeFantasia ?? ''} onChange={muda('nomeFantasia')} autoComplete="organization" />
                  <Campo nome="telefone" rotulo="Telefone da empresa" erro={erro('telefone')} value={campos.telefone ?? ''} onChange={muda('telefone')} inputMode="tel" autoComplete="tel" placeholder="(11) 3333-4444" />
                </fieldset>
              )}

              <fieldset className="cadastro__grupo">
                {perfil === 'EMPRESA' && <legend>Quem vai entrar pela empresa</legend>}
                <Campo nome="nome" rotulo="Nome completo" erro={erro('nome')} value={campos.nome ?? ''} onChange={muda('nome')} autoComplete="name" />
                <Campo nome="cpf" rotulo="CPF" erro={erro('cpf')} value={campos.cpf ?? ''} onChange={muda('cpf')} inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" />
                {perfil !== 'EMPRESA'
                  ? <Campo nome="telefone" rotulo="Celular com DDD" erro={erro('telefone')} value={campos.telefone ?? ''} onChange={muda('telefone')} inputMode="tel" autoComplete="tel" placeholder="(11) 98888-7777" />
                  : <Campo nome="telefoneResponsavel" rotulo="Celular com DDD" erro={erro('telefoneResponsavel')} value={campos.telefoneResponsavel ?? ''} onChange={muda('telefoneResponsavel')} inputMode="tel" autoComplete="tel" placeholder="(11) 98888-7777" />}
                {google ? (
                  <p className="cadastro__google">Você vai entrar com o Google: <strong>{google.email}</strong>. Não precisa de senha.</p>
                ) : (
                  <>
                    <Campo nome="email" rotulo="E-mail" erro={erro('email')} value={campos.email ?? ''} onChange={muda('email')} type="email" autoComplete="email" spellCheck={false} />
                    <Campo nome="senha" rotulo="Senha" erro={erro('senha')} value={campos.senha ?? ''} onChange={muda('senha')} type="password" autoComplete="new-password" ajuda="Pelo menos 8 caracteres." />
                  </>
                )}
              </fieldset>

              {perfil === 'MOTORISTA' && (
                <fieldset className="cadastro__grupo">
                  <legend>Seu veículo</legend>
                  <div className="campo">
                    <label htmlFor="tipoVeiculo" className="campo__rotulo">Tipo de veículo</label>
                    <select id="tipoVeiculo" className="campo__entrada" value={campos.tipoVeiculo} onChange={muda('tipoVeiculo')}>
                      {VEICULOS.map((v) => <option key={v.valor} value={v.valor}>{v.rotulo}</option>)}
                    </select>
                  </div>
                  <Campo nome="placa" rotulo="Placa" erro={erro('placa')} value={campos.placa ?? ''} onChange={muda('placa')} autoComplete="off" spellCheck={false} placeholder="ABC1D23" className="campo__entrada campo__entrada--placa" />
                </fieldset>
              )}

              <div aria-live="polite" id="erro-cadastro" tabIndex={-1}>
                {erroGeral && <Aviso tom={problema.status === 409 ? 'alerta' : 'perigo'} titulo={problema.title}>{problema.detail}</Aviso>}
              </div>

              <p className="cadastro__aceite">
                Ao criar a conta, você concorda com os <Link to="/termos">termos de uso</Link> e com a <Link to="/privacidade">política de privacidade</Link>.
              </p>
              <button type="submit" className="botao botao--primario botao--largo" disabled={enviando}>
                {enviando ? 'Criando a conta…' : 'Criar conta'}
              </button>
              <p className="formulario__troca">Já tem conta? <Link to="/entrar">Entrar</Link></p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

function Campo({ nome, rotulo, erro, ajuda, className = 'campo__entrada', ...resto }: {
  nome: string; rotulo: string; erro?: string; ajuda?: string
} & InputHTMLAttributes<HTMLInputElement>) {
  const descricao = [erro && `${nome}-erro`, ajuda && `${nome}-ajuda`].filter(Boolean).join(' ') || undefined
  return (
    <div className="campo">
      <label htmlFor={nome} className="campo__rotulo">{rotulo}</label>
      <input id={nome} name={nome} className={className} aria-invalid={erro ? true : undefined} aria-describedby={descricao} {...resto} />
      {ajuda && <p id={`${nome}-ajuda`} className="campo__ajuda">{ajuda}</p>}
      {erro && <p id={`${nome}-erro`} className="campo__erro">{erro}</p>}
    </div>
  )
}
