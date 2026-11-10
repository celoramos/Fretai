/** Distância em linha reta entre dois pontos (haversine), em km. Serve para avisar o motorista
 *  antes de enviar o canhoto; quem decide se vale é a API, com o mesmo limite de 500 m. */
export function distanciaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371
  const rad = (g: number) => (g * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

const ESPERA_MS = 10_000
const SEM_RESPOSTA = 'Não deu para pegar o GPS agora. Vá para perto de uma janela ou área aberta e tente de novo.'

/**
 * Posição atual do aparelho. Rejeita com a mensagem que o motorista precisa ler. Desiste em 10 s,
 * também quando a pessoa nunca responde à pergunta do navegador (o timeout do GPS só conta depois dela).
 */
export function posicaoAtual(): Promise<{ lat: number; lng: number; precisaoM: number }> {
  return new Promise((resolver, rejeitar) => {
    if (!('geolocation' in navigator)) {
      rejeitar(new Error('Este aparelho não informa a localização.'))
      return
    }
    const desistir = window.setTimeout(() => rejeitar(new Error(SEM_RESPOSTA)), ESPERA_MS)
    navigator.geolocation.getCurrentPosition(
      (p) => { window.clearTimeout(desistir); resolver({ lat: p.coords.latitude, lng: p.coords.longitude, precisaoM: p.coords.accuracy }) },
      (e) => {
        window.clearTimeout(desistir)
        rejeitar(new Error(e.code === e.PERMISSION_DENIED ? 'A localização está bloqueada. Libere nas configurações do navegador.' : SEM_RESPOSTA))
      },
      { enableHighAccuracy: true, timeout: ESPERA_MS, maximumAge: 30_000 },
    )
  })
}
