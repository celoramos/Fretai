import { api } from './api/cliente'
import type { LinkDocumento } from './api/tipos'

export const TIPOS_DOCUMENTO = [
  { valor: 'CNH', rotulo: 'CNH' },
  { valor: 'CRLV', rotulo: 'CRLV' },
  { valor: 'COMPROVANTE', rotulo: 'Outro comprovante' },
] as const

export const rotuloDocumento = (t: string) => TIPOS_DOCUMENTO.find((x) => x.valor === t)?.rotulo ?? t

/**
 * Abre um documento em aba nova. Cada chamada pede um link novo à API, que vence em minutos e fica
 * registrado como acesso. A aba abre já no clique: navegador bloqueia janela aberta depois de uma
 * espera de rede (platform fact). Se a API recusar, a aba vazia fecha e o erro sobe para a tela.
 */
export async function abrirDocumento(id: string) {
  const janela = window.open('', '_blank')
  try {
    const link = await api<LinkDocumento>('POST', `/api/documentos/${id}/link`)
    if (janela) janela.location.href = link.url
    else window.location.assign(link.url)
  } catch (falha) {
    janela?.close()
    throw falha
  }
}

const kb = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const mb = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
/** Tamanho do arquivo como o admin pensa nele: "48 KB", "2,3 MB". */
export const tamanhoArquivo = (bytes: number) =>
  bytes < 1024 * 1024 ? `${kb.format(Math.max(1, bytes / 1024))} KB` : `${mb.format(bytes / (1024 * 1024))} MB`

/** Formato pelo tipo do arquivo, que a API confere pelos primeiros bytes. */
export const formatoArquivo = (contentType: string) =>
  contentType === 'application/pdf' ? 'PDF' : contentType === 'image/png' ? 'PNG' : contentType === 'image/jpeg' ? 'JPEG' : contentType
