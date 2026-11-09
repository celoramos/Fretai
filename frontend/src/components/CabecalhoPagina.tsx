import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MarcaSimbolo } from './Marca'

/**
 * O topo de cada tela, como no canvas: no celular, voltar (ou a marca, nas telas de primeiro nível) ao
 * lado do título; no computador, a barra de cima já tem a marca e o título vira o h1 grande da página.
 * children: o que fica na mesma linha do título (subtítulo, filtros).
 */
export function CabecalhoPagina({ titulo, voltar, rotuloVoltar = 'Voltar', children }: { titulo: ReactNode; voltar?: string; rotuloVoltar?: string; children?: ReactNode }) {
  return (
    <header className="cabecalho-pagina">
      {voltar ? (
        <Link to={voltar} className="cabecalho-pagina__voltar" aria-label={rotuloVoltar}>
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      ) : (
        <span className="cabecalho-pagina__marca"><MarcaSimbolo /></span>
      )}
      <h1 className="cabecalho-pagina__titulo">{titulo}</h1>
      {children}
    </header>
  )
}
