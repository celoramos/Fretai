import type { Endereco } from '../api/tipos'
import { quilometros } from '../formato'

/**
 * A assinatura do Fretaí: origem e destino ligados por uma faixa de asfalto com tracejado amarelo,
 * a distância pintada no meio como num marco. Aparece em todo frete, e em nenhum outro lugar.
 */
export function RotaLinha({
  coleta,
  entrega,
  distanciaKm,
  estimada,
  grande = false,
}: {
  coleta: Endereco
  entrega: Endereco
  distanciaKm: number | null
  estimada?: boolean | null
  grande?: boolean
}) {
  return (
    <div className={grande ? 'rota rota--grande' : 'rota'}>
      <Ponta endereco={coleta} lado="origem" />
      <div className="rota__pista" aria-hidden="true">
        {distanciaKm != null && (
          <span className="rota__marco">
            {estimada ? '≈ ' : ''}
            {quilometros(distanciaKm)}
          </span>
        )}
      </div>
      <Ponta endereco={entrega} lado="destino" />
      <span className="visualmente-oculto">
        De {coleta.cidade}/{coleta.uf} para {entrega.cidade}/{entrega.uf}
        {distanciaKm != null ? `, ${estimada ? 'cerca de ' : ''}${quilometros(distanciaKm)}` : ''}
      </span>
    </div>
  )
}

function Ponta({ endereco, lado }: { endereco: Endereco; lado: 'origem' | 'destino' }) {
  return (
    <div className={`rota__ponta rota__ponta--${lado}`} aria-hidden="true">
      <span className="rota__cidade">{endereco.cidade}</span>
      <span className="rota__uf">{endereco.uf}</span>
    </div>
  )
}
