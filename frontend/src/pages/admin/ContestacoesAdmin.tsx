import { useId, useState, type FormEvent } from 'react'
import { api, comoProblema } from '../../api/cliente'
import type { Canhoto, Frete, Pagamento, Problema, ResolucaoCanhoto } from '../../api/tipos'
import { ouNulo, useRecurso } from '../../api/useRecurso'
import { EvidenciaCanhoto } from '../../components/EvidenciaCanhoto'
import { Aviso, Campo, ErroCarga, Esqueleto, Placa, Vazio } from '../../components/ui'
import { dataHora, reaisCentavos } from '../../formato'
import { useTitulo } from '../../useTitulo'

type Item = { canhoto: Canhoto; frete: Frete; pagamento: Pagamento | null }

const DECIDIDO: Record<ResolucaoCanhoto, string> = {
  ENTREGA_CONFIRMADA: 'entrega confirmada, o saldo foi liberado para o motorista',
  CONTESTACAO_PROCEDENTE: 'contestação procedente, o saldo continua parado para o acerto',
}

/*
 * Contestações abertas, da mais antiga para a mais nova. Enquanto não há decisão, o saldo do motorista
 * fica parado; a tela põe lado a lado o que foi dito (o motivo) e o que foi registrado na entrega
 * (foto, assinatura, GPS), e a decisão fica no fim, com o dinheiro que ela move escrito no botão.
 */
export function ContestacoesAdmin() {
  useTitulo('Contestações')
  const [estado, recarregar] = useRecurso(async () => {
    const canhotos = await api<Canhoto[]>('GET', '/api/canhotos/contestacoes')
    return Promise.all(canhotos.map(async (canhoto): Promise<Item> => {
      const [frete, pagamento] = await Promise.all([
        api<Frete>('GET', `/api/fretes/${canhoto.freteId}`),
        ouNulo(api<Pagamento>('GET', `/api/fretes/${canhoto.freteId}/pagamento`)),
      ])
      return { canhoto, frete, pagamento }
    }))
  }, [])
  // Decidida, a contestação sai da fila na hora; a frase do que aconteceu fica no topo.
  const [decididas, setDecididas] = useState<{ freteId: string; rota: string; resolucao: ResolucaoCanhoto }[]>([])
  const fila = estado.fase === 'pronto' ? estado.dados.filter((i) => !decididas.some((d) => d.freteId === i.frete.id)) : []

  return (
    <div className="fila">
      <header className="fila__cabeca">
        <h1 className="titulo-pagina">Contestações</h1>
        <p className="detalhe">Entregas contestadas esperando decisão, da mais antiga para a mais nova. Até a decisão, o saldo do motorista fica parado.</p>
      </header>
      <div className="perfil__estado" aria-live="polite">
        {decididas.map((d) => <p key={d.freteId} className="perfil__ok">{d.rota}: {DECIDIDO[d.resolucao]}.</p>)}
      </div>
      {estado.fase === 'carregando' && estado.mostrarEsqueleto && <><Esqueleto linhas={3} /><Esqueleto linhas={6} /></>}
      {estado.fase === 'erro' && <ErroCarga problema={estado.problema} tentarDeNovo={recarregar} />}
      {estado.fase === 'pronto' && fila.length === 0 && (
        <Vazio titulo="Nenhuma contestação esperando decisão.">Quando quem recebeu a carga ou a empresa contestar uma entrega, ela entra aqui.</Vazio>
      )}
      {fila.length > 0 && (
        <ul className="fila__lista">
          {fila.map((item) => (
            <Contestacao key={item.canhoto.id} item={item} aoRecarregar={recarregar}
              aoDecidir={(resolucao) => setDecididas((d) => [...d, { freteId: item.frete.id, rota: rotaDe(item.frete), resolucao }])} />
          ))}
        </ul>
      )}
    </div>
  )
}

const rotaDe = (f: Frete) => `${f.coleta.cidade} → ${f.entrega.cidade}`

function Contestacao({ item, aoRecarregar, aoDecidir }: { item: Item; aoRecarregar: () => void; aoDecidir: (r: ResolucaoCanhoto) => void }) {
  const { canhoto, frete, pagamento } = item
  const id = useId()
  const [decisao, setDecisao] = useState<ResolucaoCanhoto | null>(null)
  const [observacao, setObservacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(null)
  const contratante = frete.empresa?.nomeFantasia ?? frete.empresa?.razaoSocial ?? frete.cliente?.nome ?? 'Contratante'
  const saldo = pagamento ? `R$ ${reaisCentavos(pagamento.valorSaldo)}` : 'o saldo'

  async function decidir(e: FormEvent) {
    e.preventDefault()
    setProblema(null)
    if (!decisao) {
      setProblema({ title: '', detail: '', status: 400, erros: { resolucao: 'Escolha uma das duas decisões.' } })
      requestAnimationFrame(() => document.getElementById(`${id}-confirmada`)?.focus())
      return
    }
    setEnviando(true)
    try {
      await api('POST', `/api/fretes/${frete.id}/canhoto/resolucao`, { resolucao: decisao, observacao: observacao.trim() || null })
      aoDecidir(decisao)
    } catch (falha) {
      setProblema(comoProblema(falha))
      setEnviando(false)
    }
  }

  const erroDecisao = problema?.erros?.resolucao
  return (
    <li className="contestacao">
      <section className="cartao contestacao__cabeca" aria-labelledby={`${id}-rota`}>
        <h2 id={`${id}-rota`} className="contestacao__rota">{rotaDe(frete)}</h2>
        <p className="contestacao__partes">
          <span>{contratante}</span>
          {frete.motorista && <span>motorista {frete.motorista.nome}{frete.motorista.placa && <> <Placa placa={frete.motorista.placa} /></>}</span>}
          <span>entregue {dataHora(canhoto.registradoEm)}</span>
        </p>
        <figure className="contestacao__motivo">
          <figcaption className="bloco__titulo">Motivo da contestação</figcaption>
          <blockquote>{canhoto.motivoContestacao ? `“${canhoto.motivoContestacao}”` : 'Sem motivo escrito.'}</blockquote>
        </figure>
        {pagamento && <p className="contestacao__saldo">Saldo parado: R$&nbsp;{reaisCentavos(pagamento.valorSaldo)}</p>}
      </section>

      <EvidenciaCanhoto canhoto={canhoto} aoRecarregar={aoRecarregar}>
        <form className="contestacao__decisao" onSubmit={decidir} noValidate>
          <fieldset className="contestacao__opcoes" aria-describedby={erroDecisao ? `${id}-decisao-erro` : undefined}>
            <legend className="campo__rotulo">Decisão</legend>
            <label className="opcao">
              <input id={`${id}-confirmada`} type="radio" name={`${id}-decisao`} checked={decisao === 'ENTREGA_CONFIRMADA'}
                onChange={() => setDecisao('ENTREGA_CONFIRMADA')} aria-invalid={erroDecisao ? true : undefined} />
              <span>Entrega confirmada: {saldo} vai para o motorista.</span>
            </label>
            <label className="opcao">
              <input type="radio" name={`${id}-decisao`} checked={decisao === 'CONTESTACAO_PROCEDENTE'}
                onChange={() => setDecisao('CONTESTACAO_PROCEDENTE')} aria-invalid={erroDecisao ? true : undefined} />
              <span>Contestação procede: {saldo} continua parado para o acerto entre as partes, fora do Fretaí.</span>
            </label>
            {erroDecisao && <p id={`${id}-decisao-erro`} className="campo__erro">{erroDecisao}</p>}
          </fieldset>
          <Campo id={`${id}-obs`} rotulo="O que pesou na decisão (opcional)" ajuda="Fica registrado junto com a decisão.">
            <textarea id={`${id}-obs`} className="campo__entrada campo__entrada--texto" rows={3} maxLength={500} value={observacao}
              onChange={(e) => setObservacao(e.target.value)} aria-describedby={`${id}-obs-ajuda`} />
          </Campo>
          {problema && !problema.erros && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}
          <div className="contestacao__fim">
            <button type="submit" className="botao botao--primario" disabled={enviando}>
              {enviando ? 'Registrando…' : decisao === 'ENTREGA_CONFIRMADA' ? 'Liberar o saldo' : decisao === 'CONTESTACAO_PROCEDENTE' ? 'Manter o saldo parado' : 'Registrar decisão'}
            </button>
            <p className="detalhe">A decisão não tem volta por aqui.</p>
          </div>
        </form>
      </EvidenciaCanhoto>
    </li>
  )
}
