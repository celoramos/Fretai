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

/** Posição atual do aparelho. Rejeita com a mensagem que o motorista precisa ler. */
export function posicaoAtual(): Promise<{ lat: number; lng: number; precisaoM: number }> {
  return new Promise((resolver, rejeitar) => {
    if (!('geolocation' in navigator)) {
      rejeitar(new Error('Este aparelho não informa a localização.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolver({ lat: p.coords.latitude, lng: p.coords.longitude, precisaoM: p.coords.accuracy }),
      (e) => rejeitar(new Error(e.code === e.PERMISSION_DENIED
        ? 'A localização está bloqueada. Libere nas configurações do navegador.'
        : 'Não deu para pegar o GPS agora. Vá para perto de uma janela ou área aberta e tente de novo.')),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
    )
  })
}
