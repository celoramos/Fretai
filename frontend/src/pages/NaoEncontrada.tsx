import { Link } from 'react-router-dom'
import { useTitulo } from '../useTitulo'
import { Vazio } from '../components/ui'

export function NaoEncontrada() {
  useTitulo('Página não encontrada')
  return (
    <main className="pagina-solta">
      <h1 className="visualmente-oculto">Página não encontrada</h1>
      <Vazio titulo="Página não encontrada." acao={<Link className="botao botao--primario" to="/">Voltar ao início</Link>}>
        O endereço pode ter mudado ou o frete foi removido.
      </Vazio>
    </main>
  )
}
