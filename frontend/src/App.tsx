import { Navigate, Route, Routes } from 'react-router-dom'
import type { Papel } from './api/tipos'
import { LayoutEmpresa, LayoutMotorista } from './components/Layouts'
import { DetalheFreteEmpresa } from './pages/empresa/DetalheFreteEmpresa'
import { FretesEmpresa } from './pages/empresa/FretesEmpresa'
import { Entrar } from './pages/Entrar'
import { BuscaFretes } from './pages/motorista/BuscaFretes'
import { FreteMotorista } from './pages/motorista/FreteMotorista'
import { MeusFretes } from './pages/motorista/MeusFretes'
import { NaoEncontrada } from './pages/NaoEncontrada'
import { useSessao } from './sessao'

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
      <Route path="/" element={<Navigate to={tokens ? (INICIO[tokens.papel] ?? '/entrar') : '/entrar'} replace />} />
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/motorista" element={<Protegida papel="MOTORISTA"><LayoutMotorista /></Protegida>}>
        <Route index element={<BuscaFretes />} />
        <Route path="meus-fretes" element={<MeusFretes />} />
        <Route path="fretes/:id" element={<FreteMotorista />} />
      </Route>
      <Route path="/empresa" element={<Protegida papel="EMPRESA"><LayoutEmpresa /></Protegida>}>
        <Route index element={<FretesEmpresa />} />
        <Route path="fretes/:id" element={<DetalheFreteEmpresa />} />
      </Route>
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  )
}
