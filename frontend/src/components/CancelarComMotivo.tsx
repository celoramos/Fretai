import { useId, useState } from 'react'
import { FecharFolha, Folha } from './Folha'

const OUTRO = 'Outro motivo'

/**
 * Confirmar um cancelamento ou uma desistência com o motivo obrigatório, como no canvas: três motivos
 * prontos e "Outro motivo", que abre um texto de até 500 caracteres. Sem motivo, confirmar fica
 * desabilitado. Quem usa faz a chamada e passa enviando e o erro.
 */
export function CancelarComMotivo({
  aberta, titulo, texto, pergunta, motivos, aviso, rotuloConfirmar, rotuloManter, enviando, erro, aoConfirmar, aoFechar,
}: {
  aberta: boolean
  titulo: string
  texto?: string
  pergunta: string
  motivos: string[]
  aviso?: string
  rotuloConfirmar: string
  rotuloManter: string
  enviando: boolean
  erro: string | null
  aoConfirmar: (motivo: string) => void
  aoFechar: () => void
}) {
  const id = useId()
  const [escolha, setEscolha] = useState<string | null>(null)
  const [outro, setOutro] = useState('')
  const [abertaAntes, setAbertaAntes] = useState(aberta)

  // Cada vez que abre, começa sem motivo: o de antes era de outra decisão. Ajuste durante o render,
  // como o React recomenda para estado que depende de uma prop, em vez de um efeito.
  if (aberta !== abertaAntes) {
    setAbertaAntes(aberta)
    if (aberta) {
      setEscolha(null)
      setOutro('')
    }
  }

  const motivo = escolha === OUTRO ? outro.trim() : escolha

  return (
    <Folha aberta={aberta} rotulo={titulo} aoFechar={aoFechar}>
      <header className="folha__topo">
        <h2 className="folha__titulo">{titulo}</h2>
        <FecharFolha aoFechar={aoFechar} />
      </header>
      {texto && <p className="folha__texto">{texto}</p>}
      <fieldset className="motivos">
        <legend className="motivos__pergunta">{pergunta}</legend>
        {[...motivos, OUTRO].map((m) => (
          <label key={m} className="motivo">
            <input type="radio" name={`${id}-motivo`} checked={escolha === m} onChange={() => setEscolha(m)} />
            {m}
          </label>
        ))}
      </fieldset>
      {escolha === OUTRO && (
        <textarea
          className="campo__entrada campo__entrada--texto"
          aria-label="Motivo"
          placeholder="Conte em poucas palavras"
          maxLength={500}
          rows={3}
          value={outro}
          onChange={(e) => setOutro(e.target.value)}
        />
      )}
      {aviso && <p className="folha__aviso">{aviso}</p>}
      {erro && <p className="campo__erro" role="alert">{erro}</p>}
      <div className="folha__acoes">
        <button type="button" className="botao botao--secundario botao--largo" onClick={aoFechar}>
          {rotuloManter}
        </button>
        <button type="button" className="botao botao--perigo botao--largo" disabled={!motivo || enviando} onClick={() => motivo && aoConfirmar(motivo)}>
          {enviando ? 'Cancelando…' : rotuloConfirmar}
        </button>
      </div>
    </Folha>
  )
}
