/**
 * Marca provisória: placa de asfalto com a faixa amarela e o nome.
 * O logo definitivo vem do dono do produto; quando chegar, troca só aqui (e em public/favicon.svg).
 */
export function Marca() {
  return (
    <span className="marca">
      <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
        <rect width="32" height="32" rx="6" fill="var(--cor-asfalto)" />
        <path d="M4 16h5M13.5 16h5M23 16h5" stroke="var(--cor-faixa)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      Fretaí
    </span>
  )
}
