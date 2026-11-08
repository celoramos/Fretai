import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, comoProblema } from '../../api/cliente'
import type { Frete, Problema, SolicitarFrete, VerificacaoData } from '../../api/tipos'
import { CamposPonta } from '../../components/CamposPonta'
import { SairSemSalvar } from '../../components/SairSemSalvar'
import { Aviso, Campo } from '../../components/ui'
import { dataCurta, hoje, lerReais } from '../../formato'
import { enderecoDe, PONTA_VAZIA, type Ponta } from '../../ponta'
import { useSessao } from '../../sessao'
import { useTitulo } from '../../useTitulo'

interface Rascunho {
  coleta: Ponta
  entrega: Ponta
  nomeDestinatario: string
  telefoneDestinatario: string
  dataColeta: string
  descricao: string
  peso: string
  valor: string
}

const VAZIO: Rascunho = {
  coleta: PONTA_VAZIA, entrega: PONTA_VAZIA, nomeDestinatario: '', telefoneDestinatario: '', dataColeta: '', descricao: '', peso: '', valor: '',
}

/** Campos que mostram o próprio erro. Os nomes são os da validação da API (SolicitarFreteRequest). */
const CAMPOS_DESENHADOS = new Set(['coleta', 'coleta.cep', 'entrega', 'entrega.cep', 'nomeDestinatario', 'telefoneDestinatario',
  'dataColeta', 'descricaoCarga', 'pesoKg', 'valor'])

/*
 * Pedir frete, para quem não é empresa: o mínimo que o motorista precisa para decidir (de onde, para onde,
 * quando, o quê, por quanto) e quem recebe, que é quem assina o canhoto. Sem tipo de caminhão nem tabela da
 * ANTT: quem pede uma mudança não sabe, e a API aceita qualquer veículo nesse frete.
 */
export function PedirFrete() {
  useTitulo('Pedir frete')
  const { tokens } = useSessao()
  const navegar = useNavigate()
  const [r, setR] = useState(VAZIO)
  const muda = <K extends keyof Rascunho>(campo: K) => (valor: Rascunho[K]) => setR((x) => ({ ...x, [campo]: valor }))
  const [dia, setDia] = useState<VerificacaoData | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(null)
  const formulario = useRef<HTMLFormElement>(null)
  const alterado = JSON.stringify(r) !== JSON.stringify(VAZIO)

  // Feriado muda o preço (a API soma um adicional) e quem aceita: o cliente fica sabendo enquanto escolhe a data.
  useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.dataColeta)) return
    let vivo = true
    api<VerificacaoData>('GET', `/api/calendario/verificacao?data=${r.dataColeta}`)
      .then((v) => vivo && setDia(v))
      .catch(() => undefined) // sem a verificação o formulário segue; a API marca o feriado ao salvar
    return () => {
      vivo = false
    }
  }, [r.dataColeta])
  const diaAtual = dia?.data === r.dataColeta ? dia : null

  async function pedir(e: FormEvent) {
    e.preventDefault()
    setProblema(null)
    setEnviando(true)
    const peso = lerReais(r.peso)
    const valor = lerReais(r.valor)
    const pedido: SolicitarFrete = {
      clienteId: tokens?.usuarioId ?? '',
      coleta: enderecoDe(r.coleta),
      entrega: enderecoDe(r.entrega),
      nomeDestinatario: r.nomeDestinatario.trim(),
      telefoneDestinatario: r.telefoneDestinatario.trim(),
      descricaoCarga: r.descricao.trim(),
      pesoKg: Number.isFinite(peso) ? peso : 0,
      valor: Number.isFinite(valor) ? valor : 0,
      dataColeta: r.dataColeta,
    }
    try {
      const novo = await api<Frete>('POST', '/api/fretes', pedido)
      navegar(`/cliente/fretes/${novo.id}`, { state: { publicado: true } })
    } catch (falha) {
      setProblema(comoProblema(falha))
      setEnviando(false)
      requestAnimationFrame(() => {
        const primeiro = formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ;(primeiro ?? document.getElementById('erro-pedir'))?.focus()
      })
    }
  }

  const erro = (...campos: string[]) => campos.map((c) => problema?.erros?.[c]).find(Boolean)
  // Erro de campo que não tem lugar no formulário (ex.: coleta.numero) sobe para o aviso do fim, para não sumir.
  const soltos = Object.entries(problema?.erros ?? {}).filter(([c]) => !CAMPOS_DESENHADOS.has(c)).map(([, m]) => m)
  const invalido = (c: string) => (erro(c) ? true : undefined)

  return (
    <div className="publicar">
      <Link to="/cliente" className="voltar">Seus fretes</Link>
      <h1 className="titulo-pagina">Pedir frete</h1>
      <form ref={formulario} className="publicar__form" onSubmit={pedir} noValidate>
        <fieldset className="publicar__grupo cartao">
          <legend className="publicar__legenda">De onde para onde</legend>
          <div className="publicar__pontas">
            <CamposPonta id="coleta" titulo="Coleta" exemploCep="13025-320" exemploComplemento="Apto 42" ponta={r.coleta}
              mudar={muda('coleta')} erroCep={erro('coleta.cep', 'coleta')} />
            <CamposPonta id="entrega" titulo="Entrega" exemploCep="18035-400" exemploComplemento="Casa 2" ponta={r.entrega}
              mudar={muda('entrega')} erroCep={erro('entrega.cep', 'entrega')} />
          </div>
          <p className="campo__ajuda">A cidade e a distância saem do CEP. Motoristas perto da coleta recebem o aviso.</p>
        </fieldset>

        <fieldset className="publicar__grupo cartao">
          <legend className="publicar__legenda">Quem recebe</legend>
          <div className="publicar__linha">
            <Campo id="nome-destinatario" rotulo="Nome" erro={erro('nomeDestinatario')}>
              <input id="nome-destinatario" className="campo__entrada" maxLength={100} autoComplete="off" value={r.nomeDestinatario}
                onChange={(e) => muda('nomeDestinatario')(e.target.value)} aria-invalid={invalido('nomeDestinatario')}
                aria-describedby={erro('nomeDestinatario') ? 'nome-destinatario-erro' : undefined} />
            </Campo>
            <Campo id="telefone-destinatario" rotulo="Celular com DDD" erro={erro('telefoneDestinatario')}>
              <input id="telefone-destinatario" type="tel" inputMode="tel" className="campo__entrada" maxLength={20} autoComplete="off"
                placeholder="(15) 98888-7777" value={r.telefoneDestinatario} onChange={(e) => muda('telefoneDestinatario')(e.target.value)}
                aria-invalid={invalido('telefoneDestinatario')}
                aria-describedby={erro('telefoneDestinatario') ? 'telefone-destinatario-erro' : 'quem-recebe-ajuda'} />
            </Campo>
          </div>
          <p id="quem-recebe-ajuda" className="campo__ajuda">É quem assina a entrega no celular do motorista. Recebe por mensagem um código para contestar, se algo chegar errado.</p>
        </fieldset>

        <fieldset className="publicar__grupo cartao">
          <legend className="publicar__legenda">Quando</legend>
          <Campo id="data-coleta" rotulo="Data da coleta" erro={erro('dataColeta')}>
            <input id="data-coleta" type="date" className="campo__entrada publicar__data" min={hoje()} value={r.dataColeta}
              onChange={(e) => muda('dataColeta')(e.target.value)} aria-invalid={invalido('dataColeta')}
              aria-describedby={erro('dataColeta') ? 'data-coleta-erro' : 'data-coleta-dia'} />
          </Campo>
          <p id="data-coleta-dia" className="publicar__dia" aria-live="polite">
            {diaAtual?.feriado && `${dataCurta(diaAtual.data)} é feriado${diaAtual.nomeFeriado ? ` (${diaAtual.nomeFeriado})` : ''}. Frete em feriado tem um adicional sobre o valor, e nem todo motorista pega.`}
            {diaAtual && !diaAtual.feriado && diaAtual.domingo && `${dataCurta(diaAtual.data)} é domingo.`}
          </p>
        </fieldset>

        <fieldset className="publicar__grupo cartao">
          <legend className="publicar__legenda">O que vai</legend>
          <Campo id="descricao" rotulo="Descrição" erro={erro('descricaoCarga')}>
            <input id="descricao" className="campo__entrada" maxLength={500} value={r.descricao} onChange={(e) => muda('descricao')(e.target.value)}
              placeholder="Geladeira, fogão e 15 caixas" aria-invalid={invalido('descricaoCarga')}
              aria-describedby={erro('descricaoCarga') ? 'descricao-erro' : undefined} />
          </Campo>
          <Campo id="peso" rotulo="Peso aproximado (kg)" erro={erro('pesoKg')} ajuda="Uma estimativa serve: é com ela que o motorista vê se cabe no veículo dele.">
            <input id="peso" inputMode="decimal" className="campo__entrada campo__entrada--numero" value={r.peso} onChange={(e) => muda('peso')(e.target.value)}
              placeholder="350" aria-invalid={invalido('pesoKg')} aria-describedby={erro('pesoKg') ? 'peso-erro' : 'peso-ajuda'} />
          </Campo>
        </fieldset>

        <fieldset className="publicar__grupo cartao">
          <legend className="publicar__legenda">Quanto você paga</legend>
          <Campo id="valor" rotulo="Valor do frete (R$)" erro={erro('valor')}
            ajuda="O motorista aceita por esse valor ou manda outra proposta. Você paga por Pix depois de escolher, e o dinheiro fica guardado até a entrega.">
            <input id="valor" inputMode="decimal" className="campo__entrada campo__entrada--numero publicar__valor" value={r.valor}
              onChange={(e) => muda('valor')(e.target.value)} placeholder="650" aria-invalid={invalido('valor')}
              aria-describedby={erro('valor') ? 'valor-erro' : 'valor-ajuda'} />
          </Campo>
        </fieldset>

        <div className="publicar__fim" aria-live="polite">
          <div id="erro-pedir" tabIndex={-1}>
            {problema && (!problema.erros || soltos.length > 0) && <Aviso tom="perigo" titulo={problema.title}>{soltos.join(' ') || problema.detail}</Aviso>}
          </div>
          <div className="publicar__botoes">
            <button type="submit" className="botao botao--primario" disabled={enviando}>{enviando ? 'Pedindo…' : 'Pedir frete'}</button>
            <Link to="/cliente" className="botao botao--fantasma">Cancelar</Link>
          </div>
        </div>
      </form>
      <SairSemSalvar alterado={alterado && !enviando} />
    </div>
  )
}
