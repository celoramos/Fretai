/**
 * Marca: a carreta-pista (símbolo do dono do produto, 2026-11-07; arquivos em design/marca/).
 * O baú é asfalto com a faixa amarela da pista; no escuro o corpo vira a cor do texto, como na
 * versão "escuro" do logo, porque o asfalto escuro some no fundo da cabine.
 * O nome ao lado é texto e é provisório: quando o nome mudar, troca só a palavra.
 */
export function Marca() {
  return (
    <span className="marca">
      <MarcaSimbolo />
      Fretaí
    </span>
  )
}

/** Só a carreta, sem o nome: o canto do cabeçalho de cada tela no celular, como no canvas. */
export function MarcaSimbolo() {
  return (
    <svg className="marca__simbolo" viewBox="8 56 240 156" width="37" height="24" aria-hidden="true">
      <path fill="var(--cor-marca)" d="M28 64H158A12 12 0 0 1 170 76V150A12 12 0 0 1 158 162H28A12 12 0 0 1 16 150V76A12 12 0 0 1 28 64Z" />
      <path fill="var(--cor-faixa)" d="M34 106H56V120H34Z M68 106H90V120H68Z M102 106H124V120H102Z M136 106H158V120H136Z" />
      <path fillRule="evenodd" fill="var(--cor-marca)" d="M178 92H212Q218 92 222 97L238 120Q240 123 240 127V162H178Z M192 104L210 104L224 124L192 124Z" />
      <path fill="var(--cor-marca)" d="M34 186A18 18 0 1 0 70 186A18 18 0 1 0 34 186Z M78 186A18 18 0 1 0 114 186A18 18 0 1 0 78 186Z M190 186A18 18 0 1 0 226 186A18 18 0 1 0 190 186Z" />
    </svg>
  )
}
