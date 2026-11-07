import { motion } from 'motion/react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { MODO_DEMO } from '../api/cliente'
import { useSessao } from '../sessao'
import { Indicador } from './ui'

/** Troca de tela: a página nova sobe 4 px e aparece. Sem saída animada, para não atrasar a navegação. */
function Pagina() {
  const { pathname } = useLocation()
  return (
    <motion.div key={pathname} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
      <Outlet />
    </motion.div>
  )
}

function Marca() {
  return (
    <span className="marca">
      <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
        <rect width="32" height="32" rx="6" fill="var(--cor-asfalto)" />
        <path d="M4 16h5M13.5 16h5M23 16h5" stroke="var(--cor-faixa)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      Fretaí
    </span>
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
      {/* Navegação no alcance do polegar. Carteira e Perfil entram quando as telas existirem. */}
      <nav className="nav-inferior" aria-label="Principal">
        <NavLink to="/motorista" end className="nav-inferior__item">
          {({ isActive }) => <>{isActive && <Indicador id="nav-motorista" forma="linha-topo" />}Fretes</>}
        </NavLink>
        <NavLink to="/motorista/meus-fretes" className="nav-inferior__item">
          {({ isActive }) => <>{isActive && <Indicador id="nav-motorista" forma="linha-topo" />}Meus fretes</>}
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
            <NavLink to="/empresa" className="topo__link">Fretes</NavLink>
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
