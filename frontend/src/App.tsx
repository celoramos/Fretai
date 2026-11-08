import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import type { Papel } from './api/tipos'
import { LayoutEmpresa, LayoutMotorista } from './components/Layouts'
import { DetalheFreteEmpresa } from './pages/empresa/DetalheFreteEmpresa'
import { FretesEmpresa } from './pages/empresa/FretesEmpresa'
import { PublicarFrete } from './pages/empresa/PublicarFrete'
import { Cadastro } from './pages/Cadastro'
import { Entrar } from './pages/Entrar'
import { BuscaFretes } from './pages/motorista/BuscaFretes'
import { FreteMotorista } from './pages/motorista/FreteMotorista'
import { MeusFretes } from './pages/motorista/MeusFretes'
import { RegistrarEntrega } from './pages/motorista/RegistrarEntrega'
import { Calculadora } from './pages/motorista/Calculadora'
import { Perfil } from './pages/motorista/Perfil'
import { NaoEncontrada } from './pages/NaoEncontrada'
import { useSessao } from './sessao'

/* A página pública carrega à parte: o GSAP e o CSS dela não entram no app logado. */
const Inicio = lazy(() => import('./pages/Inicio').then((m) => ({ default: m.Inicio })))

const Privacidade = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Privacidade })))
const Termos = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Termos })))

const INICIO: Partial<Record<Papel, string>> = { MOTORISTA: '/motorista', EMPRESA: '/empresa' }

function Protegida({ papel, children }: { papel: Papel; children: React.ReactNode }) {
  const { tokens } = useSessao()
  if (!tokens) return <Navigate to="/entrar" replace />
  if (tokens.papel !== papel) return <Navigate to={INICIO[tokens.papel] ?? '/entrar'} replace />
  return children
}

export function App() {
  const { tokens } = useSessao()
  return (
    <Routes>
      <Route path="/" element={tokens ? <Navigate to={INICIO[tokens.papel] ?? '/entrar'} replace /> : <Suspense fallback={null}><Inicio /></Suspense>} />
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/privacidade" element={<Suspense fallback={null}><Privacidade /></Suspense>} />
      <Route path="/termos" element={<Suspense fallback={null}><Termos /></Suspense>} />
      <Route path="/motorista" element={<Protegida papel="MOTORISTA"><LayoutMotorista /></Protegida>}>
        <Route index element={<BuscaFretes />} />
        <Route path="meus-fretes" element={<MeusFretes />} />
        <Route path="fretes/:id" element={<FreteMotorista />} />
        <Route path="fretes/:id/entrega" element={<RegistrarEntrega />} />
        <Route path="calculadora" element={<Calculadora />} />
        <Route path="perfil" element={<Perfil />} />
      </Route>
      <Route path="/empresa" element={<Protegida papel="EMPRESA"><LayoutEmpresa /></Protegida>}>
        <Route index element={<FretesEmpresa />} />
        <Route path="fretes/novo" element={<PublicarFrete />} />
        <Route path="fretes/:id" element={<DetalheFreteEmpresa />} />
      </Route>
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  )
}
