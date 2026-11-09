import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { api, comoProblema } from '../api/cliente'
import type { CadastroCliente, CadastroEmpresa, CadastroMotorista, CategoriaVeiculo, DadosCnpj, Problema, TipoEmpresa } from '../api/tipos'
import { BotaoGoogle } from '../components/BotaoGoogle'
import { CabecalhoPagina } from '../components/CabecalhoPagina'
import { GOOGLE_DISPONIVEL } from '../google'
import { INICIO } from '../inicio'
import { useComputador } from '../largura'
import { Marca } from '../components/Marca'
import { Aviso } from '../components/ui'
import { useSessao } from '../sessao'
import { useTitulo } from '../useTitulo'

type Perfil = 'MOTORISTA' | 'EMPRESA' | 'CLIENTE'
/** O que o login com Google devolve quando a pessoa ainda não tem conta (Entrar.tsx manda pelo state). */
interface ContaGoogle { credencial: string; email: string; nome: string | null }

/** Os três tamanhos, com o texto do cadastro do canvas (que junta o exemplo e o que cabe). */
const VEICULOS: { valor: CategoriaVeiculo; nome: string; texto: string }[] = [
  { valor: 'UTILITARIO', nome: 'Utilitário', texto: 'Fiorino, Kangoo. Pequenos volumes e um ou dois eletrodomésticos.' },
  { valor: 'VAN', nome: 'Van ou furgão', texto: 'Master, Ducato, Sprinter. Mudança de quitinete ou de um quarto.' },
  { valor: 'CAMINHAO', nome: 'Caminhão', texto: '3/4, toco ou baú. Mudança de casa e material de obra.' },
]

const digitos = (v: string) => v.replace(/\D/g, '')
const PERFIL_DA_URL: Record<string, Perfil> = { cliente: 'CLIENTE', motorista: 'MOTORISTA', empresa: 'EMPRESA' }

/**
 * Criar conta, como no canvas: os dois perfis lado a lado, o Google e o formulário numa página só. O
 * motorista escolhe o tamanho do veículo e a placa (o número da CNH não entra: a foto da CNH, conferida
 * pelo administrador, já traz). A empresa, que o canvas não desenha, continua com a entrada dela.
 */
export function Cadastro() {
  useTitulo('Criar conta')
  const computador = useComputador()
  const { tokens, entrar, entrarComGoogle } = useSessao()
  const navegar = useNavigate()
  const estado = useLocation().state as { google?: ContaGoogle } | null
  const [params] = useSearchParams()
  const [google, setGoogle] = useState<ContaGoogle | null>(estado?.google ?? null)
  const [perfil, setPerfil] = useState<Perfil>(PERFIL_DA_URL[params.get('perfil') ?? ''] ?? 'CLIENTE')
  const [campos, setCampos] = useState<Record<string, string>>(() => ({ nome: estado?.google?.nome ?? '', tipoVeiculo: 'VAN', tipo: 'EMBARCADOR' }))
  const [aceite, setAceite] = useState(false)
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
    if (!aceite) {
      setProblema({ title: 'Dados inválidos', detail: '', status: 400, erros: { aceite: 'Para criar a conta, aceite os termos de uso e a política de privacidade.' } })
      return
    }
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
  const botaoCriar = (
    <button type="submit" form="cadastro-form" className="botao botao--primario botao--largo" disabled={enviando}>
      {enviando ? 'Criando a conta…' : 'Criar conta'}
    </button>
  )

  return (
    <div className="cadastro">
      <header className="topo-app topo-app--so-computador">
        <div className="topo-app__miolo">
          <Link to="/" className="topo-app__marca" aria-label="Fretaí, página inicial"><Marca /></Link>
          <p className="formulario__troca">Já tem conta? <Link to="/entrar">Entrar</Link></p>
        </div>
      </header>

      <main className="cadastro__caixa" id="conteudo">
        <CabecalhoPagina titulo="Criar conta" voltar="/entrar" rotuloVoltar="Voltar para entrar" />

        <fieldset className="cadastro__perfis">
          <legend className="visualmente-oculto">Como você vai usar o Fretaí?</legend>
          <label className="cadastro__perfil">
            <input type="radio" name="perfil" className="visualmente-oculto" checked={perfil === 'CLIENTE'} onChange={() => setPerfil('CLIENTE')} />
            <span className="cadastro__perfil-titulo">Quero pedir fretes</span>
            <span>Mudança, móveis, eletrodomésticos, material de obra.</span>
          </label>
          <label className="cadastro__perfil">
            <input type="radio" name="perfil" className="visualmente-oculto" checked={perfil === 'MOTORISTA'} onChange={() => setPerfil('MOTORISTA')} />
            <span className="cadastro__perfil-titulo">Sou motorista</span>
            <span>{computador ? 'Tenho utilitário, van ou caminhão e quero fazer fretes.' : 'Tenho utilitário, van ou caminhão.'}</span>
          </label>
        </fieldset>
        {perfil !== 'EMPRESA' ? (
          <p className="cadastro__empresa">
            Empresa que publica fretes? <button type="button" className="link-acao" onClick={() => setPerfil('EMPRESA')}>Cadastrar a empresa</button>
          </p>
        ) : (
          <p className="cadastro__empresa">Cadastro de empresa: quem publica fretes e escolhe o motorista pelas propostas.</p>
        )}

        {google ? (
          <p className="cadastro__google">Com o Google como <strong>{google.email}</strong>. Falta pouco.</p>
        ) : GOOGLE_DISPONIVEL && (
          <>
            <BotaoGoogle texto="continue_with" aoReceber={comGoogle} />
            <p className="formulario__ou"><span>ou com e-mail</span></p>
          </>
        )}

        <form id="cadastro-form" ref={formulario} className="cadastro__cartao cartao" onSubmit={enviar} noValidate aria-label="Seus dados">
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
              <Campo nome="telefone" rotulo="Telefone da empresa" erro={erro('telefone')} value={campos.telefone ?? ''} onChange={muda('telefone')} inputMode="tel" autoComplete="tel" placeholder="(00) 0000-0000" />
            </fieldset>
          )}

          <fieldset className="cadastro__grupo">
            {perfil === 'EMPRESA' && <legend>Quem vai entrar pela empresa</legend>}
            <Campo nome="nome" rotulo="Nome completo" erro={erro('nome')} value={campos.nome ?? ''} onChange={muda('nome')} autoComplete="name" />
            <div className="cadastro__par">
              <Campo nome="cpf" rotulo="CPF" erro={erro('cpf')} value={campos.cpf ?? ''} onChange={muda('cpf')} inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" />
              {perfil !== 'EMPRESA'
                ? <Campo nome="telefone" rotulo="Celular com WhatsApp" erro={erro('telefone')} value={campos.telefone ?? ''} onChange={muda('telefone')} inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" />
                : <Campo nome="telefoneResponsavel" rotulo="Celular com WhatsApp" erro={erro('telefoneResponsavel')} value={campos.telefoneResponsavel ?? ''} onChange={muda('telefoneResponsavel')} inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" />}
            </div>
            {google ? (
              <p className="cadastro__google">Você vai entrar com o Google: <strong>{google.email}</strong>. Não precisa de senha.</p>
            ) : (
              <div className="cadastro__par">
                <Campo nome="email" rotulo="E-mail" erro={erro('email')} value={campos.email ?? ''} onChange={muda('email')} type="email" autoComplete="email" spellCheck={false} placeholder="voce@email.com" />
                <Campo nome="senha" rotulo="Senha" erro={erro('senha')} value={campos.senha ?? ''} onChange={muda('senha')} type="password" autoComplete="new-password" placeholder="Pelo menos 8 caracteres" />
              </div>
            )}
          </fieldset>

          {perfil === 'MOTORISTA' && (
            <fieldset className="cadastro__grupo cadastro__veiculo">
              <legend>Seu veículo</legend>
              <div className="opcoes">
                {VEICULOS.map((v) => (
                  <label key={v.valor} className="opcao">
                    <input type="radio" name="tipoVeiculo" value={v.valor} checked={campos.tipoVeiculo === v.valor} onChange={muda('tipoVeiculo')} />
                    <span className="opcao__texto"><strong>{v.nome}</strong><span>{v.texto}</span></span>
                  </label>
                ))}
              </div>
              <p className="campo__ajuda">Carro de passeio e moto não fazem frete no Fretaí.</p>
              <div className="cadastro__par">
                <Campo nome="placa" rotulo="Placa" erro={erro('placa')} value={campos.placa ?? ''} onChange={muda('placa')} autoComplete="off" spellCheck={false} placeholder="ABC1D23" className="campo__entrada campo__entrada--placa" />
              </div>
              <p className="campo__ajuda">A foto da CNH e o CRLV você envia pelo app. Um administrador confere antes do seu primeiro frete.</p>
            </fieldset>
          )}

          <div className="campo">
            <label className="cadastro__aceite">
              <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)}
                aria-invalid={erro('aceite') ? true : undefined} aria-describedby={erro('aceite') ? 'aceite-erro' : undefined} />
              <span>Li e aceito os <Link to="/termos">termos de uso</Link> e a <Link to="/privacidade">política de privacidade</Link>.</span>
            </label>
            {erro('aceite') && <p id="aceite-erro" className="campo__erro">{erro('aceite')}</p>}
          </div>

          <div aria-live="polite" id="erro-cadastro" tabIndex={-1}>
            {erroGeral && <Aviso tom={problema.status === 409 ? 'alerta' : 'perigo'} titulo={problema.title}>{problema.detail}</Aviso>}
          </div>

          {computador && botaoCriar}
        </form>
      </main>

      {/* No celular o botão fica preso embaixo, como no canvas: o formulário é longo e ele não some. */}
      {!computador && <div className="cadastro__rodape">{botaoCriar}</div>}
    </div>
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
