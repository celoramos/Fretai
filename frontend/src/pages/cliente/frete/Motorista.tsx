import type { Frete, PerfilMotorista } from '../../../api/tipos'
import { Avatar } from '../../../components/Avatar'
import { CATEGORIAS, contar } from '../../../formato'

/** Nota, fretes e documentos conferidos, como no canvas: "Nota 4,9 · 132 fretes · CNH e CRLV conferidos". */
function reputacao(p: PerfilMotorista | undefined, comDocumentos: boolean) {
  if (!p) return null
  const partes = [p.mediaNotas != null ? `Nota ${p.mediaNotas.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}` : 'Sem nota ainda', contar(p.fretesConcluidos, 'frete', 'fretes')]
  if (comDocumentos && p.documentosVerificados.length) partes.push(`${p.documentosVerificados.join(' e ')} conferidos`)
  return partes.join(' · ')
}

/** Quem vai levar: o nome do motorista e o veículo, com a placa em letra de máquina. */
export function Motorista({ nome, perfil, veiculo, documentos = false }: { nome: string; perfil?: PerfilMotorista; veiculo: Frete['veiculo']; documentos?: boolean }) {
  return (
    <div className="quem">
      <Avatar nome={nome} grande />
      <span className="quem__texto">
        <strong>{nome}</strong>
        {reputacao(perfil, documentos) && <span>{reputacao(perfil, documentos)}</span>}
        {veiculo && <span>{CATEGORIAS[veiculo.categoria].nome.split(' ')[0]}{veiculo.modelo && ` ${veiculo.modelo}`} <span className="placa-mono">{veiculo.placa}</span></span>}
      </span>
    </div>
  )
}

