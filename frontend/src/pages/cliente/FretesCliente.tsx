import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { api } from '../../api/cliente'
import type { Frete, Pagamento, Pagina, Proposta } from '../../api/tipos'
import { ouNulo, useRecurso } from '../../api/useRecurso'
import { Valor } from '../../components/Dinheiro'
import { RotaLinha } from '../../components/RotaLinha'
import { ErroCarga, Esqueleto, StatusFreteEtiqueta, Vazio } from '../../components/ui'
import { dataCurta } from '../../formato'
import { item, lista } from '../../movimento'
import { useSessao } from '../../sessao'
import { useTitulo } from '../../useTitulo'

/** abertas: propostas esperando resposta (null se não deu para contar); semPix: aceito e ainda sem o Pix pago. */
type Linha = { frete: Frete; abertas: number | null; semPix: boolean }
type Passo = { texto: string; aba?: string; seu: boolean }

/** O próximo passo de cada frete, dito para quem pediu. `seu` é o que só anda se o cliente fizer alguma coisa. */
function passo({ frete: f, abertas, semPix }: Linha): Passo {
  switch (f.status) {
    case 'PUBLICADO':
      return { texto: 'Esperando propostas. Motoristas perto da coleta já receberam o aviso.', seu: false }
    case 'PROPOSTA_ENVIADA':
      return { texto: abertas === 1 ? '1 proposta para responder' : abertas ? `${abertas} propostas para responder` : 'Propostas para responder', seu: true }
    case 'ACEITO':
      return semPix
        ? { texto: 'Pague o Pix: o motorista só carrega com o dinheiro garantido', aba: 'pagamento', seu: true }
        : { texto: 'Pix pago. O motorista vai para a coleta.', seu: false }
    case 'EM_TRANSITO':
      return { texto: 'A carga está na estrada.', seu: false }
    case 'ENTREGUE':
      return { texto: 'Confira o canhoto e avalie o motorista', aba: 'entrega', seu: true }
    case 'PAGO':
      return { texto: 'Concluído e pago ao motorista.', seu: false }
    case 'CANCELADO':
      return { texto: f.motivoCancelamento ? `Cancelado: ${f.motivoCancelamento}` : 'Cancelado.', seu: false }
  }
}

/*
 * Os fretes que o cliente pediu, um cartão por frete, com o próximo passo escrito em cada um. Quem pede
 * frete avulso tem um, dois fretes: em vez de um bloco de pendências, o que espera por ele vem primeiro.
 */
export function FretesCliente() {
  useTitulo('Seus fretes')
  const { tokens } = useSessao()
  const clienteId = tokens?.usuarioId ?? ''
  const [estado, recarregar] = useRecurso(async () => {
    const pagina = await api<Pagina<Frete>>('GET', `/api/fretes/cliente/${clienteId}?size=100&sort=criadoEm,desc`)
    return Promise.all(pagina.content.map(async (frete): Promise<Linha> => {
      // Só o que muda o próximo passo é consultado: as propostas de quem tem proposta, o Pix de quem foi aceito.
      const [propostas, pagamento] = await Promise.all([
        frete.status === 'PROPOSTA_ENVIADA' ? ouNulo(api<Proposta[]>('GET', `/api/fretes/${frete.id}/propostas`)) : null,
        frete.status === 'ACEITO' ? ouNulo(api<Pagamento>('GET', `/api/fretes/${frete.id}/pagamento`)) : null,
      ])
      return {
        frete,
        abertas: propostas ? propostas.filter((p) => p.status === 'ENVIADA').length : null,
        semPix: frete.status === 'ACEITO' && (!pagamento || pagamento.status === 'PENDENTE'),
      }
    }))
  }, [clienteId])

  const linhas = estado.fase === 'pronto' ? estado.dados : []
  // O que espera pelo cliente sobe; o resto fica na ordem da API (o mais novo primeiro).
  const ordenadas = [...linhas].sort((a, z) => Number(passo(z).seu) - Number(passo(a).seu))

  return (
    <div className="fretes-c">
      <div className="fretes-e__cabeca">
        <h1 className="titulo-pagina">Seus fretes</h1>
        {linhas.length > 0 && <Link to="/cliente/fretes/novo" className="botao botao--primario">Pedir um frete</Link>}
      </div>
      {estado.fase === 'carregando' && estado.mostrarEsqueleto && <><Esqueleto linhas={4} /><Esqueleto linhas={4} /></>}
      {estado.fase === 'erro' && <ErroCarga problema={estado.problema} tentarDeNovo={recarregar} />}
      {estado.fase === 'pronto' && linhas.length === 0 && (
        <Vazio titulo="Você ainda não pediu nenhum frete." acao={<Link to="/cliente/fretes/novo" className="botao botao--primario">Pedir um frete</Link>}>
          Você diz de onde, para onde e quanto paga. Motoristas perto da coleta recebem o aviso e mandam proposta, e você escolhe com quem fechar.
        </Vazio>
      )}
      {ordenadas.length > 0 && (
        <motion.ul className="lista-cartoes" variants={lista} initial="oculta" animate="visivel">
          {ordenadas.map((l) => <CartaoFrete key={l.frete.id} linha={l} />)}
        </motion.ul>
      )}
    </div>
  )
}

function CartaoFrete({ linha }: { linha: Linha }) {
  const { frete: f } = linha
  const p = passo(linha)
  const valor = f.valorAcordado ?? f.valorTotal ?? f.valor
  return (
    <motion.li variants={item}>
      <article className="card-frete cartao">
        <Link to={`/cliente/fretes/${f.id}${p.aba ? `?aba=${p.aba}` : ''}`} className="card-frete__link">
          <span className="visualmente-oculto">Ver frete de {f.coleta.cidade} para {f.entrega.cidade}</span>
        </Link>
        <p className="fretes-c__topo">
          <StatusFreteEtiqueta status={f.status} visao="contratante" />
          <span className="card-frete__perto">coleta {dataCurta(f.dataColeta)}</span>
        </p>
        <RotaLinha coleta={f.coleta} entrega={f.entrega} distanciaKm={f.distanciaKm} estimada={f.distanciaEstimada} />
        <div className="fretes-c__fim">
          {valor != null && <Valor valor={valor} />}
          {f.descricaoCarga && <span className="card-frete__perto">{f.descricaoCarga}</span>}
        </div>
        <p className={p.seu ? 'fretes-c__passo fretes-c__passo--seu' : 'fretes-c__passo'}>{p.texto}</p>
      </article>
    </motion.li>
  )
}
