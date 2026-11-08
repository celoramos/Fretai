import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ErroApi } from '../../api/cliente'
import type { EventoFrete, Frete, Pagamento, PerfilEmpresa, Problema, Veiculo } from '../../api/tipos'
import { useRecurso } from '../../api/useRecurso'
import { Reputacao } from '../../components/CardFrete'
import { CancelarFrete } from '../../components/CancelarFrete'
import { ChipPiso, MedidorGarantia, SeloGarantido, Valor } from '../../components/Dinheiro'
import { useTitulo } from '../../useTitulo'
import { RotaLinha } from '../../components/RotaLinha'
import { Aviso, ErroCarga, Esqueleto, Marcos, Placa, StatusFreteEtiqueta } from '../../components/ui'
import { carga, carroceria, dataCurta, porKm, reais, veiculo } from '../../formato'
import { useSessao } from '../../sessao'

/** Erro de permissão ou ausência vira "não tem": quem não participa do frete não vê histórico nem cobrança. */
const talvez = <T,>(p: Promise<T>) => p.catch((e) => (e instanceof ErroApi && [403, 404].includes(e.problema.status) ? null : Promise.reject(e)))

export function FreteMotorista() {
  const { id = '' } = useParams()
  const { tokens } = useSessao()
  const [estado, recarregar] = useRecurso(async () => {
    const frete = await api<Frete>('GET', `/api/fretes/${id}`)
    const [eventos, pagamento, perfil] = await Promise.all([
      talvez(api<EventoFrete[]>('GET', `/api/fretes/${id}/eventos`)),
      talvez(api<Pagamento>('GET', `/api/fretes/${id}/pagamento`)),
      frete.empresa ? talvez(api<PerfilEmpresa>('GET', `/api/empresas/${frete.empresa.id}/perfil`)) : null,
    ])
    return { frete, eventos: eventos ?? [], pagamento, perfil }
  }, [id])

  const titulo = estado.fase === 'pronto' ? `${estado.dados.frete.coleta.cidade} para ${estado.dados.frete.entrega.cidade}` : 'Frete'
  useTitulo(titulo)

  if (estado.fase === 'carregando') return <div className="frete-m">{estado.mostrarEsqueleto && <><Esqueleto linhas={2} /><Esqueleto linhas={5} /></>}</div>
  if (estado.fase === 'erro') return <div className="frete-m"><ErroCarga problema={estado.problema} tentarDeNovo={recarregar} /></div>

  const { frete, eventos, pagamento, perfil } = estado.dados
  const meu = frete.motorista?.id === tokens?.usuarioId
  const aberto = frete.status === 'PUBLICADO' || frete.status === 'PROPOSTA_ENVIADA'
  const valor = frete.valorAcordado ?? frete.valorTotal ?? frete.valor
  const garantido = pagamento != null && ['RETIDO', 'ADIANTAMENTO_LIBERADO', 'LIBERADO'].includes(pagamento.status)

  return (
    <div className="frete-m">
      <Link to={meu ? '/motorista/meus-fretes' : '/motorista'} className="voltar">Voltar</Link>
      <header className="frete-m__cabeca cartao">
        <div className="frete-m__status">
          <StatusFreteEtiqueta status={frete.status} visao="motorista" />
          {garantido && <SeloGarantido />}
        </div>
        <h1 className="visualmente-oculto">Frete de {titulo}</h1>
        <RotaLinha coleta={frete.coleta} entrega={frete.entrega} distanciaKm={frete.distanciaKm} estimada={frete.distanciaEstimada} grande />
      </header>

      <section className="bloco cartao frete-m__valor" aria-label="Valor">
        {valor == null || (frete.valorACombinar && !frete.valorAcordado) ? (
          <p className="card-frete__combinar">A combinar</p>
        ) : (
          <div className="frete-m__numeros">
            <Valor valor={valor} tamanho="grande" />
            {frete.distanciaKm ? <span className="card-frete__porkm">R$&nbsp;{porKm(valor, frete.distanciaKm)}/km</span> : null}
          </div>
        )}
        <ChipPiso preco={frete.preco} valor={valor} />
        {frete.preco?.acimaDaMedia && (
          <Aviso tom="alerta" titulo="Valor muito acima da média desta rota.">
            Golpe comum: valor alto para atrair motorista. Confira a empresa antes de carregar.
          </Aviso>
        )}
      </section>

      {meu && !aberto && (
        <section className="bloco cartao" aria-labelledby="andamento">
          <h2 id="andamento" className="bloco__titulo">Andamento</h2>
          <MedidorGarantia pagamento={pagamento} />
          <Acoes frete={frete} pagamento={pagamento} aoMudar={recarregar} />
          <Marcos status={frete.status} eventos={eventos} visao="motorista" orientacao="vertical" motivoCancelamento={frete.motivoCancelamento} />
        </section>
      )}

      <section className="bloco cartao" aria-labelledby="carga">
        <h2 id="carga" className="bloco__titulo">Carga e coleta</h2>
        <dl className="ficha">
          <div><dt>Coleta</dt><dd>{dataCurta(frete.dataColeta)}{frete.feriado ? ` · feriado${frete.nomeFeriado ? ` (${frete.nomeFeriado})` : ''}` : ''}{frete.domingo ? ' · domingo' : ''}</dd></div>
          {frete.descricaoCarga && <div><dt>Carga</dt><dd>{frete.descricaoCarga}{frete.especieCarga ? ` · ${frete.especieCarga}` : ''}</dd></div>}
          {frete.tipoCargaAntt && <div><dt>Tipo ANTT</dt><dd>{carga(frete.tipoCargaAntt)}</dd></div>}
          {frete.pesoKg != null && <div><dt>Peso</dt><dd>{reais(frete.pesoKg)}&nbsp;kg</dd></div>}
          <div><dt>Veículos</dt><dd>{frete.veiculosAceitos.map(veiculo).join(', ') || 'Qualquer'}</dd></div>
          <div><dt>Carroceria</dt><dd>{frete.carroceriasAceitas.map(carroceria).join(', ') || 'Qualquer'}</dd></div>
          <div><dt>Rastreador</dt><dd>{frete.exigeRastreador ? 'Obrigatório' : 'Não exige'}</dd></div>
          {meu && <div><dt>Retirada</dt><dd>{frete.coleta.enderecoCompleto}</dd></div>}
          {meu && <div><dt>Entrega</dt><dd>{frete.entrega.enderecoCompleto}{frete.nomeDestinatario ? ` · ${frete.nomeDestinatario}` : ''}</dd></div>}
          {meu && frete.telefoneDestinatario && <div><dt>Contato</dt><dd><a href={`tel:${frete.telefoneDestinatario.replace(/\D/g, '')}`}>{frete.telefoneDestinatario}</a></dd></div>}
          {meu && frete.veiculo && <div><dt>Seu caminhão</dt><dd><Placa placa={frete.veiculo.placa} /></dd></div>}
        </dl>
      </section>

      <section className="bloco cartao" aria-labelledby="empresa">
        <h2 id="empresa" className="bloco__titulo">{frete.publicadoPorAgenciador ? 'Agenciador' : 'Empresa'}</h2>
        <Reputacao nome={frete.empresa?.razaoSocial ?? frete.cliente?.nome ?? 'Cliente pessoa física'} perfil={perfil ?? undefined} />
        {perfil && <p className="detalhe">Na plataforma desde {new Date(perfil.naPlataformaDesde).getFullYear()} · {perfil.fretesConcluidos} fretes concluídos</p>}
      </section>

      {meu && frete.status === 'ACEITO' && <CancelarFrete frete={frete} pago={garantido} aoCancelar={recarregar} />}

      {aberto && !meu && <Negociar frete={frete} valor={valor} aoMudar={recarregar} />}
    </div>
  )
}

function Acoes({ frete, pagamento, aoMudar }: { frete: Frete; pagamento: Pagamento | null; aoMudar: () => void }) {
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(null)

  async function iniciar() {
    setEnviando(true)
    setProblema(null)
    try {
      await api('POST', `/api/fretes/${frete.id}/inicio`)
      aoMudar()
    } catch (e) {
      setProblema(e instanceof ErroApi ? e.problema : { title: 'Erro', detail: String(e), status: 0 })
    } finally {
      setEnviando(false)
    }
  }

  if (frete.status === 'ACEITO') {
    const semGarantia = !pagamento || pagamento.status === 'PENDENTE'
    return (
      <div className="acoes" aria-live="polite">
        {semGarantia ? (
          <Aviso tom="alerta" titulo="A empresa ainda não pagou o Pix.">Espere o “Pagamento garantido” antes de carregar.</Aviso>
        ) : (
          <Aviso tom="garantido" titulo="O dinheiro já está guardado. Pode carregar." />
        )}
        {problema && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}
        <button type="button" className="botao botao--primario botao--largo" onClick={iniciar} disabled={enviando}>
          {enviando ? 'Iniciando…' : 'Iniciar viagem'}
        </button>
      </div>
    )
  }
  if (frete.status === 'EM_TRANSITO') {
    return (
      <Aviso tom="info" titulo="Na entrega, registre o canhoto.">
        Foto, assinatura do recebedor e GPS a até 500 m do destino. É isso que libera o saldo.
      </Aviso>
    )
  }
  return null
}

function Negociar({ frete, valor, aoMudar }: { frete: Frete; valor: number | null; aoMudar: () => void }) {
  const { tokens } = useSessao()
  const [veiculos, setVeiculos] = useState<Veiculo[] | null>(null)
  const [veiculoId, setVeiculoId] = useState('')
  const [modo, setModo] = useState<'escolha' | 'proposta'>('escolha')
  const [proposto, setProposto] = useState(valor != null ? String(valor) : '')
  const [adiantamento, setAdiantamento] = useState(40)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null)

  useEffect(() => {
    if (!tokens) return
    api<Veiculo[]>('GET', `/api/motoristas/${tokens.usuarioId}/veiculos`)
      .then((vs) => {
        setVeiculos(vs)
        const compativel = vs.find((v) => compatibilidade(frete, v) == null)
        setVeiculoId(compativel?.id ?? '')
      })
      .catch(() => setVeiculos([]))
  }, [tokens, frete])

  const numero = Number(proposto.replace(/\./g, '').replace(',', '.'))
  const valido = Number.isFinite(numero) && numero > 0

  async function executar(acao: 'aceite' | 'proposta', e?: FormEvent) {
    e?.preventDefault()
    setEnviando(true)
    setResultado(null)
    try {
      if (acao === 'aceite') {
        await api('POST', `/api/fretes/${frete.id}/aceite`, { motoristaId: tokens?.usuarioId, veiculoId: veiculoId || null })
        aoMudar()
      } else {
        await api('POST', `/api/fretes/${frete.id}/propostas`, { motoristaId: tokens?.usuarioId, veiculoId: veiculoId || null, valor: numero, adiantamentoPercentual: adiantamento })
        setResultado({ ok: true, texto: 'Proposta enviada. Você recebe aviso quando a empresa responder.' })
        setModo('escolha')
      }
    } catch (erro) {
      const p = erro instanceof ErroApi ? erro.problema : null
      setResultado({ ok: false, texto: p ? `${p.title}. ${p.detail}` : String(erro) })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="negociar" aria-labelledby="negociar-titulo">
      <h2 id="negociar-titulo" className="visualmente-oculto">Fechar este frete</h2>
      <div className="campo">
        <label htmlFor="veiculo" className="campo__rotulo">Com qual caminhão</label>
        <select id="veiculo" className="campo__entrada" value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)} disabled={!veiculos}>
          {!veiculos && <option value="">Carregando a frota…</option>}
          {veiculos?.length === 0 && <option value="">Nenhum caminhão cadastrado</option>}
          {veiculos?.map((v) => {
            const motivo = compatibilidade(frete, v)
            return (
              <option key={v.id} value={v.id} disabled={motivo != null}>
                {v.placa} · {veiculo(v.tipo)} {carroceria(v.carroceria)}{motivo ? ` (${motivo})` : ''}
              </option>
            )
          })}
        </select>
      </div>

      {modo === 'proposta' && (
        <form className="negociar__proposta" id="form-proposta" onSubmit={(e) => executar('proposta', e)}>
          <div className="campo">
            <label htmlFor="valor-proposta" className="campo__rotulo">Seu valor (R$)</label>
            <input id="valor-proposta" inputMode="decimal" className="campo__entrada campo__entrada--numero" value={proposto} onChange={(e) => setProposto(e.target.value)} />
            {valido && frete.distanciaKm ? (
              <p className="campo__ajuda">
                R$&nbsp;{porKm(numero, frete.distanciaKm)}/km
                {frete.preco?.pisoMinimo ? (numero < frete.preco.pisoMinimo ? `, abaixo do piso ANTT (R$ ${reais(frete.preco.pisoMinimo)})` : ', acima do piso ANTT') : ''}
              </p>
            ) : null}
          </div>
          <div className="campo">
            <label htmlFor="adiantamento" className="campo__rotulo">Adiantamento na saída: {adiantamento}%</label>
            <input id="adiantamento" type="range" min={0} max={100} step={10} value={adiantamento} onChange={(e) => setAdiantamento(Number(e.target.value))} className="faixa-deslizante" />
            {valido && (
              <p className="campo__ajuda campo__ajuda--numeros">
                RR$&nbsp;{reais((numero * adiantamento) / 100)} na saída e Rna saída · R$&nbsp;nbsp;{reais(numero - (numero * adiantamento) / 100)} na entreganbsp;{reais((numero * adiantamento) / 100)} na saída · RR$&nbsp;{reais((numero * adiantamento) / 100)} na saída e Rna saída · R$&nbsp;nbsp;{reais(numero - (numero * adiantamento) / 100)} na entreganbsp;{reais(numero - (numero * adiantamento) / 100)} na entrega
              </p>
            )}
          </div>
        </form>
      )}

      <p aria-live="polite" className={resultado ? (resultado.ok ? 'negociar__ok' : 'negociar__erro') : undefined}>{resultado?.texto}</p>

      <div className="negociar__botoes">
        {modo === 'escolha' ? (
          <>
            {valor != null && !frete.valorACombinar && (
              <button type="button" className="botao botao--primario botao--largo" disabled={enviando || !veiculoId} onClick={() => executar('aceite')}>
                {enviando ? 'Aceitando…' : `Aceitar por R$ ${reais(valor)}`}
              </button>
            )}
            <button type="button" className="botao botao--secundario botao--largo" onClick={() => setModo('proposta')}>Fazer proposta</button>
          </>
        ) : (
          <>
            <button type="submit" form="form-proposta" className="botao botao--primario botao--largo" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar proposta'}
            </button>
            <button type="button" className="botao botao--fantasma botao--largo" onClick={() => setModo('escolha')}>Voltar</button>
          </>
        )}
      </div>
    </section>
  )
}

/** Por que este caminhão não serve para este frete; null quando serve. */
function compatibilidade(frete: Frete, v: Veiculo): string | null {
  if (frete.veiculosAceitos.length && !frete.veiculosAceitos.includes(v.tipo)) return 'tipo não aceito'
  if (frete.carroceriasAceitas.length && !frete.carroceriasAceitas.includes(v.carroceria)) return 'carroceria não aceita'
  if (frete.exigeRastreador && !v.rastreador) return 'sem rastreador'
  return null
}
