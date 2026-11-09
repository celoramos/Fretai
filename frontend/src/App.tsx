import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import type { Papel } from './api/tipos'
import { LayoutAdmin, LayoutCliente, LayoutEmpresa, LayoutMotorista } from './components/Layouts'
import { INICIO } from './inicio'
import { DadosEmpresa } from './pages/empresa/DadosEmpresa'
import { DetalheFrete } from './pages/contratante/DetalheFrete'
import { FretesEmpresa } from './pages/empresa/FretesEmpresa'
import { PagamentosEmpresa } from './pages/empresa/PagamentosEmpresa'
import { EditarFrete, PublicarFrete } from './pages/empresa/PublicarFrete'
import { Cadastro } from './pages/Cadastro'
import { Entrar } from './pages/Entrar'
import { BuscaFretes } from './pages/motorista/BuscaFretes'
import { FreteMotorista } from './pages/motorista/FreteMotorista'
import { Extrato } from './pages/motorista/Extrato'
import { MeusFretes } from './pages/motorista/MeusFretes'
import { RegistrarEntrega } from './pages/motorista/RegistrarEntrega'
import { Calculadora } from './pages/motorista/Calculadora'
import { Perfil } from './pages/motorista/Perfil'
import { NaoEncontrada } from './pages/NaoEncontrada'
import { NovaSenha } from './pages/NovaSenha'
import { useSessao } from './sessao'

/* A página pública carrega à parte: o GSAP e o CSS dela não entram no app logado. */
const Inicio = lazy(() => import('./pages/Inicio').then((m) => ({ default: m.Inicio })))

const Privacidade = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Privacidade })))
const Termos = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Termos })))
const Contestar = lazy(() => import('./pages/Contestar').then((m) => ({ default: m.Contestar })))

/* O cliente pessoa física é a entrada secundária: as telas dele também vêm à parte. */
const FretesCliente = lazy(() => import('./pages/cliente/FretesCliente').then((m) => ({ default: m.FretesCliente })))
const PedirFrete = lazy(() => import('./pages/cliente/PedirFrete').then((m) => ({ default: m.PedirFrete })))

/* As filas do administrador também: só quem é admin baixa esse código. */
const DocumentosAdmin = lazy(() => import('./pages/admin/DocumentosAdmin').then((m) => ({ default: m.DocumentosAdmin })))
const ContestacoesAdmin = lazy(() => import('./pages/admin/ContestacoesAdmin').then((m) => ({ default: m.ContestacoesAdmin })))
const PisoAntt = lazy(() => import('./pages/admin/PisoAntt').then((m) => ({ default: m.PisoAntt })))

function Protegida({ papel, children }: { papel: Papel; children: React.ReactNode }) {
  const { tokens } = useSessao()
  if (!tokens) return <Navigate to="/entrar" replace />
  if (tokens.papel !== papel) return <Navigate to={INICIO[tokens.papel]} replace />
  return children
}

export function App() {
  const { tokens } = useSessao()
  return (
    <Routes>
      <Route path="/" element={tokens ? <Navigate to={INICIO[tokens.papel]} replace /> : <Suspense fallback={null}><Inicio /></Suspense>} />
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/nova-senha" element={<NovaSenha />} />
      <Route path="/privacidade" element={<Suspense fallback={null}><Privacidade /></Suspense>} />
      <Route path="/termos" element={<Suspense fallback={null}><Termos /></Suspense>} />
      <Route path="/contestar" element={<Suspense fallback={null}><Contestar /></Suspense>} />
      <Route path="/motorista" element={<Protegida papel="MOTORISTA"><LayoutMotorista /></Protegida>}>
        <Route index element={<BuscaFretes />} />
        <Route path="meus-fretes" element={<MeusFretes />} />
        <Route path="extrato" element={<Extrato />} />
        <Route path="fretes/:id" element={<FreteMotorista />} />
        <Route path="fretes/:id/entrega" element={<RegistrarEntrega />} />
        <Route path="calculadora" element={<Calculadora />} />
        <Route path="perfil" element={<Perfil />} />
      </Route>
      <Route path="/empresa" element={<Protegida papel="EMPRESA"><LayoutEmpresa /></Protegida>}>
        <Route index element={<FretesEmpresa />} />
        <Route path="fretes/novo" element={<PublicarFrete />} />
        <Route path="fretes/:id" element={<DetalheFrete />} />
        <Route path="fretes/:id/editar" element={<EditarFrete />} />
        <Route path="pagamentos" element={<PagamentosEmpresa />} />
        <Route path="dados" element={<DadosEmpresa />} />
      </Route>
      <Route path="/cliente" element={<Protegida papel="CLIENTE"><LayoutCliente /></Protegida>}>
        <Route index element={<Suspense fallback={null}><FretesCliente /></Suspense>} />
        <Route path="fretes/novo" element={<Suspense fallback={null}><PedirFrete /></Suspense>} />
        <Route path="fretes/:id" element={<DetalheFrete />} />
      </Route>
      <Route path="/admin" element={<Protegida papel="ADMIN"><LayoutAdmin /></Protegida>}>
        <Route index element={<Suspense fallback={null}><DocumentosAdmin /></Suspense>} />
        <Route path="contestacoes" element={<Suspense fallback={null}><ContestacoesAdmin /></Suspense>} />
        <Route path="piso-antt" element={<Suspense fallback={null}><PisoAntt /></Suspense>} />
      </Route>
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  )
}
