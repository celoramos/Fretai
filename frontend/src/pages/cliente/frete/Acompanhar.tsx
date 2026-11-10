import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, comoProblema } from '../../../api/cliente'
import type { Canhoto, Contato, PerfilMotorista } from '../../../api/tipos'
import { ouNulo, useRecurso } from '../../../api/useRecurso'
import { Avaliar } from '../../../components/Avaliar'
import { CabecalhoPagina } from '../../../components/CabecalhoPagina'
import { CancelarComMotivo } from '../../../components/CancelarComMotivo'
import { EvidenciaCanhoto } from '../../../components/EvidenciaCanhoto'
import { RotaLinha } from '../../../components/RotaLinha'
import { Aviso, Marcos } from '../../../components/ui'
import { dataHora, diaDaSemana, diaMes, reais } from '../../../formato'
import { useComputador } from '../../../largura'
import { linkWhatsApp } from '../../../whatsapp'
import type { DadosFrete } from './dados'
import { Motorista } from './Motorista'

const MOTIVOS = ['Não preciso mais do frete', 'Vou mudar a data', 'Achei outro jeito de levar']
const primeiro = (nome: string) => nome.split(' ')[0]
const brl = (v: number) => `R$ ${reais(v)}`

/** O que cada etapa diz no alto da tela: o rótulo pequeno, o título e a linha de baixo. */
function cabecalho(d: DadosFrete, nome: string) {
  const { frete: f, pagamento } = d
  const valor = pagamento?.valorTotal ?? f.valorAcordado ?? f.valor
  switch (f.status) {
    case 'ACEITO':
      return { rotulo: 'Fechado com o motorista', tom: 'info', titulo: `${nome} vai à coleta ${diaDaSemana(f.dataColeta)}`, texto: 'O Pix está guardado. Ele já sabe o endereço e o que vai no veículo.' }
    case 'EM_TRANSITO':
      return { rotulo: 'Carga na estrada', tom: 'info', titulo: 'Sua carga está a caminho', texto: `${nome} saiu para a entrega. Você recebe um aviso quando ele chegar.` }
    case 'ENTREGUE':
      return { rotulo: 'Entregue', tom: 'info', titulo: 'Chegou! Confira o canhoto', texto: `${nome} registrou a entrega com foto, assinatura e GPS.` }
    case 'PAGO':
      return { rotulo: 'Pago ao motorista', tom: 'garantido', titulo: 'Frete concluído', texto: valor != null ? `Os ${brl(valor)} foram para ${nome} depois da entrega confirmada.` : `O pagamento foi para ${nome}.` }
    default:
      return { rotulo: 'Frete cancelado', tom: 'neutro', titulo: valor != null ? `O Pix de ${brl(valor)} volta para você` : 'O Pix volta para você', texto: f.motivoCancelamento ? `Motivo: ${f.motivoCancelamento}` : 'O motorista foi avisado.' }
  }
}

/*
 * O frete depois do Pix, etapa por etapa: fechado, na estrada, entregue (com o canhoto e a contestação)
 * e pago (com a nota). O WhatsApp do motorista fica no lugar da conversa do canvas, e cancelar só existe
 * antes de a carga sair, com o Pix de volta.
 */
export function Acompanhar({ dados, recarregar }: { dados: DadosFrete; recarregar: () => void }) {
  const computador = useComputador()
  const { frete, pagamento, eventos } = dados
  const quem = frete.motorista
  const nome = quem ? primeiro(quem.nome) : 'O motorista'
  const ativo = ['ACEITO', 'EM_TRANSITO', 'ENTREGUE'].includes(frete.status)
  const [cancelarAberto, setCancelarAberto] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [erroCancelar, setErroCancelar] = useState<string | null>(null)

  const [perfil] = useRecurso(() => (quem ? ouNulo(api<PerfilMotorista>('GET', `/api/motoristas/${quem.id}/perfil`)) : Promise.resolve(null)), [quem?.id])
  const [contato] = useRecurso(() => (ativo ? ouNulo(api<Contato>('GET', `/api/fretes/${frete.id}/contato`)) : Promise.resolve(null)), [frete.id, ativo])

  async function cancelar(motivo: string) {
    setCancelando(true)
    setErroCancelar(null)
    try {
      await api('POST', `/api/fretes/${frete.id}/cancelamento`, { motivo })
      setCancelarAberto(false)
      recarregar()
    } catch (falha) {
      setErroCancelar(comoProblema(falha).detail)
      setCancelando(false)
    }
  }

  const c = cabecalho(dados, nome)
  const valor = pagamento?.valorTotal ?? frete.valorAcordado ?? frete.valor
  const zap = contato.fase === 'pronto' && contato.dados ? contato.dados : null

  return (
    <div className="frete-c">
      {computador ? (
        <div className="pedido__topo">
          <Link to="/cliente" className="voltar">Meus fretes</Link>
          <h1 className="titulo-pagina">Seu frete</h1>
        </div>
      ) : <CabecalhoPagina titulo="Seu frete" voltar="/cliente" />}

      <div className="frete-c__colunas">
        <div className="frete-c__principal">
          <section className="frete-c__cartao" aria-labelledby="t-status">
            <span className={`frete-c__estado frete-c__estado--${c.tom}`}><span className="andamento__ponto" aria-hidden="true" />{c.rotulo}</span>
            <h2 id="t-status">{c.titulo}</h2>
            <p className="frete-c__texto">{c.texto}</p>
            {frete.status === 'CANCELADO' ? (
              <div className="frete-c__acoes">
                <Link to="/cliente/fretes/novo" className="botao botao--primario">Fazer outro pedido</Link>
                <Link to="/cliente" className="botao botao--secundario">Voltar ao início</Link>
              </div>
            ) : (
              <Marcos status={frete.status} eventos={eventos} visao="contratante" orientacao={computador ? 'horizontal' : 'vertical'} />
            )}
          </section>

          {frete.status === 'ENTREGUE' && <CanhotoDoCliente freteId={frete.id} nome={nome} />}

          {frete.status === 'ENTREGUE' && frete.nomeDestinatario && (
            <section className="frete-c__cartao" aria-labelledby="t-codigo">
              <h2 id="t-codigo">Código de quem recebe</h2>
              <p className="frete-c__texto">Mandamos por mensagem para {frete.nomeDestinatario}, que recebe, um código de 8 letras e números. Se algo chegar errado, essa pessoa usa o código para contestar em até 24 h, mesmo sem conta no Fretaí.</p>
            </section>
          )}

          {frete.status === 'PAGO' && quem && (
            <section className="frete-c__cartao" aria-labelledby="t-avaliar">
              <h2 id="t-avaliar">Como foi com {nome}?</h2>
              <Avaliar freteId={frete.id} lado="CONTRATANTE" nomeAvaliado={quem.nome} perguntaNoTitulo />
            </section>
          )}
        </div>

        {frete.status !== 'CANCELADO' && (
          <aside className="frete-c__resumo" aria-label="Motorista e rota">
            {quem && <Motorista nome={quem.nome} perfil={perfil.fase === 'pronto' ? perfil.dados ?? undefined : undefined} veiculo={frete.veiculo} />}
            <RotaLinha coleta={frete.coleta} entrega={frete.entrega} distanciaKm={frete.distanciaKm} estimada={frete.distanciaEstimada} pontas="bairro-cidade" empilhada />
            {valor != null && (
              <p className="frete-c__dinheiro">
                <strong>{frete.status === 'PAGO' ? `${brl(valor)} pagos` : `${brl(valor)} guardado`}</strong>
                <span>{frete.status === 'PAGO' ? (frete.pagoEm ? `em ${diaMes(frete.pagoEm)}` : '') : 'sai depois da entrega'}</span>
              </p>
            )}
            {ativo && (
              <div className="frete-c__zap">
                {zap ? (
                  <a className="botao botao--secundario botao--largo" href={linkWhatsApp(zap.telefone)} target="_blank" rel="noreferrer">Chamar {nome} no WhatsApp</a>
                ) : contato.fase === 'carregando' ? null : (
                  <p className="frete-c__texto--menor">O contato do motorista não está disponível agora.</p>
                )}
                <p className="frete-c__texto--menor">Pagamento e comprovantes ficam no Fretaí, fora do WhatsApp. Não combine pagamento por fora.</p>
              </div>
            )}
            {frete.status === 'ACEITO' && (
              <div className="frete-c__cancelar-bloco">
                <button type="button" className="botao botao--fantasma frete-c__cancelar" aria-haspopup="dialog" onClick={() => setCancelarAberto(true)}>Cancelar frete</button>
                <span className="frete-c__texto--menor">Antes da saída, o Pix volta para você.</span>
              </div>
            )}
          </aside>
        )}
      </div>

      <CancelarComMotivo
        aberta={cancelarAberto}
        titulo={`Cancelar o frete com ${nome}?`}
        texto={`Ele ainda não saiu para a coleta. ${valor != null ? `O Pix de ${brl(valor)}` : 'O Pix'} volta para você, e ele é avisado na hora.`}
        pergunta="Por que você quer cancelar?"
        motivos={MOTIVOS}
        rotuloConfirmar="Sim, cancelar frete"
        rotuloManter="Manter o frete"
        enviando={cancelando}
        erro={erroCancelar}
        aoConfirmar={cancelar}
        aoFechar={() => setCancelarAberto(false)}
      />
    </div>
  )
}

/** O canhoto da entrega e, dentro do prazo, "Algo chegou errado" com o motivo obrigatório. */
function CanhotoDoCliente({ freteId, nome }: { freteId: string; nome: string }) {
  const [estado, recarregar] = useRecurso(() => ouNulo(api<Canhoto>('GET', `/api/fretes/${freteId}/canhoto`)), [freteId])
  const [abertoEm] = useState(() => Date.now())
  const [aberto, setAberto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  if (estado.fase !== 'pronto' || !estado.dados) return null
  const canhoto = estado.dados
  const noPrazo = new Date(canhoto.contestacaoAte).getTime() > abertoEm
  const horas = Math.max(1, Math.round((new Date(canhoto.contestacaoAte).getTime() - abertoEm) / 3600000))

  async function contestar() {
    setEnviando(true)
    setErro(null)
    try {
      await api('POST', `/api/fretes/${freteId}/canhoto/contestacao`, { motivo: motivo.trim() })
      recarregar()
    } catch (falha) {
      setErro(comoProblema(falha).detail)
      setEnviando(false)
    }
  }

  return (
    <section className="frete-c__cartao" aria-labelledby="t-canhoto">
      <h2 id="t-canhoto">Canhoto da entrega</h2>
      <EvidenciaCanhoto canhoto={canhoto} aoRecarregar={recarregar}>
        <div aria-live="polite" className="canhoto__contestacao">
          {canhoto.contestado ? (
            <p role="status" className="frete-c__texto">Contestação enviada. O pagamento fica parado até um administrador decidir, e {nome} foi avisado.</p>
          ) : !noPrazo ? (
            <p className="frete-c__texto">O prazo para contestar terminou em {dataHora(canhoto.contestacaoAte)}.</p>
          ) : !aberto ? (
            <>
              <p className="frete-c__texto">Se está tudo certo, não precisa fazer nada. O pagamento vai para {nome} em {horas} h.</p>
              <button type="button" className="botao botao--secundario" onClick={() => setAberto(true)}>Algo chegou errado</button>
            </>
          ) : (
            <div className="frete-c__contestar">
              <div className="campo">
                <label htmlFor="motivo" className="campo__rotulo">O que aconteceu?</label>
                <textarea id="motivo" className="campo__entrada campo__entrada--texto" rows={3} maxLength={500} autoFocus value={motivo}
                  placeholder="Ex.: o espelho do guarda-roupa chegou quebrado" onChange={(e) => setMotivo(e.target.value)} />
              </div>
              {erro && <Aviso tom="perigo" titulo="Não deu para enviar.">{erro}</Aviso>}
              <div className="frete-c__acoes">
                <button type="button" className="botao botao--perigo" disabled={!motivo.trim() || enviando} onClick={contestar}>{enviando ? 'Enviando…' : 'Enviar contestação'}</button>
                <button type="button" className="botao botao--fantasma" onClick={() => { setAberto(false); setMotivo('') }}>Voltar</button>
              </div>
            </div>
          )}
        </div>
      </EvidenciaCanhoto>
    </section>
  )
}
