/*
 * Foto do canhoto. A câmera do celular entrega 4 a 12 MB; na estrada, com sinal fraco, isso não sobe.
 * A foto é reduzida a 1600 px no lado maior, em JPEG: ainda dá para ler a nota e ver a carga, e o
 * arquivo cai para algumas centenas de KB. A API aceita JPEG ou PNG de até 10 MB.
 */
const LADO_MAXIMO = 1600
const QUALIDADE = 0.82
const LIMITE_API = 10 * 1024 * 1024

export async function prepararFoto(arquivo: File): Promise<Blob> {
  try {
    const imagem = await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.width, imagem.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(imagem.width * escala)
    canvas.height = Math.round(imagem.height * escala)
    canvas.getContext('2d')?.drawImage(imagem, 0, 0, canvas.width, canvas.height)
    imagem.close()
    return await new Promise<Blob>((resolver, rejeitar) =>
      canvas.toBlob((b) => (b ? resolver(b) : rejeitar(new Error('sem blob'))), 'image/jpeg', QUALIDADE),
    )
  } catch {
    // Formato que o navegador não abre (ex.: HEIC no computador): vai o original, se couber.
    if (arquivo.size <= LIMITE_API && /^image\/(jpeg|png)$/.test(arquivo.type)) return arquivo
    throw new Error('Não deu para usar essa foto. Tire outra pela câmera do celular.')
  }
}
