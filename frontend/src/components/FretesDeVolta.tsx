import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '../api/cliente'
import type { Frete, FreteEncontrado, Pagina } from '../api/tipos'
import { useRecurso } from '../api/useRecurso'
import { lista } from '../movimento'
import { CardFrete } from './CardFrete'
import { ErroCarga, Esqueleto } from './ui'

/** No máximo três: é uma sugestão no meio do detalhe, não a busca inteira. */
const QUANTOS = 3

/*
 * "Para não voltar vazio": fretes que saem perto do destino deste (a API usa 150 km, retorno.raio-km)
 * e servem no caminhão do motorista. Aparece quando ele já está indo ou chegou, que é quando pensa na volta.
 */
export function FretesDeVolta({ frete }: { frete: Frete }) {
  const [estado, recarregar] = useRecurso(
    () => api<Pagina<FreteEncontrado>>('GET', `/api/fretes/${frete.id}/retorno?size=${QUANTOS}`),
    [frete.id],
  )
  const secao = useRef<HTMLElement>(null)
  const { hash } = useLocation()

  // Vindo de "Procurar frete para voltar" (fim do canhoto), a tela desce até aqui quando a lista chega.
  // Espera 400 ms: a avaliação, acima, chega quase junto e empurraria a seção para baixo do ponto rolado.
  useEffect(() => {
    if (hash !== '#volta' || estado.fase !== 'pronto') return
    const t = setTimeout(() => secao.current?.scrollIntoView({ block: 'start' }), 400)
    return () => clearTimeout(t)
  }, [hash, estado.fase])

  return (
    <section ref={secao} id="volta" className="volta" aria-labelledby="volta-titulo">
      <h2 id="volta-titulo" className="volta__titulo">Para não voltar vazio</h2>
      <p className="detalhe">Fretes saindo perto de {frete.entrega.cidade}, que servem no seu caminhão.</p>
      {estado.fase === 'carregando' && estado.mostrarEsqueleto && <Esqueleto linhas={4} />}
      {estado.fase === 'erro' && <ErroCarga problema={estado.problema} tentarDeNovo={recarregar} />}
      {estado.fase === 'pronto' && estado.dados.content.length === 0 && (
        <div className="volta__vazio">
          <p>Nenhum frete saindo perto de {frete.entrega.cidade} agora.</p>
          <Link to="/motorista" className="botao botao--secundario">Procurar em outro raio</Link>
        </div>
      )}
      {estado.fase === 'pronto' && estado.dados.content.length > 0 && (
        <motion.div className="lista-cards" variants={lista} initial="oculta" animate="visivel">
          {estado.dados.content.slice(0, QUANTOS).map((a) => (
            <CardFrete key={a.frete.id} frete={a.frete} distanciaOrigemKm={a.distanciaOrigemKm} referencia={frete.entrega.cidade} />
          ))}
        </motion.div>
      )}
    </section>
  )
}
