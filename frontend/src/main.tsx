import '@fontsource/barlow/400.css'
import '@fontsource/barlow/500.css'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow-semi-condensed/600.css'
import '@fontsource/barlow-semi-condensed/700.css'
import '@fontsource/jetbrains-mono/500.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/componentes.css'
import './styles/telas.css'

import { StrictMode } from 'react'
import { MotionConfig } from 'motion/react'
import { transicao } from './movimento'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { App } from './App'
import { ProvedorSessao } from './sessao'

// Data router por um motivo só: useBlocker (components/SairSemSalvar.tsx) não existe no BrowserRouter.
// As rotas continuam declaradas em <Routes> dentro do App, abaixo desta rota curinga.
const roteador = createBrowserRouter([{ path: '*', element: <App /> }])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProvedorSessao>
      {/* reducedMotion="user": com movimento reduzido no sistema, o Motion corta deslocamento e escala e mantém só opacidade. */}
      <MotionConfig reducedMotion="user" transition={transicao}>
        <RouterProvider router={roteador} />
      </MotionConfig>
    </ProvedorSessao>
  </StrictMode>,
)
