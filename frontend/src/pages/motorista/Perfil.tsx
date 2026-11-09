import { useState, type FormEvent } from 'react'
import { api, comoProblema, MODO_DEMO } from '../../api/cliente'
import type { Motorista, NovoVeiculo, PerfilMotorista, Problema, Veiculo } from '../../api/tipos'
import { useRecurso } from '../../api/useRecurso'
import { Aviso, Cartao, ErroCarga, Esqueleto, Placa } from '../../components/ui'
import { CARROCERIAS, carroceria, TIPOS_CAMINHAO, veiculo } from '../../formato'
import { posicaoAtual } from '../../geo'
import { useSessao } from '../../sessao'
import { useTitulo } from '../../useTitulo'

/*
 * Perfil do motorista: o que a empresa vê dele (reputação e documentos), para onde vai o dinheiro
 * (chave Pix), com que caminhões ele roda e quando quer ser avisado. Um cartão por assunto, na ordem
 * do que mais trava um frete: sem chave Pix o dinheiro não tem para onde ir, sem caminhão não há aceite.
 */
export function Perfil() {
  useTitulo('Perfil')
  const { tokens } = useSessao()
  const id = tokens?.usuarioId ?? ''
  const [estado, recarregar] = useRecurso(async () => {
    const [motorista, reputacao, veiculos] = await Promise.all([
      api<Motorista>('GET', `/api/motoristas/${id}`),
      api<PerfilMotorista>('GET', `/api/motoristas/${id}/perfil`).catch(() => null),
      api<Veiculo[]>('GET', `/api/motoristas/${id}/veiculos`),
    ])
    return { motorista, reputacao, veiculos }
  }, [id])

  if (estado.fase === 'carregando') return <div className="perfil">{estado.mostrarEsqueleto && <><Esqueleto linhas={2} /><Esqueleto linhas={3} /><Esqueleto linhas={4} /></>}</div>
  if (estado.fase === 'erro') return <div className="perfil"><ErroCarga problema={estado.problema} tentarDeNovo={recarregar} /></div>

  const { motorista, reputacao, veiculos } = estado.dados
  return (
    <div className="perfil">
      <header className="perfil__cabeca">
        <h1 className="busca__titulo">{motorista.nome}</h1>
        {reputacao && (
          <p className="perfil__reputacao">
            <span>{reputacao.mediaNotas != null ? `★ ${reputacao.mediaNotas.toFixed(1).replace('.', ',')}` : 'Sem avaliações ainda'}</span>
            <span>{reputacao.fretesConcluidos} {reputacao.fretesConcluidos === 1 ? 'frete concluído' : 'fretes concluídos'}</span>
            {['CNH', 'CRLV'].map((d) => (
              <span key={d} className={reputacao.documentosVerificados.includes(d) ? 'doc doc--ok' : 'doc'}>
                {d} {reputacao.documentosVerificados.includes(d) ? 'verificada' : 'pendente'}
              </span>
            ))}
          </p>
        )}
      </header>

      <ChavePix motorista={motorista} aoSalvar={recarregar} />
      <Caminhoes motoristaId={motorista.id} veiculos={veiculos} aoMudar={recarregar} />
      <Avisos motorista={motorista} aoMudar={recarregar} />
      <Contato motorista={motorista} aoSalvar={recarregar} />
    </div>
  )
}

function ChavePix({ motorista, aoSalvar }: { motorista: Motorista; aoSalvar: () => void }) {
  const [editando, setEditando] = useState(!motorista.temChavePix)
  const [chave, setChave] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(null)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setProblema(null)
    if (!chave.trim()) {
      setProblema({ title: '', detail: '', status: 400, erros: { chavePix: 'Informe a chave Pix: CPF, telefone, e-mail ou chave aleatória.' } })
      return
    }
    setEnviando(true)
    try {
      await api('PUT', `/api/motoristas/${motorista.id}/chave-pix`, { chavePix: chave.trim() })
      aoSalvar()
    } catch (falha) {
      setProblema(comoProblema(falha))
      setEnviando(false)
    }
  }

  const erro = problema?.erros?.chavePix
  return (
    <Cartao id="titulo-pix" titulo="Onde você recebe">
      {motorista.temChavePix ? (
        <p className="perfil__ok">Chave Pix cadastrada. Adiantamento e saldo caem nela.</p>
      ) : (
        <Aviso tom="alerta" titulo="Falta a chave Pix.">Sem ela, o adiantamento e o saldo dos fretes não têm para onde ir.</Aviso>
      )}
      {editando ? (
        <form className="perfil__form" onSubmit={salvar} noValidate>
          <div className="campo">
            <label htmlFor="chave-pix" className="campo__rotulo">{motorista.temChavePix ? 'Nova chave Pix' : 'Chave Pix'}</label>
            <input id="chave-pix" className="campo__entrada" maxLength={77} autoComplete="off" spellCheck={false} value={chave}
              onChange={(e) => setChave(e.target.value)} placeholder="seu@email.com.br"
              aria-invalid={erro ? true : undefined} aria-describedby={erro ? 'chave-pix-erro' : 'chave-pix-ajuda'} />
            {erro
              ? <p id="chave-pix-erro" className="campo__erro">{erro}</p>
              : <p id="chave-pix-ajuda" className="campo__ajuda">CPF, telefone, e-mail ou chave aleatória. Por segurança, ela não volta para a tela depois de salva.</p>}
          </div>
          {problema && !erro && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}
          <div className="perfil__botoes">
            <button type="submit" className="botao botao--primario" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar chave'}</button>
            {motorista.temChavePix && <button type="button" className="botao botao--fantasma" onClick={() => setEditando(false)}>Cancelar</button>}
          </div>
        </form>
      ) : (
        <button type="button" className="botao botao--secundario perfil__acao" onClick={() => setEditando(true)}>Trocar chave Pix</button>
      )}
    </Cartao>
  )
}

function Caminhoes({ motoristaId, veiculos, aoMudar }: { motoristaId: string; veiculos: Veiculo[]; aoMudar: () => void }) {
  const [adicionando, setAdicionando] = useState(veiculos.length === 0)
  return (
    <Cartao id="titulo-caminhoes" titulo="Seus caminhões">
      {veiculos.length === 0 && !adicionando && <p>Nenhum caminhão cadastrado. Sem caminhão não dá para aceitar frete.</p>}
      {veiculos.length > 0 && (
        <ul className="perfil__caminhoes">
          {veiculos.map((v) => <LinhaCaminhao key={v.id} motoristaId={motoristaId} veiculo={v} aoRemover={aoMudar} />)}
        </ul>
      )}
      {adicionando
        ? <NovoCaminhao motoristaId={motoristaId} aoSalvar={aoMudar} aoCancelar={veiculos.length ? () => setAdicionando(false) : undefined} />
        : <button type="button" className="botao botao--secundario perfil__acao" onClick={() => setAdicionando(true)}>Adicionar caminhão</button>}
    </Cartao>
  )
}

function LinhaCaminhao({ motoristaId, veiculo: v, aoRemover }: { motoristaId: string; veiculo: Veiculo; aoRemover: () => void }) {
  const [fase, setFase] = useState<'parado' | 'confirmar' | 'enviando'>('parado')
  const [problema, setProblema] = useState<Problema | null>(null)

  async function remover() {
    setFase('enviando')
    setProblema(null)
    try {
      await api('DELETE', `/api/motoristas/${motoristaId}/veiculos/${v.id}`)
      aoRemover()
    } catch (falha) {
      setProblema(comoProblema(falha))
      setFase('parado')
    }
  }

  return (
    <li className="perfil__caminhao">
      <div className="perfil__caminhao-dados">
        <Placa placa={v.placa} />
        <span>{veiculo(v.tipo)} · {carroceria(v.carroceria)} · {v.numeroEixos} eixos{v.rastreador ? ' · rastreador' : ''}</span>
      </div>
      <div className="perfil__caminhao-acoes" aria-live="polite">
        {problema && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}
        {fase === 'confirmar' ? (
          <>
            <span className="proposta__confirmar">Remover {v.placa}?</span>
            <button type="button" className="botao botao--perigo" onClick={remover}>Remover</button>
            <button type="button" className="botao botao--fantasma" onClick={() => setFase('parado')}>Manter</button>
          </>
        ) : (
          <button type="button" className="botao botao--fantasma" disabled={fase === 'enviando'} onClick={() => setFase('confirmar')}
            aria-label={`Remover o caminhão ${v.placa}`}>
            {fase === 'enviando' ? 'Removendo…' : 'Remover'}
          </button>
        )}
      </div>
    </li>
  )
}

function NovoCaminhao({ motoristaId, aoSalvar, aoCancelar }: { motoristaId: string; aoSalvar: () => void; aoCancelar?: () => void }) {
  const [placa, setPlaca] = useState('')
  const [rntrc, setRntrc] = useState('')
  const [tipo, setTipo] = useState('CARRETA')
  const [carroceriaEscolhida, setCarroceria] = useState('SIDER')
  const [eixos, setEixos] = useState(5)
  const [rastreador, setRastreador] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(null)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setProblema(null)
    setEnviando(true)
    const pedido: NovoVeiculo = { placa: placa.trim().toUpperCase(), categoria: 'CAMINHAO', rntrc: rntrc.trim(), tipo, carroceria: carroceriaEscolhida, numeroEixos: eixos, rastreador }
    try {
      await api('POST', `/api/motoristas/${motoristaId}/veiculos`, pedido)
      aoSalvar()
    } catch (falha) {
      setProblema(comoProblema(falha))
      setEnviando(false)
    }
  }

  const erro = (c: string) => problema?.erros?.[c]
  return (
    <form className="perfil__form perfil__novo" onSubmit={salvar} noValidate aria-label="Novo caminhão">
      <div className="publicar__linha">
        <div className="campo">
          <label htmlFor="placa-nova" className="campo__rotulo">Placa</label>
          <input id="placa-nova" className="campo__entrada campo__entrada--placa" maxLength={8} autoComplete="off" spellCheck={false}
            value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="ABC1D23"
            aria-invalid={erro('placa') ? true : undefined} aria-describedby={erro('placa') ? 'placa-nova-erro' : undefined} />
          {erro('placa') && <p id="placa-nova-erro" className="campo__erro">{erro('placa')}</p>}
        </div>
        <div className="campo">
          <label htmlFor="rntrc-novo" className="campo__rotulo">RNTRC</label>
          <input id="rntrc-novo" className="campo__entrada" inputMode="numeric" maxLength={9} autoComplete="off" value={rntrc}
            onChange={(e) => setRntrc(e.target.value.replace(/\D/g, ''))} placeholder="045821937"
            aria-invalid={erro('rntrc') ? true : undefined} aria-describedby={erro('rntrc') ? 'rntrc-novo-erro' : undefined} />
          {erro('rntrc') && <p id="rntrc-novo-erro" className="campo__erro">{erro('rntrc')}</p>}
        </div>
      </div>
      <div className="publicar__linha">
        <div className="campo">
          <label htmlFor="tipo-novo" className="campo__rotulo">Tipo</label>
          {/* Trocar o tipo sugere os eixos dele; quem tem eixo a mais ou a menos corrige ao lado. */}
          <select id="tipo-novo" className="campo__entrada" value={tipo}
            onChange={(e) => { setTipo(e.target.value); setEixos(TIPOS_CAMINHAO.find((t) => t.valor === e.target.value)?.eixos ?? eixos) }}>
            {TIPOS_CAMINHAO.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="eixos-novo" className="campo__rotulo">Eixos</label>
          <select id="eixos-novo" className="campo__entrada" value={eixos} onChange={(e) => setEixos(Number(e.target.value))}>
            {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>
      <div className="campo">
        <label htmlFor="carroceria-nova" className="campo__rotulo">Carroceria</label>
        <select id="carroceria-nova" className="campo__entrada" value={carroceriaEscolhida} onChange={(e) => setCarroceria(e.target.value)}>
          {CARROCERIAS.map((c) => <option key={c.valor} value={c.valor}>{c.rotulo}</option>)}
        </select>
      </div>
      <label className="opcao">
        <input type="checkbox" checked={rastreador} onChange={(e) => setRastreador(e.target.checked)} />
        <span>Tem rastreador</span>
      </label>
      {problema && !problema.erros && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}
      <div className="perfil__botoes">
        <button type="submit" className="botao botao--primario" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar caminhão'}</button>
        {aoCancelar && <button type="button" className="botao botao--fantasma" onClick={aoCancelar}>Cancelar</button>}
      </div>
    </form>
  )
}

const RAIOS = [50, 100, 200, 300] as const

function Avisos({ motorista, aoMudar }: { motorista: Motorista; aoMudar: () => void }) {
  const [raio, setRaio] = useState<number>(100)
  const [base, setBase] = useState<{ fase: 'parado' } | { fase: 'buscando' } | { fase: 'salvo'; raio: number } | { fase: 'erro'; texto: string }>({ fase: 'parado' })
  const [feriado, setFeriado] = useState(motorista.aceitaFeriado)
  const [salvandoFeriado, setSalvandoFeriado] = useState(false)
  const [erroFeriado, setErroFeriado] = useState<string | null>(null)

  async function salvarBase() {
    setBase({ fase: 'buscando' })
    try {
      // Na demonstração a base é Campinas, a mesma da busca de exemplo, sem pedir o GPS.
      const p = MODO_DEMO ? { lat: -22.9, lng: -47.06 } : await posicaoAtual()
      await api('PUT', `/api/motoristas/${motorista.id}/base`, { latitude: p.lat, longitude: p.lng, raioKm: raio })
      setBase({ fase: 'salvo', raio })
    } catch (falha) {
      setBase({ fase: 'erro', texto: comoProblema(falha).detail })
    }
  }

  async function mudarFeriado(valor: boolean) {
    setFeriado(valor)
    setSalvandoFeriado(true)
    setErroFeriado(null)
    try {
      await api('PATCH', `/api/motoristas/${motorista.id}/preferencias`, { aceitaFeriado: valor })
      aoMudar()
    } catch (falha) {
      setFeriado(!valor)
      setErroFeriado(comoProblema(falha).detail || 'Não deu para salvar. Tente de novo.')
    } finally {
      setSalvandoFeriado(false)
    }
  }

  return (
    <Cartao id="titulo-avisos" titulo="Avisos de frete novo">
      <p>Quando aparecer frete perto da sua base, você recebe aviso. A base é onde você estiver ao salvar.</p>
      <div className="campo">
        <span className="campo__rotulo" id="raio-rotulo">Até que distância</span>
        <div className="escolhas" role="radiogroup" aria-labelledby="raio-rotulo">
          {RAIOS.map((r) => (
            <label key={r} className="escolha">
              <input type="radio" name="raio-aviso" className="escolha__caixa" checked={raio === r} onChange={() => setRaio(r)} />
              <span>{r} km</span>
            </label>
          ))}
        </div>
      </div>
      <div aria-live="polite" className="perfil__estado">
        {base.fase === 'salvo' && <p className="perfil__ok">Base salva. Você recebe aviso de frete a até {base.raio} km dela.</p>}
        {base.fase === 'erro' && <Aviso tom="alerta" titulo="Não deu para salvar a base.">{base.texto}</Aviso>}
      </div>
      <button type="button" className="botao botao--secundario perfil__acao" onClick={salvarBase} disabled={base.fase === 'buscando'}>
        {base.fase === 'buscando' ? 'Pegando sua localização…' : 'Usar onde estou como base'}
      </button>

      <div className="perfil__feriado">
        <label className="opcao">
          <input type="checkbox" checked={feriado} disabled={salvandoFeriado} onChange={(e) => mudarFeriado(e.target.checked)} />
          <span>Pego frete em feriado</span>
        </label>
        <p className="campo__ajuda" aria-live="polite">
          {erroFeriado ?? (feriado ? 'Você pode fechar frete com coleta em feriado.' : 'Frete com coleta em feriado não fecha com você.')}
        </p>
      </div>
    </Cartao>
  )
}

function Contato({ motorista, aoSalvar }: { motorista: Motorista; aoSalvar: () => void }) {
  const [nome, setNome] = useState(motorista.nome)
  const [telefone, setTelefone] = useState(motorista.telefone)
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(null)
  const alterado = nome !== motorista.nome || telefone !== motorista.telefone

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setProblema(null)
    setEnviando(true)
    try {
      await api('PUT', `/api/motoristas/${motorista.id}`, { nome: nome.trim(), telefone: telefone.trim() })
      aoSalvar()
    } catch (falha) {
      setProblema(comoProblema(falha))
      setEnviando(false)
    }
  }

  const erro = (c: string) => problema?.erros?.[c]
  return (
    <Cartao id="titulo-contato" titulo="Seus dados">
      <form className="perfil__form" onSubmit={salvar} noValidate>
        <div className="campo">
          <label htmlFor="nome-motorista" className="campo__rotulo">Nome</label>
          <input id="nome-motorista" className="campo__entrada" autoComplete="name" maxLength={100} value={nome} onChange={(e) => setNome(e.target.value)}
            aria-invalid={erro('nome') ? true : undefined} aria-describedby={erro('nome') ? 'nome-motorista-erro' : undefined} />
          {erro('nome') && <p id="nome-motorista-erro" className="campo__erro">{erro('nome')}</p>}
        </div>
        <div className="campo">
          <label htmlFor="telefone-motorista" className="campo__rotulo">Telefone (WhatsApp)</label>
          <input id="telefone-motorista" type="tel" className="campo__entrada" autoComplete="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)}
            aria-invalid={erro('telefone') ? true : undefined} aria-describedby={erro('telefone') ? 'telefone-motorista-erro' : undefined} />
          {erro('telefone') && <p id="telefone-motorista-erro" className="campo__erro">{erro('telefone')}</p>}
        </div>
        <dl className="ficha ficha--compacta">
          <div><dt>E-mail</dt><dd>{motorista.email}</dd></div>
        </dl>
        <p className="campo__ajuda">CPF e e-mail não mudam por aqui: são a sua identidade na plataforma.</p>
        {problema && !problema.erros && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}
        {alterado && (
          <div className="perfil__botoes">
            <button type="submit" className="botao botao--primario" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar dados'}</button>
            <button type="button" className="botao botao--fantasma" onClick={() => { setNome(motorista.nome); setTelefone(motorista.telefone) }}>Desfazer</button>
          </div>
        )}
      </form>
    </Cartao>
  )
}
