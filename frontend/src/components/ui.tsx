import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { EventoFrete, Problema, StatusFrete } from '../api/tipos'
import { dataHora, MARCOS, quilometros, STATUS_FRETE, type Tom } from '../formato'
import { transicao } from '../movimento'

export function Etiqueta({ tom, children }: { tom: Tom; children: ReactNode }) {
  return <span className={`etiqueta etiqueta--${tom}`}>{children}</span>
}

export function StatusFreteEtiqueta({ status, visao }: { status: StatusFrete; visao: 'motorista' | 'contratante' }) {
  const s = STATUS_FRETE[status]
  return <Etiqueta tom={s.tom}>{s[visao]}</Etiqueta>
}

/** Distância no marco de asfalto da linha de rota, para listas. */
export function Km({ km }: { km: number }) {
  return <span className="km">{quilometros(km)}</span>
}

/** Placa: os caracteres em mono num contorno fino. O leitor de tela soletra letra por letra. */
export function Placa({ placa }: { placa: string }) {
  return (
    <span className="placa" aria-label={`Placa ${placa.split('').join(' ')}`}>
      <span aria-hidden="true">{placa}</span>
    </span>
  )
}

/**
 * Cada status é um marco de quilômetro numa linha. Os já passados ficam preenchidos;
 * o atual ganha um anel; os próximos ficam só no contorno.
 */
export function Marcos({
  status,
  eventos,
  visao,
  orientacao,
  motivoCancelamento,
}: {
  status: StatusFrete
  eventos: EventoFrete[]
  visao: 'motorista' | 'contratante'
  orientacao: 'vertical' | 'horizontal'
  motivoCancelamento?: string | null
}) {
  if (status === 'CANCELADO') {
    return (
      <Aviso tom="perigo" titulo="Frete cancelado">
        {motivoCancelamento ? `Motivo: ${motivoCancelamento}` : 'O frete foi cancelado antes da viagem.'}
      </Aviso>
    )
  }
  const atual = MARCOS.indexOf(status)
  // Quem foi direto de PUBLICADO para ACEITO não passou pela negociação: o marco some em vez de ficar "pulado".
  const passouPorNegociacao = eventos.some((e) => e.para === 'PROPOSTA_ENVIADA') || status === 'PROPOSTA_ENVIADA'
  const marcos = MARCOS.filter((m) => m !== 'PROPOSTA_ENVIADA' || passouPorNegociacao)

  return (
    <ol className={`marcos marcos--${orientacao}`}>
      {marcos.map((m) => {
        const i = MARCOS.indexOf(m)
        const fase = i < atual ? 'passado' : i === atual ? 'atual' : 'futuro'
        const quando = [...eventos].reverse().find((e) => e.para === m)?.ocorridoEm
        return (
          <li key={m} className={`marco marco--${fase}`} aria-current={fase === 'atual' ? 'step' : undefined}>
            <span className="marco__placa" aria-hidden="true" />
            <span className="marco__texto">
              <span className="marco__rotulo">{STATUS_FRETE[m][visao]}</span>
              {quando && <span className="marco__quando">{dataHora(quando)}</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function Aviso({ tom, titulo, children, acao }: { tom: 'info' | 'alerta' | 'perigo' | 'garantido'; titulo: string; children?: ReactNode; acao?: ReactNode }) {
  return (
    <div className={`aviso aviso--${tom}`} role={tom === 'perigo' ? 'alert' : undefined}>
      <p className="aviso__titulo">{titulo}</p>
      {children && <p className="aviso__texto">{children}</p>}
      {acao}
    </div>
  )
}

export function ErroCarga({ problema, tentarDeNovo }: { problema: Problema; tentarDeNovo: () => void }) {
  return (
    <Aviso tom="perigo" titulo={problema.title} acao={<button type="button" className="botao botao--secundario" onClick={tentarDeNovo}>Tentar de novo</button>}>
      {problema.detail}
    </Aviso>
  )
}

/** Rótulo, controle e, embaixo, o erro do campo ou a ajuda. Os ids ${id}-erro e ${id}-ajuda são os que o
 *  controle aponta em aria-describedby. */
export function Campo({ id, rotulo, erro, ajuda, children }: { id: string; rotulo: string; erro?: string; ajuda?: string; children: ReactNode }) {
  return (
    <div className="campo">
      <label htmlFor={id} className="campo__rotulo">{rotulo}</label>
      {children}
      {erro ? <p id={`${id}-erro`} className="campo__erro">{erro}</p> : ajuda ? <p id={`${id}-ajuda`} className="campo__ajuda">{ajuda}</p> : null}
    </div>
  )
}

/** Um assunto por cartão, com o título pequeno em cima (o padrão do perfil, da conta e do extrato). */
export function Cartao({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section className="cartao bloco" aria-labelledby={id}>
      <h2 id={id} className="bloco__titulo">{titulo}</h2>
      {children}
    </section>
  )
}

export function Vazio({ titulo, children, acao }: { titulo: string; children?: ReactNode; acao?: ReactNode }) {
  return (
    <div className="vazio">
      <p className="vazio__titulo">{titulo}</p>
      {children && <p className="vazio__texto">{children}</p>}
      {acao}
    </div>
  )
}

/** Esqueleto no formato do conteúdo que vai chegar, para a página não pular. */
export function Esqueleto({ linhas = 3 }: { linhas?: number }) {
  return (
    <div className="esqueleto cartao" aria-hidden="true">
      {Array.from({ length: linhas }, (_, i) => (
        <span key={i} className="esqueleto__linha" />
      ))}
    </div>
  )
}

/**
 * Marca do que está escolhido (aba, filtro, raio, item da navegação). Com o mesmo layoutId,
 * o Motion leva a marca da escolha antiga até a nova em vez de trocar de lugar num salto.
 * forma: "linha" é o sublinhado das abas e da navegação; "fundo" é o preenchimento de filtro e segmentado.
 */
export function Indicador({ id, forma }: { id: string; forma: 'linha' | 'linha-topo' | 'fundo' }) {
  return <motion.span layoutId={id} className={`indicador indicador--${forma}`} transition={transicao} aria-hidden="true" />
}
