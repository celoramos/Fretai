import { useId, useState, type ReactNode } from 'react'
import type { Canhoto } from '../api/tipos'
import { dataHora } from '../formato'

/*
 * A prova da entrega: a foto, quem recebeu, quando, onde o GPS estava e a assinatura. A empresa vê no
 * detalhe do frete; o administrador vê para decidir uma contestação. O que cada um faz com ela vem em
 * children, no fim do cartão dos dados. Os ids dos títulos saem de useId: o admin mostra várias por página.
 */
export function EvidenciaCanhoto({ canhoto, aoRecarregar, children }: { canhoto: Canhoto; aoRecarregar: () => void; children?: ReactNode }) {
  const id = useId()
  // Os links das imagens vencem em minutos: se a imagem não abrir, a tela pede links novos à API.
  const [imagemFalhou, setImagemFalhou] = useState(false)

  return (
    <div className="canhoto">
      <section className="cartao canhoto__foto" aria-labelledby={`${id}-foto`}>
        <h2 id={`${id}-foto`} className="bloco__titulo">Foto da entrega</h2>
        {canhoto.fotoUrl && !imagemFalhou ? (
          <img src={canhoto.fotoUrl} alt={`Foto da carga entregue, recebida por ${canhoto.nomeRecebedor}`} className="canhoto__imagem"
            width={1600} height={1200} onError={() => setImagemFalhou(true)} />
        ) : (
          <div className="canhoto__sem-imagem">
            <p>O link da foto venceu.</p>
            <button type="button" className="botao botao--secundario" onClick={() => { setImagemFalhou(false); aoRecarregar() }}>Abrir de novo</button>
          </div>
        )}
      </section>

      <section className="cartao canhoto__dados" aria-labelledby={`${id}-dados`}>
        <h2 id={`${id}-dados`} className="bloco__titulo">Canhoto</h2>
        <dl className="ficha">
          <div><dt>Recebido por</dt><dd>{canhoto.nomeRecebedor}</dd></div>
          <div><dt>Quando</dt><dd>{dataHora(canhoto.registradoEm)}</dd></div>
          <div>
            <dt>Local</dt>
            <dd>
              {canhoto.localConferido && canhoto.distanciaDestinoKm != null
                ? `A ${Math.round(canhoto.distanciaDestinoKm * 1000)} m do endereço de entrega`
                : 'Não conferido: o endereço de entrega não tinha coordenadas'}
            </dd>
          </div>
        </dl>
        {canhoto.assinaturaUrl && !imagemFalhou && (
          <figure className="canhoto__assinatura">
            <img src={canhoto.assinaturaUrl} alt={`Assinatura de ${canhoto.nomeRecebedor}`} width={400} height={180} onError={() => setImagemFalhou(true)} />
            <figcaption className="detalhe">Assinatura de quem recebeu</figcaption>
          </figure>
        )}
        {children}
      </section>
    </div>
  )
}
