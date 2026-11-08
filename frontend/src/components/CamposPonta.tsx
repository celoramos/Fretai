import type { Ponta } from '../ponta'
import { Campo } from './ui'

/** CEP, número, complemento e referência de uma ponta. O exemplo de complemento muda: doca na empresa, apartamento na casa. */
export function CamposPonta({ id, titulo, exemploCep, exemploComplemento, ponta, mudar, erroCep }: {
  id: string
  titulo: string
  exemploCep: string
  exemploComplemento: string
  ponta: Ponta
  mudar: (p: Ponta) => void
  erroCep?: string
}) {
  const muda = (campo: keyof Ponta) => (e: { target: { value: string } }) => mudar({ ...ponta, [campo]: e.target.value })
  return (
    <div className="publicar__ponta">
      <p className="publicar__ponta-titulo">{titulo}</p>
      <Campo id={`${id}-cep`} rotulo="CEP" erro={erroCep}>
        <input id={`${id}-cep`} className="campo__entrada campo__entrada--cep" inputMode="numeric" autoComplete="off" spellCheck={false}
          maxLength={9} placeholder={exemploCep} value={ponta.cep} onChange={muda('cep')}
          aria-invalid={erroCep ? true : undefined} aria-describedby={erroCep ? `${id}-cep-erro` : undefined} />
      </Campo>
      <div className="publicar__linha publicar__linha--numero">
        <Campo id={`${id}-numero`} rotulo="Número">
          <input id={`${id}-numero`} className="campo__entrada" maxLength={20} autoComplete="off" value={ponta.numero} onChange={muda('numero')} />
        </Campo>
        <Campo id={`${id}-complemento`} rotulo="Complemento">
          <input id={`${id}-complemento`} className="campo__entrada" maxLength={255} autoComplete="off" placeholder={exemploComplemento} value={ponta.complemento} onChange={muda('complemento')} />
        </Campo>
      </div>
      <Campo id={`${id}-referencia`} rotulo="Ponto de referência">
        <input id={`${id}-referencia`} className="campo__entrada" maxLength={255} autoComplete="off" value={ponta.pontoReferencia} onChange={muda('pontoReferencia')} />
      </Campo>
    </div>
  )
}
