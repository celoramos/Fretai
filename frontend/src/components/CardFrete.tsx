import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import type { Frete, PerfilEmpresa } from '../api/tipos'
import { dataCurta, porKm, quilometros, veiculo } from '../formato'
import { ChipPiso, Valor } from './Dinheiro'
import { RotaLinha } from './RotaLinha'
import { item } from '../movimento'

/** Em 2 segundos: de onde, para onde, quanto, e se a empresa é séria. */
export function CardFrete({ frete, distanciaOrigemKm, perfil }: { frete: Frete; distanciaOrigemKm: number; perfil?: PerfilEmpresa }) {
  const valor = frete.valorTotal ?? frete.valor
  return (
    <motion.article className="card-frete cartao" variants={item}>
      <Link to={`/motorista/fretes/${frete.id}`} className="card-frete__link">
        <span className="visualmente-oculto">Ver frete de {frete.coleta.cidade} para {frete.entrega.cidade}</span>
      </Link>
      <p className="card-frete__perto">a {quilometros(distanciaOrigemKm)} de você · coleta {dataCurta(frete.dataColeta)}</p>
      <RotaLinha coleta={frete.coleta} entrega={frete.entrega} distanciaKm={frete.distanciaKm} estimada={frete.distanciaEstimada} />

      <div className="card-frete__dinheiro">
        {frete.valorACombinar || valor == null ? (
          <span className="card-frete__combinar">A combinar</span>
        ) : (
          <>
            <Valor valor={valor} tamanho="grande" />
            {frete.distanciaKm ? <span className="card-frete__porkm">R$&nbsp;{porKm(valor, frete.distanciaKm)}/km</span> : null}
          </>
        )}
        <ChipPiso preco={frete.preco} valor={valor} />
      </div>

      {frete.preco?.acimaDaMedia && (
        <p className="card-frete__fretao">Valor muito acima da média desta rota. Confira a empresa.</p>
      )}

      <ul className="card-frete__requisitos" aria-label="Requisitos">
        <li>{frete.veiculosAceitos.map(veiculo).join(', ')}</li>
        {frete.exigeRastreador && <li>Rastreador</li>}
        {frete.complemento && <li>Complemento</li>}
        {frete.publicadoPorAgenciador && <li className="card-frete__agenciador">Agenciador</li>}
        {frete.feriado && <li>Feriado{frete.nomeFeriado ? `: ${frete.nomeFeriado}` : ''}</li>}
      </ul>

      <Reputacao nome={frete.empresa?.nomeFantasia ?? frete.empresa?.razaoSocial ?? frete.cliente?.nome ?? 'Cliente'} perfil={perfil} />
    </motion.article>
  )
}

export function Reputacao({ nome, perfil }: { nome: string; perfil?: PerfilEmpresa }) {
  const emDia = perfil?.percentualSaldosPagosEmDia
  return (
    <p className="reputacao">
      <span className="reputacao__nome">{nome}</span>
      {perfil && (
        <>
          <span>{perfil.mediaNotas != null ? `★ ${perfil.mediaNotas.toFixed(1).replace('.', ',')}` : 'Sem avaliações'}</span>
          <span className={emDia != null && emDia < 85 ? 'reputacao__emdia reputacao__emdia--baixo' : 'reputacao__emdia'}>
            {emDia != null ? `${Math.round(emDia)}% dos saldos pagos em dia` : 'Sem histórico de pagamento'}
          </span>
        </>
      )}
    </p>
  )
}
