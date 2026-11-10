import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import type { Frete, PerfilEmpresa } from '../api/tipos'
import { exigenciaDoFrete, tituloDoFrete } from '../compatibilidade'
import { contratante, diaDaSemana, faixaDoPeso, quilometros } from '../formato'
import { item } from '../movimento'
import { ChipPiso, Valor } from './Dinheiro'
import { nomeDaPonta } from '../ponta'

/**
 * O frete na busca do motorista, como no canvas: o que é e quanto paga em cima, a rota com o km no meio,
 * o dia e o peso, e embaixo a distância até ele e o veículo que o frete pede. naoLeva: o motivo de nenhum
 * veículo dele levar este frete; o cartão aparece apagado, sem link. referencia: de onde a distância é
 * medida quando não é de onde o motorista está (ex.: o destino de um frete, nas sugestões de volta).
 */
export function CardFrete({ frete, distanciaOrigemKm, perfil, referencia, naoLeva }: {
  frete: Frete; distanciaOrigemKm: number; perfil?: PerfilEmpresa; referencia?: string; naoLeva?: string | null
}) {
  const valor = frete.valorTotal ?? frete.valor
  const pontas = frete.cliente ? 'bairro' : 'cidade'
  const origem = nomeDaPonta(frete.coleta, pontas)
  const destino = nomeDaPonta(frete.entrega, pontas)
  const meta = [diaDaSemana(frete.dataColeta), frete.pesoKg ? faixaDoPeso(frete.pesoKg) : null].filter(Boolean).join(' · ')
  const conteudo = (
    <>
      <div className="card-m__topo">
        <strong className="card-m__titulo">{tituloDoFrete(frete)}</strong>
        {frete.valorACombinar || valor == null ? <span className="card-frete__combinar">A combinar</span> : <Valor valor={valor} tamanho="grande" />}
      </div>
      {naoLeva ? (
        <span className="card-m__meta">{origem} → {destino} · {meta}</span>
      ) : (
        <>
          <span className="card-m__rota">
            <span>{origem}</span>
            {frete.distanciaKm != null && <span className="km">{frete.distanciaEstimada ? '≈ ' : ''}{quilometros(frete.distanciaKm)}</span>}
            <span>{destino}</span>
          </span>
          <span className="card-m__meta">{meta}</span>
        </>
      )}
      {!frete.cliente && (
        <>
          <ChipPiso preco={frete.preco} valor={valor} />
          {frete.preco?.acimaDaMedia && <p className="card-frete__fretao">Valor muito acima da média desta rota. Confira {contratante(frete).quem}.</p>}
          <Reputacao nome={contratante(frete).nome} perfil={perfil} />
        </>
      )}
      {naoLeva ? (
        <span className="card-m__nao-leva">{exigenciaDoFrete(frete)}: {naoLeva}</span>
      ) : (
        <span className="card-m__fim"><span>{perto(distanciaOrigemKm, referencia)}</span><span>{exigenciaDoFrete(frete)}</span></span>
      )}
    </>
  )
  if (naoLeva) {
    return <motion.article className="card-m card-m--apagado" variants={item} aria-label={`${tituloDoFrete(frete)}. Seu veículo não leva este frete.`}>{conteudo}</motion.article>
  }
  return (
    <motion.article className="card-m" variants={item}>
      <Link to={`/motorista/fretes/${frete.id}`} className="card-m__link">{conteudo}</Link>
    </motion.article>
  )
}

/** Menos de 1 km vira "em Santos" ou "a menos de 1 km de você": "a 0 km" não diz nada. */
function perto(km: number, referencia?: string) {
  if (km < 1) return referencia ? `em ${referencia}` : 'a menos de 1 km de você'
  return `a ${quilometros(km)} de ${referencia ?? 'você'}`
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
