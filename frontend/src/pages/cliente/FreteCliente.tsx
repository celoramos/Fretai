import { useParams } from 'react-router-dom'
import { api } from '../../api/cliente'
import type { EventoFrete, Frete, Pagamento } from '../../api/tipos'
import { ouNulo, useRecurso } from '../../api/useRecurso'
import { ErroCarga, Esqueleto } from '../../components/ui'
import { useTitulo } from '../../useTitulo'
import { DetalheFrete } from '../contratante/DetalheFrete'
import { AntesDoPix } from './frete/AntesDoPix'
import { pixPago, type DadosFrete } from './frete/dados'

/*
 * O frete do cliente pessoa física. Antes do Pix (procurando motorista, propostas, aceito sem pagar ou
 * cancelado antes de pagar) é a tela de fechar com um motorista; depois, a de acompanhar a entrega.
 */
export function FreteCliente() {
  const { id = '' } = useParams()
  const [estado, recarregar] = useRecurso(async (): Promise<DadosFrete> => {
    const [frete, pagamento, eventos] = await Promise.all([
      api<Frete>('GET', `/api/fretes/${id}`),
      ouNulo(api<Pagamento>('GET', `/api/fretes/${id}/pagamento`)),
      api<EventoFrete[]>('GET', `/api/fretes/${id}/eventos`),
    ])
    return { frete, pagamento, eventos }
  }, [id])
  useTitulo('Seu pedido')

  if (estado.fase === 'carregando') return <div className="frete-c">{estado.mostrarEsqueleto && <><Esqueleto linhas={4} /><Esqueleto linhas={6} /></>}</div>
  if (estado.fase === 'erro') return <div className="frete-c"><ErroCarga problema={estado.problema} tentarDeNovo={recarregar} /></div>

  const { frete, pagamento } = estado.dados
  const antes = ['PUBLICADO', 'PROPOSTA_ENVIADA'].includes(frete.status)
    || (frete.status === 'ACEITO' && !pixPago(pagamento))
    || (frete.status === 'CANCELADO' && !pixPago(pagamento))
  if (antes) return <AntesDoPix dados={estado.dados} recarregar={recarregar} />
  // Depois do Pix: a tela de acompanhar (tarefa 15). Até ela existir, o detalhe de hoje.
  return <DetalheFrete />
}
