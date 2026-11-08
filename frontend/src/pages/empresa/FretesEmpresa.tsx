import { AnimatePresence, motion } from 'motion/react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../api/cliente'
import type { Frete, Pagamento, Pagina, StatusFrete } from '../../api/tipos'
import { useRecurso } from '../../api/useRecurso'
import { useTitulo } from '../../useTitulo'
import { ErroCarga, Esqueleto, Indicador, Km, Placa, StatusFreteEtiqueta, Vazio } from '../../components/ui'
import { dataCurta, reais } from '../../formato'
import { useSessao } from '../../sessao'
import { transicao } from '../../movimento'

/** Filtros agrupam o que pede a mesma atitude de quem está no escritório. */
const FILTROS: { id: string; rotulo: string; status: StatusFrete[] | null }[] = [
  { id: 'todos', rotulo: 'Todos', status: null },
  { id: 'abertos', rotulo: 'Recebendo propostas', status: ['PUBLICADO', 'PROPOSTA_ENVIADA'] },
  { id: 'estrada', rotulo: 'Na estrada', status: ['ACEITO', 'EM_TRANSITO'] },
  { id: 'fechados', rotulo: 'Entregues e pagos', status: ['ENTREGUE', 'PAGO'] },
  { id: 'cancelados', rotulo: 'Cancelados', status: ['CANCELADO'] },
]

export function FretesEmpresa() {
  useTitulo('Fretes da empresa')
  const { tokens } = useSessao()
  const [params, setParams] = useSearchParams()
  const filtro = FILTROS.find((f) => f.id === params.get('filtro')) ?? FILTROS[0]

  const [estado, recarregar] = useRecurso(async () => {
    const pagina = await api<Pagina<Frete>>('GET', `/api/fretes/empresa/${tokens?.empresaId}?size=100&sort=criadoEm,desc`)
    // Frete aceito pode estar esperando o Pix da empresa: só para esses a cobrança é consultada.
    const aceitos = pagina.content.filter((f) => f.status === 'ACEITO')
    const cobrancas = await Promise.all(aceitos.map((f) => api<Pagamento>('GET', `/api/fretes/${f.id}/pagamento`).catch(() => null)))
    const semPix = new Set(aceitos.filter((_, i) => !cobrancas[i] || cobrancas[i]!.status === 'PENDENTE').map((f) => f.id))
    return { fretes: pagina.content, semPix }
  }, [tokens?.empresaId])

  const todos = estado.fase === 'pronto' ? estado.dados.fretes : []
  const visiveis = filtro.status ? todos.filter((f) => filtro.status!.includes(f.status)) : todos
  const contagem = (st: StatusFrete[] | null) => (st ? todos.filter((f) => st.includes(f.status)).length : todos.length)

  return (
    <div className="fretes-e">
      <div className="fretes-e__cabeca">
        <h1 className="titulo-pagina">Fretes</h1>
        <Link to="/empresa/fretes/novo" className="botao botao--primario">Publicar frete</Link>
      </div>

      {estado.fase === 'pronto' && <PrecisaDeVoce fretes={todos} semPix={estado.dados.semPix} />}

      <div className="filtros" role="group" aria-label="Filtrar por situação">
        {FILTROS.map((f) => (
          <button key={f.id} type="button" className="filtro" aria-pressed={filtro.id === f.id}
            onClick={() => setParams(f.id === 'todos' ? {} : { filtro: f.id })}>
            {filtro.id === f.id && <Indicador id="filtro" forma="fundo" />}
            {f.rotulo}
            {estado.fase === 'pronto' && <span className="filtro__n">{contagem(f.status)}</span>}
          </button>
        ))}
      </div>

      {estado.fase === 'carregando' && (estado.mostrarEsqueleto ? <Esqueleto linhas={6} /> : <div className="reserva-tabela" />)}
      {estado.fase === 'erro' && <ErroCarga problema={estado.problema} tentarDeNovo={recarregar} />}
      {estado.fase === 'pronto' && todos.length === 0 && (
        <Vazio titulo="Nenhum frete publicado ainda." acao={<Link to="/empresa/fretes/novo" className="botao botao--primario">Publicar o primeiro frete</Link>}>
          Os fretes que a empresa publicar aparecem aqui, com as propostas dos motoristas.
        </Vazio>
      )}
      {estado.fase === 'pronto' && todos.length > 0 && visiveis.length === 0 && (
        <Vazio titulo={`Nada em “${filtro.rotulo}”.`} acao={<button type="button" className="botao botao--secundario" onClick={() => setParams({})}>Ver todos</button>} />
      )}
      {visiveis.length > 0 && (
        <div className="tabela-rolagem cartao">
          <table className="tabela">
            <thead>
              <tr>
                <th scope="col">Rota</th>
                <th scope="col">Coleta</th>
                <th scope="col" className="tabela__num">Valor</th>
                <th scope="col">Situação</th>
                <th scope="col">Motorista</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
              {visiveis.map((f) => {
                const valor = f.valorAcordado ?? f.valorTotal ?? f.valor
                return (
                  <motion.tr key={f.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transicao}>
                    <td>
                      <div className="tabela__rota-cel">
                        <Link to={`/empresa/fretes/${f.id}`} className="tabela__rota">
                          {f.coleta.cidade}/{f.coleta.uf} → {f.entrega.cidade}/{f.entrega.uf}
                        </Link>
                        {f.distanciaKm != null && <Km km={f.distanciaKm} />}
                      </div>
                    </td>
                    <td className="tabela__data">{dataCurta(f.dataColeta)}</td>
                    <td className="tabela__num">{valor != null && !(f.valorACombinar && !f.valorAcordado) ? `R$ ${reais(valor)}` : 'A combinar'}</td>
                    <td><StatusFreteEtiqueta status={f.status} visao="empresa" /></td>
                    <td>{f.motorista ? <span className="tabela__motorista">{f.motorista.nome}{f.motorista.placa && <Placa placa={f.motorista.placa} />}</span> : <span className="tabela__sub">—</span>}</td>
                  </motion.tr>
                )
              })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

type Pendencia = { chave: string; para: string; acao: string; rota: string; por: string }

/**
 * O que está parado esperando a empresa, do mais urgente para o menos: Pix (o motorista não carrega sem
 * ele), propostas (o motorista espera resposta) e entregas para conferir (o prazo de contestar corre).
 * Cada linha leva direto à aba que resolve. Sem pendência, o bloco não aparece.
 */
function PrecisaDeVoce({ fretes, semPix }: { fretes: Frete[]; semPix: Set<string> }) {
  const rota = (f: Frete) => `${f.coleta.cidade} → ${f.entrega.cidade}`
  const pendencias: Pendencia[] = [
    ...fretes.filter((f) => semPix.has(f.id)).map((f) => ({
      chave: `pix-${f.id}`, para: `/empresa/fretes/${f.id}?aba=pagamento`, acao: 'Pagar o Pix', rota: rota(f), por: 'O motorista só carrega com o pagamento garantido.',
    })),
    ...fretes.filter((f) => f.status === 'PROPOSTA_ENVIADA').map((f) => ({
      chave: `prop-${f.id}`, para: `/empresa/fretes/${f.id}`, acao: 'Responder propostas', rota: rota(f), por: 'Motoristas esperando resposta.',
    })),
    ...fretes.filter((f) => f.status === 'ENTREGUE').map((f) => ({
      chave: `ent-${f.id}`, para: `/empresa/fretes/${f.id}?aba=entrega`, acao: 'Conferir a entrega', rota: rota(f), por: 'Dá para contestar só até o fim do prazo.',
    })),
  ]
  if (pendencias.length === 0) return null
  return (
    <section className="cartao precisa" aria-labelledby="precisa-titulo">
      <h2 id="precisa-titulo" className="bloco__titulo">Precisa de você <span className="abas__n">{pendencias.length}</span></h2>
      <ul className="precisa__lista">
        {pendencias.map((p) => (
          <li key={p.chave}>
            <Link to={p.para} className="precisa__item">
              <span className="precisa__acao">{p.acao}</span>
              <span className="precisa__rota">{p.rota}</span>
              <span className="precisa__por">{p.por}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
