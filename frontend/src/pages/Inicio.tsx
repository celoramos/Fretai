import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { Link } from 'react-router-dom'
import type { Endereco, Pagamento, PerfilEmpresa, Preco } from '../api/tipos'
import { Reputacao } from '../components/CardFrete'
import { ChipPiso, MedidorGarantia, SeloGarantido, Valor } from '../components/Dinheiro'
import { Marca } from '../components/Marca'
import { RotaLinha } from '../components/RotaLinha'
import { Indicador } from '../components/ui'
import { porKm } from '../formato'
import { transicao } from '../movimento'
import { useTitulo } from '../useTitulo'
import '../styles/inicio.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type Publico = 'motorista' | 'empresa'

/* Exemplo fixo, igual a um frete do modo demo e marcado "Exemplo" na tela. Nenhum número aqui é métrica. */
const lugar = (cidade: string, uf: string): Endereco => ({
  cep: '', logradouro: null, numero: null, complemento: null, bairro: null, cidade, uf,
  pontoReferencia: null, enderecoCompleto: `${cidade}/${uf}`, latitude: null, longitude: null,
})
const EXEMPLO = {
  coleta: lugar('Campinas', 'SP'),
  entrega: lugar('Rio de Janeiro', 'RJ'),
  km: 430,
  valor: 4850,
  preco: { pisoMinimo: 3920, eixosConsiderados: 5, coeficientesDeExemplo: true, abaixoDoPiso: false, acimaDaMedia: false, mediaRotaPorKm: null } satisfies Preco,
  perfil: {
    id: 'exemplo', razaoSocial: 'Cerâmica Paulista Ltda', nomeFantasia: 'Cerâmica Paulista', tipo: 'EMBARCADOR',
    naPlataformaDesde: '2025-01-01', mediaNotas: 4.8, quantidadeAvaliacoes: 0, fretesPublicados: 0, fretesConcluidos: 0,
    percentualSaldosPagosEmDia: 96,
  } as PerfilEmpresa,
  pagamento: {
    id: 'exemplo', freteId: 'exemplo', status: 'ADIANTAMENTO_LIBERADO', valorTotal: 5100, valorAdiantamento: 2040, valorSaldo: 3060,
    gateway: '', cobrancaId: null, pixCopiaECola: null, pixQrCodeBase64: null, vencimento: null, pagoEm: null,
    adiantamentoLiberadoEm: null, saldoLiberavelApos: null, saldoBloqueado: false, saldoLiberadoEm: null,
  } as Pagamento,
}

const CHAMADA: Record<Publico, { titulo: string; texto: string; acao: string }> = {
  motorista: {
    titulo: 'Frete com o dinheiro guardado antes de você carregar.',
    texto: 'A empresa paga por Pix quando aceita. Antes de topar, você vê o valor, o R$/km, o piso da ANTT e quantos saldos ela pagou em dia.',
    acao: 'Ver fretes perto de mim',
  },
  empresa: {
    titulo: 'Sua carga com motorista conferido e entrega com prova.',
    texto: 'Você paga por Pix no aceite e o valor fica retido. O saldo só sai com o canhoto: foto, assinatura do recebedor e GPS no destino.',
    acao: 'Entrar como empresa',
  },
}

const ETAPAS = [
  { marco: 'km 0', titulo: 'Aceite', texto: 'A empresa paga o frete inteiro por Pix. O dinheiro fica guardado, fora do alcance dela.' },
  { marco: 'saída', titulo: 'Adiantamento', texto: 'Quando você sai com a carga, a parte combinada de adiantamento cai na sua conta.' },
  { marco: 'entrega', titulo: 'Saldo', texto: 'Na entrega você registra o canhoto: foto, assinatura na tela e GPS a até 500 m do destino. O saldo cai.' },
]

const PERGUNTAS = [
  { p: 'E se a empresa não pagar o saldo?', r: 'O frete inteiro já foi pago por Pix no aceite e fica retido. O saldo sai desse dinheiro guardado, não do bolso da empresa no fim da viagem.' },
  { p: 'Quando eu recebo?', r: 'O adiantamento cai quando você sai com a carga. O saldo cai quando o canhoto é registrado no destino.' },
  { p: 'O que é o piso da ANTT?', r: 'É o valor mínimo de frete definido pela Lei 13.703/2018. O Fretaí calcula o piso de cada frete e avisa quando a oferta está abaixo dele.' },
  { p: 'Quem vê meus documentos?', r: 'Só a empresa que aceitou você naquele frete, por um link que expira. Fica registrado quem abriu.' },
  { p: 'E se o recebedor discordar da entrega?', r: 'Ele recebe um código por WhatsApp e pode contestar. Enquanto a contestação é analisada, o saldo fica parado.' },
]

export function Inicio() {
  useTitulo('Frete com pagamento garantido')
  const [publico, setPublico] = useState<Publico>('motorista')
  const chamada = CHAMADA[publico]
  const estrada = useRef<HTMLElement>(null)

  /* A assinatura na página pública: a pista se desenha conforme a rolagem (scrub), e cada etapa acende
     quando a pista chega nela. Com movimento reduzido o GSAP não registra nada e a pista fica inteira. */
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('.estrada__etapas', { '--trajeto': '100%' }, {
        '--trajeto': '0%', ease: 'none',
        scrollTrigger: { trigger: '.estrada__etapas', start: 'top 75%', end: 'bottom 55%', scrub: true },
      })
      gsap.utils.toArray<HTMLElement>('.estrada__etapa').forEach((el) => {
        gsap.from(el, {
          opacity: 0.25, x: 12, duration: 0.4, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 65%', toggleActions: 'play none none reverse' },
        })
      })
    })
  }, { scope: estrada })

  return (
    <div className="inicio">
      <header className="inicio__topo">
        <Marca />
        <nav aria-label="Atalhos" className="inicio__atalhos">
          <a href="#como-funciona">Como funciona</a>
          <a href="#duvidas">Dúvidas</a>
        </nav>
        <Link to="/entrar" className="botao botao--primario inicio__pilula">Entrar</Link>
      </header>

      <main id="conteudo">
        <section className="inicio__abertura" aria-labelledby="inicio-titulo">
          <div className="inicio__chamada">
            <div className="segmentado inicio__publico" role="group" aria-label="Você é">
              {(['motorista', 'empresa'] as const).map((p) => (
                <button key={p} type="button" className="segmentado__opcao" aria-pressed={publico === p} onClick={() => setPublico(p)}>
                  {publico === p && <Indicador id="publico" forma="fundo" />}
                  {p === 'motorista' ? 'Sou motorista' : 'Tenho carga'}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={publico} className="inicio__texto" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={transicao}>
                <h1 id="inicio-titulo" className="inicio__titulo">{chamada.titulo}</h1>
                <p className="inicio__sub">{chamada.texto}</p>
                <Link to="/entrar" className="botao botao--primario inicio__pilula inicio__acao">{chamada.acao}</Link>
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {publico === 'motorista' ? (
              <motion.article key="frete" className="inicio__cartao inicio__exemplo" aria-label="Exemplo de frete"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={transicao}>
                <p className="inicio__rotulo">Exemplo de frete</p>
                <RotaLinha coleta={EXEMPLO.coleta} entrega={EXEMPLO.entrega} distanciaKm={EXEMPLO.km} grande />
                <div className="inicio__dinheiro">
                  <Valor valor={EXEMPLO.valor} tamanho="grande" />
                  <span className="inicio__porkm">R$&nbsp;{porKm(EXEMPLO.valor, EXEMPLO.km)}/km</span>
                </div>
                <ChipPiso preco={EXEMPLO.preco} valor={EXEMPLO.valor} />
                <SeloGarantido />
                <Reputacao nome={EXEMPLO.perfil.nomeFantasia ?? ''} perfil={EXEMPLO.perfil} />
              </motion.article>
            ) : (
              <motion.article key="pagamento" className="inicio__cartao inicio__exemplo" aria-label="Exemplo de pagamento acompanhado"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={transicao}>
                <p className="inicio__rotulo">Exemplo de pagamento</p>
                <RotaLinha coleta={lugar('Jundiaí', 'SP')} entrega={lugar('Curitiba', 'PR')} distanciaKm={470} grande />
                <MedidorGarantia pagamento={EXEMPLO.pagamento} />
                <p className="inicio__nota">O saldo de R$&nbsp;3.060 sai quando o motorista registrar o canhoto no destino.</p>
              </motion.article>
            )}
          </AnimatePresence>
        </section>

        <section id="como-funciona" ref={estrada} className="inicio__secao estrada" aria-labelledby="estrada-titulo">
          <h2 id="estrada-titulo" className="inicio__h2">Como o dinheiro anda</h2>
          <p className="inicio__sub">Três paradas, do aceite à entrega. Em cada uma você sabe onde está o dinheiro.</p>
          <ol className="estrada__etapas">
            {ETAPAS.map((e) => (
              <li key={e.marco} className="estrada__etapa">
                <span className="estrada__marco">{e.marco}</span>
                <h3 className="estrada__titulo">{e.titulo}</h3>
                <p>{e.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="inicio__secao" aria-labelledby="protecao-titulo">
          <h2 id="protecao-titulo" className="inicio__h2">O que o Fretaí confere por você</h2>
          <ul className="inicio__protecoes">
            <li className="inicio__cartao">
              <h3 className="inicio__h3">Piso da ANTT em todo frete</h3>
              <p>Você vê o mínimo da lei ao lado do valor. Abaixo dele, aparece o aviso.</p>
              <ChipPiso preco={{ ...EXEMPLO.preco, abaixoDoPiso: true }} valor={2100} />
            </li>
            <li className="inicio__cartao">
              <h3 className="inicio__h3">Alerta de valor alto demais</h3>
              <p>Oferta muito acima da média da rota é golpe comum. O frete vem marcado.</p>
              <p className="inicio__alerta">Valor muito acima da média desta rota. Confira a empresa.</p>
            </li>
            <li className="inicio__cartao">
              <h3 className="inicio__h3">Reputação dos dois lados</h3>
              <p>Nota, fretes feitos e, da empresa, quantos saldos ela pagou em dia.</p>
              <Reputacao nome={EXEMPLO.perfil.nomeFantasia ?? ''} perfil={EXEMPLO.perfil} />
            </li>
            <li className="inicio__cartao">
              <h3 className="inicio__h3">Documentos sem WhatsApp</h3>
              <p>CNH e CRLV abrem por link que expira, só para a empresa que aceitou você.</p>
              <p className="inicio__trava">Visível para a empresa só após o aceite</p>
            </li>
          </ul>
        </section>

        <section id="duvidas" className="inicio__secao" aria-labelledby="duvidas-titulo">
          <h2 id="duvidas-titulo" className="inicio__h2">Dúvidas</h2>
          <div className="inicio__duvidas">
            {PERGUNTAS.map((q) => (
              <details key={q.p} className="inicio__duvida">
                <summary>{q.p}</summary>
                <p>{q.r}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="inicio__rodape">
        <Marca />
        <p>Frete com pagamento garantido antes de carregar.</p>
        <nav className="inicio__legal" aria-label="Documentos">
          <Link to="/privacidade">Privacidade</Link>
          <Link to="/termos">Termos de uso</Link>
        </nav>
        <Link to="/entrar" className="botao botao--secundario inicio__pilula">Entrar</Link>
      </footer>
    </div>
  )
}
