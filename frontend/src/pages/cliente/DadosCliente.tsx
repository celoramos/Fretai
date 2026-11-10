import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, comoProblema, CONTA_ATUALIZADA } from '../../api/cliente'
import type { Cliente, Problema } from '../../api/tipos'
import { useRecurso } from '../../api/useRecurso'
import { Avatar } from '../../components/Avatar'
import { CabecalhoPagina } from '../../components/CabecalhoPagina'
import { BotaoTema } from '../../components/Layouts'
import { SairSemSalvar } from '../../components/SairSemSalvar'
import { Aviso, Campo, ErroCarga, Esqueleto } from '../../components/ui'
import { mesAno, telefone } from '../../formato'
import { useComputador } from '../../largura'
import { useSessao } from '../../sessao'
import { useTitulo } from '../../useTitulo'

/*
 * Os dados do cliente pessoa física: quem ele é no Fretaí e o que pode corrigir. O nome vai no pedido,
 * e o celular só chega ao motorista depois de fechar o frete, para o WhatsApp. O e-mail é a entrada na
 * conta e não muda por aqui: aparece como texto no cartão de cima, do jeito que a conta da empresa
 * mostra o que não se edita, e não como um campo que não aceita digitação. O topo aparece também
 * enquanto carrega e quando falha: no celular esta tela não tem barra, e sem ele não haveria volta.
 */
export function DadosCliente() {
  useTitulo('Meus dados')
  const computador = useComputador()
  const { tokens } = useSessao()
  const id = tokens?.usuarioId ?? ''
  const [estado, recarregar] = useRecurso(() => api<Cliente>('GET', `/api/clientes/${id}`), [id])
  // O PUT devolve o cadastro: a tela troca os dados sem buscar de novo.
  const [salvo, setSalvo] = useState<Cliente | null>(null)

  const topo = computador ? (
    <div className="pedido__topo">
      <Link to="/cliente" className="voltar">Meus fretes</Link>
      <h1 className="titulo-pagina">Meus dados</h1>
    </div>
  ) : <CabecalhoPagina titulo="Meus dados" voltar="/cliente" rotuloVoltar="Voltar para meus fretes"><BotaoTema /></CabecalhoPagina>

  if (estado.fase === 'carregando') return <div className="perfil-m dados-c">{topo}{estado.mostrarEsqueleto && <><Esqueleto linhas={2} /><Esqueleto linhas={5} /></>}</div>
  if (estado.fase === 'erro') return <div className="perfil-m dados-c">{topo}<ErroCarga problema={estado.problema} tentarDeNovo={recarregar} /></div>

  const cliente = salvo ?? estado.dados
  return (
    <div className="perfil-m dados-c">
      {topo}
      <section className="perfil-m__voce" aria-label="Você">
        <Avatar nome={cliente.nome} grande />
        <span className="quem__texto">
          <strong>{cliente.nome}</strong>
          <span className="dados-c__email">{cliente.email}</span>
          <span>No Fretaí desde {mesAno(cliente.criadoEm)}</span>
        </span>
      </section>
      <Contato cliente={cliente} aoSalvar={setSalvo} />
    </div>
  )
}

function Contato({ cliente, aoSalvar }: { cliente: Cliente; aoSalvar: (novo: Cliente) => void }) {
  const inicial = { nome: cliente.nome, celular: telefone(cliente.telefone) }
  const [nome, setNome] = useState(inicial.nome)
  const [celular, setCelular] = useState(inicial.celular)
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(null)
  const [salvou, setSalvou] = useState(false)
  const formulario = useRef<HTMLFormElement>(null)
  const alterado = nome !== inicial.nome || celular !== inicial.celular

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setProblema(null)
    setSalvou(false)
    setEnviando(true)
    try {
      const novo = await api<Cliente>('PUT', `/api/clientes/${cliente.id}`, { nome: nome.trim(), telefone: celular.trim() })
      setNome(novo.nome)
      setCelular(telefone(novo.telefone))
      aoSalvar(novo)
      setSalvou(true)
      window.dispatchEvent(new Event(CONTA_ATUALIZADA))
    } catch (falha) {
      setProblema(comoProblema(falha))
      // O primeiro campo com erro recebe o foco: quem usa leitor de tela ouve o erro sem procurar.
      requestAnimationFrame(() => formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
    } finally {
      setEnviando(false)
    }
  }

  const erro = (campo: string) => problema?.erros?.[campo]
  return (
    <section className="perfil-m__bloco" aria-labelledby="t-contato">
      <h2 id="t-contato">Nome e contato</h2>
      <form ref={formulario} className="perfil-m__form" onSubmit={salvar} noValidate>
        <Campo id="nome" rotulo="Nome completo" erro={erro('nome')} ajuda="O motorista vê este nome no seu pedido.">
          <input id="nome" name="nome" className="campo__entrada" autoComplete="name" maxLength={100} value={nome}
            onChange={(e) => { setNome(e.target.value); setSalvou(false) }} aria-invalid={erro('nome') ? true : undefined}
            aria-describedby={erro('nome') ? 'nome-erro' : 'nome-ajuda'} />
        </Campo>
        <Campo id="celular" rotulo="Celular com WhatsApp" erro={erro('telefone')} ajuda="O motorista só recebe este número depois de fechar o frete com você.">
          <input id="celular" name="telefone" type="tel" className="campo__entrada" autoComplete="tel" placeholder="(00) 00000-0000" value={celular}
            onChange={(e) => { setCelular(e.target.value); setSalvou(false) }} aria-invalid={erro('telefone') ? true : undefined}
            aria-describedby={erro('telefone') ? 'celular-erro' : 'celular-ajuda'} />
        </Campo>
        <p className="campo__ajuda">O e-mail é a sua entrada no Fretaí e não muda por aqui.</p>
        {problema && !problema.erros && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}
        <button type="submit" className="botao botao--primario" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar'}</button>
        <div className="perfil__estado" aria-live="polite">{salvou && !alterado && <p className="perfil__ok">Dados salvos.</p>}</div>
      </form>
      <SairSemSalvar alterado={alterado && !enviando} />
    </section>
  )
}
