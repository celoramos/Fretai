import { iniciais } from '../formato'

/** As iniciais no círculo, como no canvas. É decoração: quem usa diz o nome no rótulo do botão ou link. */
export function Avatar({ nome, grande = false }: { nome: string | null | undefined; grande?: boolean }) {
  return (
    <span className={grande ? 'avatar avatar--grande' : 'avatar'} aria-hidden="true">
      {iniciais(nome)}
    </span>
  )
}
