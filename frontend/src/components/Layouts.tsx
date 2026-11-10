import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { api, MODO_DEMO } from '../api/cliente'
import type { Eu } from '../api/tipos'
import { useRecurso } from '../api/useRecurso'
import { useSessao } from '../sessao'
import { Avatar } from './Avatar'
import { Indicador } from './ui'
import { Marca } from './Marca'
import { MenuConta } from './MenuConta'

/** Troca de tela: a página nova sobe 4 px e aparece. Sem saída animada, para não atrasar a navegação. */
function Pagina() {
  const { pathname } = useLocation()
  return (
    <motion.div key={pathname} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
      <Outlet />
    </motion.div>
  )
}

export function BotaoTema() {
  const { tema, alternarTema } = useSessao()
  return (
    <button type="button" className="botao botao--fantasma botao--icone" onClick={alternarTema} aria-label={tema === 'escuro' ? 'Usar tema claro' : 'Usar tema escuro'}>
      <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
        {tema === 'escuro' ? (
          <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="10" cy="10" r="3.5" />
            <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4" />
          </g>
        ) : (
          <path d="M15.5 12.5A6.5 6.5 0 0 1 7.5 4.5a6.5 6.5 0 1 0 8 8Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  )
}

function BotaoSair() {
  const { sair } = useSessao()
  const navegar = useNavigate()
  return (
    <button type="button" className="botao botao--fantasma" onClick={() => sair().then(() => navegar('/entrar'))}>
      Sair
    </button>
  )
}

/** Ícones da barra de baixo, no traço do botão de tema. O rótulo vem sempre junto: ícone sozinho não diz. */
const ICONES = {
  buscar: <><circle cx="8.5" cy="8.5" r="5" /><path d="M12.2 12.2 17 17" /></>,
  meus: <><path d="M2.5 5.5h9.5v8H2.5z" /><path d="M12 8.5h3.2l2.3 2.7v2.3H12" /><circle cx="6" cy="15" r="1.6" /><circle cx="14.5" cy="15" r="1.6" /></>,
  conta: <><rect x="4" y="2.5" width="12" height="15" rx="2" /><path d="M7 6h6M7 10h.01M10 10h.01M13 10h.01M7 13.5h.01M10 13.5h.01M13 13.5h.01" /></>,
  perfil: <><circle cx="10" cy="7" r="3.2" /><path d="M3.8 17c.9-3.2 3.3-5 6.2-5s5.3 1.8 6.2 5" /></>,
}

function IconeNav({ tipo }: { tipo: keyof typeof ICONES }) {
  return (
    <svg className="nav-inferior__icone" viewBox="0 0 20 20" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {ICONES[tipo]}
    </svg>
  )
}

/** Link da barra de cima. "Fretes" continua marcado dentro de um frete (/empresa/fretes/...). */
function LinkTopo({ para, dentro, children }: { para: string; dentro?: string; children: ReactNode }) {
  const { pathname } = useLocation()
  const aqui = pathname === para
  const ativo = aqui || (dentro != null && pathname.startsWith(dentro))
  return (
    <Link to={para} className={ativo ? 'topo__link active' : 'topo__link'} aria-current={aqui ? 'page' : undefined}>
      {children}
    </Link>
  )
}

function FaixaDemo() {
  if (!MODO_DEMO) return null
  return <p className="faixa-demo">Modo demonstração: dados de exemplo, nada é gravado.</p>
}

/** Os quatro lugares a que o motorista volta, na ordem do canvas. */
const DESTINOS_MOTORISTA = [
  { para: '/motorista', rotulo: 'Fretes', icone: 'buscar', fim: true, dentro: '/motorista/fretes/' },
  { para: '/motorista/meus-fretes', rotulo: 'Meus fretes', icone: 'meus', fim: false },
  { para: '/motorista/calculadora', rotulo: 'Calculadora', icone: 'conta', fim: false },
  { para: '/motorista/perfil', rotulo: 'Perfil', icone: 'perfil', fim: false },
] as const

/**
 * Motorista. No celular não há barra em cima: cada tela traz o próprio cabeçalho e a navegação fica
 * embaixo, no alcance do polegar. A partir de 900px a navegação sobe para uma barra com a marca, o tema
 * e o avatar, que leva ao Perfil, como no canvas.
 */
export function LayoutMotorista() {
  const { pathname } = useLocation()
  const { tokens } = useSessao()
  const [eu] = useRecurso(() => api<Eu>('GET', '/api/auth/eu'), [tokens?.usuarioId])
  return (
    <div className="app-motorista">
      <FaixaDemo />
      <header className="topo-app topo-app--so-computador">
        <div className="topo-app__miolo">
          <Link to="/motorista" className="topo-app__marca" aria-label="Fretaí, fretes perto de você"><Marca /></Link>
          <nav aria-label="Menu do motorista" className="topo-app__nav">
            {DESTINOS_MOTORISTA.map((d) => {
              const ativo = d.fim ? pathname === d.para || ('dentro' in d && pathname.startsWith(d.dentro)) : pathname.startsWith(d.para)
              return (
                <Link key={d.para} to={d.para} className={ativo ? 'pilula-nav ativa' : 'pilula-nav'} aria-current={pathname === d.para ? 'page' : undefined}>
                  {ativo && <Indicador id="nav-motorista-topo" forma="fundo" />}
                  {d.rotulo}
                </Link>
              )
            })}
          </nav>
          <BotaoTema />
          <Link to="/motorista/perfil" className="conta__avatar" aria-label="Seu perfil">
            <Avatar nome={eu.fase === 'pronto' ? eu.dados.nome : null} />
          </Link>
        </div>
      </header>
      <main className="app-motorista__conteudo" id="conteudo">
        <Pagina />
      </main>
      <nav className="nav-inferior" aria-label="Principal">
        {DESTINOS_MOTORISTA.map((d) => (
          <NavLink key={d.para} to={d.para} end={d.fim} className="nav-inferior__item">
            <IconeNav tipo={d.icone} />
            {d.rotulo}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

/** Escritório: largura de mesa e a navegação em cima. A empresa e o administrador trabalham assim. */
function LayoutEscritorio({ links, classe }: { links?: ReactNode; classe?: string }) {
  return (
    <div className={classe ? `app-empresa ${classe}` : 'app-empresa'}>
      <FaixaDemo />
      <header className="topo topo--empresa">
        <div className="topo__miolo">
          <Marca />
          {links && <nav aria-label="Principal" className="topo__nav">{links}</nav>}
          <div className="topo__acoes">
            <BotaoTema />
            <BotaoSair />
          </div>
        </div>
      </header>
      <main className="app-empresa__conteudo" id="conteudo">
        <Pagina />
      </main>
    </div>
  )
}

export function LayoutEmpresa() {
  return (
    <LayoutEscritorio links={<>
      <LinkTopo para="/empresa" dentro="/empresa/fretes/">Fretes</LinkTopo>
      <LinkTopo para="/empresa/pagamentos">Pagamentos</LinkTopo>
      <LinkTopo para="/empresa/dados">Empresa</LinkTopo>
    </>} />
  )
}

/**
 * Cliente pessoa física, como no canvas. No computador, a barra de cima em toda tela: marca, Meus fretes,
 * Pedir frete e o avatar com o menu da conta. No celular a barra só aparece no início (marca e avatar);
 * as outras telas têm o próprio cabeçalho, com o caminho de volta. O botão de tema não está no canvas e
 * fica ao lado do avatar, como na barra do motorista: o cliente já trocava de tema antes do redesign.
 */
export function LayoutCliente() {
  const { pathname } = useLocation()
  const noInicio = pathname === '/cliente'
  return (
    <div className="app-cliente">
      <FaixaDemo />
      <header className={noInicio ? 'topo-app' : 'topo-app topo-app--so-computador'}>
        <div className="topo-app__miolo">
          <Link to="/cliente" className="topo-app__marca" aria-label="Fretaí, seus fretes"><Marca /></Link>
          <nav aria-label="Principal" className="topo-app__nav topo-app__nav--cliente">
            <Link to="/cliente" className="pilula-nav pilula-nav--clara" aria-current={noInicio ? 'page' : undefined}>Meus fretes</Link>
            <Link to="/cliente/fretes/novo" className="pilula-nav pilula-nav--escura">Pedir frete</Link>
          </nav>
          <BotaoTema />
          <MenuConta />
        </div>
      </header>
      <main className="app-cliente__conteudo" id="conteudo">
        <Pagina />
      </main>
    </div>
  )
}

/** As três filas do administrador, na ordem do que trava dinheiro: documento, contestação, piso. */
export function LayoutAdmin() {
  return (
    <LayoutEscritorio links={<>
      <LinkTopo para="/admin">Documentos</LinkTopo>
      <LinkTopo para="/admin/contestacoes">Contestações</LinkTopo>
      <LinkTopo para="/admin/piso-antt">Piso ANTT</LinkTopo>
    </>} />
  )
}
