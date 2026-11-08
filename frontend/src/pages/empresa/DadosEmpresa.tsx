import { useState, type FormEvent } from 'react'
import { api, comoProblema } from '../../api/cliente'
import type { Empresa, PerfilEmpresa, Problema } from '../../api/tipos'
import { useRecurso } from '../../api/useRecurso'
import { Reputacao } from '../../components/CardFrete'
import { SairSemSalvar } from '../../components/SairSemSalvar'
import { Aviso, Campo, Cartao, ErroCarga, Esqueleto } from '../../components/ui'
import { cnpj, mesAno, telefone, TIPO_EMPRESA } from '../../formato'
import { useSessao } from '../../sessao'
import { useTitulo } from '../../useTitulo'

/*
 * Dados da empresa, na ordem do que pesa: primeiro como o motorista vê a empresa (a mesma linha de
 * reputação que vai em cada frete publicado), depois o que a empresa muda (nome fantasia e telefone),
 * por fim o que vem da Receita e não muda por aqui.
 */
export function DadosEmpresa() {
  useTitulo('Dados da empresa')
  const { tokens } = useSessao()
  const id = tokens?.empresaId ?? ''
  const [estado, recarregar] = useRecurso(async () => {
    const [empresa, perfil] = await Promise.all([
      api<Empresa>('GET', `/api/empresas/${id}`),
      api<PerfilEmpresa>('GET', `/api/empresas/${id}/perfil`).catch(() => null),
    ])
    return { empresa, perfil }
  }, [id])
  // O PUT devolve a empresa: a tela troca os dados sem recarregar a página inteira.
  const [salva, setSalva] = useState<Empresa | null>(null)

  if (estado.fase === 'carregando') return <div className="conta">{estado.mostrarEsqueleto && <><Esqueleto linhas={3} /><Esqueleto linhas={4} /><Esqueleto linhas={3} /></>}</div>
  if (estado.fase === 'erro') return <div className="conta"><ErroCarga problema={estado.problema} tentarDeNovo={recarregar} /></div>

  const empresa = salva ?? estado.dados.empresa
  const { perfil } = estado.dados
  const nome = empresa.nomeFantasia ?? empresa.razaoSocial
  return (
    <div className="conta">
      <h1 className="titulo-pagina">{nome}</h1>

      <Cartao id="titulo-vitrine" titulo="Como o motorista vê a empresa">
        <Reputacao nome={nome} perfil={perfil ?? undefined} />
        {perfil && (
          <dl className="ficha">
            <div><dt>Desde</dt><dd>{mesAno(perfil.naPlataformaDesde)}</dd></div>
            <div><dt>Fretes</dt><dd>{perfil.fretesPublicados} publicados, {perfil.fretesConcluidos} concluídos</dd></div>
            <div>
              <dt>Avaliações</dt>
              <dd>{perfil.quantidadeAvaliacoes === 0 || perfil.mediaNotas == null ? 'nenhuma ainda'
                : `${perfil.quantidadeAvaliacoes}, média ${perfil.mediaNotas.toFixed(1).replace('.', ',')}`}</dd>
            </div>
            <div>
              <dt>Em dia</dt>
              <dd>{perfil.percentualSaldosPagosEmDia == null ? 'nenhum saldo pago ainda'
                : `${Math.round(perfil.percentualSaldosPagosEmDia)}% dos saldos pagos no prazo, em ${perfil.cobrancasConsideradas} ${perfil.cobrancasConsideradas === 1 ? 'cobrança' : 'cobranças'}`}</dd>
            </div>
          </dl>
        )}
        <p className="campo__ajuda">É a linha que acompanha cada frete da empresa na busca do motorista.</p>
      </Cartao>

      <Contato empresa={empresa} aoSalvar={setSalva} />

      <Cartao id="titulo-receita" titulo="Cadastro na Receita">
        <dl className="ficha">
          <div><dt>Razão social</dt><dd>{empresa.razaoSocial}</dd></div>
          <div><dt>CNPJ</dt><dd className="conta__cnpj">{cnpj(empresa.cnpj)}</dd></div>
          <div><dt>Tipo</dt><dd>{TIPO_EMPRESA[empresa.tipo]}</dd></div>
        </dl>
        <p className="campo__ajuda">Razão social e CNPJ vêm da Receita Federal e não mudam por aqui.</p>
      </Cartao>
    </div>
  )
}

function Contato({ empresa, aoSalvar }: { empresa: Empresa; aoSalvar: (nova: Empresa) => void }) {
  const inicial = { nomeFantasia: empresa.nomeFantasia ?? '', telefone: telefone(empresa.telefone) }
  const [nomeFantasia, setNomeFantasia] = useState(inicial.nomeFantasia)
  const [fone, setFone] = useState(inicial.telefone)
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(null)
  const [salvou, setSalvou] = useState(false)
  const alterado = nomeFantasia !== inicial.nomeFantasia || fone !== inicial.telefone

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setProblema(null)
    setSalvou(false)
    setEnviando(true)
    try {
      const nova = await api<Empresa>('PUT', `/api/empresas/${empresa.id}`, { nomeFantasia: nomeFantasia.trim() || null, telefone: fone.trim() })
      setNomeFantasia(nova.nomeFantasia ?? '')
      setFone(telefone(nova.telefone))
      aoSalvar(nova)
      setSalvou(true)
    } catch (falha) {
      setProblema(comoProblema(falha))
      requestAnimationFrame(() => document.querySelector<HTMLElement>('.conta [aria-invalid="true"]')?.focus())
    } finally {
      setEnviando(false)
    }
  }

  const erro = (c: string) => problema?.erros?.[c]
  return (
    <Cartao id="titulo-contato" titulo="Nome e contato">
      <form className="perfil__form" onSubmit={salvar} noValidate>
        <Campo id="nome-fantasia" rotulo="Nome fantasia" erro={erro('nomeFantasia')} ajuda="Aparece nos fretes no lugar da razão social. Em branco, vale a razão social.">
          <input id="nome-fantasia" className="campo__entrada" maxLength={255} autoComplete="organization" value={nomeFantasia}
            onChange={(e) => setNomeFantasia(e.target.value)} aria-invalid={erro('nomeFantasia') ? true : undefined}
            aria-describedby={erro('nomeFantasia') ? 'nome-fantasia-erro' : 'nome-fantasia-ajuda'} />
        </Campo>
        <Campo id="telefone-empresa" rotulo="Telefone com DDD" erro={erro('telefone')}>
          <input id="telefone-empresa" type="tel" className="campo__entrada" autoComplete="tel" placeholder="(19) 3210-4400" value={fone}
            onChange={(e) => setFone(e.target.value)} aria-invalid={erro('telefone') ? true : undefined}
            aria-describedby={erro('telefone') ? 'telefone-empresa-erro' : undefined} />
        </Campo>
        {problema && !problema.erros && <Aviso tom="perigo" titulo={problema.title}>{problema.detail}</Aviso>}
        <div className="perfil__estado" aria-live="polite">{salvou && !alterado && <p className="perfil__ok">Dados salvos.</p>}</div>
        {alterado && (
          <div className="perfil__botoes">
            <button type="submit" className="botao botao--primario" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar'}</button>
            <button type="button" className="botao botao--fantasma" onClick={() => { setNomeFantasia(inicial.nomeFantasia); setFone(inicial.telefone); setProblema(null) }}>
              Desfazer
            </button>
          </div>
        )}
      </form>
      <SairSemSalvar alterado={alterado && !enviando} />
    </Cartao>
  )
}
