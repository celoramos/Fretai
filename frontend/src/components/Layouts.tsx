import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { MODO_DEMO } from '../api/cliente'
import { useSessao } from '../sessao'
import { Indicador } from './ui'
import { Marca } from './Marca'

/** Troca de tela: a página nova sobe 4 px e aparece. Sem saída animada, para não atrasar a navegação. */
function Pagina() {
  const { pathname } = useLocation()
  return (
    <motion.div key={pathname} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
      <Outlet />
    </motion.div>
  )
}

function BotaoTema() {
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

/** Ícones da barra inferior, no traço do botão de tema. O rótulo vem sempre junto: ícone sozinho não diz. */
const ICONES = {
  buscar: <><circle cx="8.5" cy="8.5" r="5" /><path d="M12.2 12.2 17 17" /></>,
  meus: <><rect x="4" y="3" width="12" height="14" rx="2" /><path d="M7.5 7.5h5M7.5 10.5h5M7.5 13.5h3" /></>,
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

export function LayoutMotorista() {
  return (
    <div className="app-motorista">
      <FaixaDemo />
      <header className="topo topo--motorista">
        <Marca />
        <div className="topo__acoes">
          <BotaoTema />
          <BotaoSair />
        </div>
      </header>
      <main className="app-motorista__conteudo" id="conteudo">
        <Pagina />
      </main>
      {/* Navegação no alcance do polegar: os quatro lugares a que o motorista volta. */}
      <nav className="nav-inferior" aria-label="Principal">
        <NavLink to="/motorista" end className="nav-inferior__item">
          {({ isActive }) => <>{isActive && <Indicador id="nav-motorista" forma="linha-topo" />}<IconeNav tipo="buscar" />Fretes</>}
        </NavLink>
        <NavLink to="/motorista/meus-fretes" className="nav-inferior__item">
          {({ isActive }) => <>{isActive && <Indicador id="nav-motorista" forma="linha-topo" />}<IconeNav tipo="meus" />Meus fretes</>}
        </NavLink>
        <NavLink to="/motorista/calculadora" className="nav-inferior__item">
          {({ isActive }) => <>{isActive && <Indicador id="nav-motorista" forma="linha-topo" />}<IconeNav tipo="conta" />Calculadora</>}
        </NavLink>
        <NavLink to="/motorista/perfil" className="nav-inferior__item">
          {({ isActive }) => <>{isActive && <Indicador id="nav-motorista" forma="linha-topo" />}<IconeNav tipo="perfil" />Perfil</>}
        </NavLink>
      </nav>
    </div>
  )
}

export function LayoutEmpresa() {
  return (
    <div className="app-empresa">
      <FaixaDemo />
      <header className="topo topo--empresa">
        <div className="topo__miolo">
          <Marca />
          <nav aria-label="Principal" className="topo__nav">
            <LinkTopo para="/empresa" dentro="/empresa/fretes/">Fretes</LinkTopo>
            <LinkTopo para="/empresa/dados">Empresa</LinkTopo>
          </nav>
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
