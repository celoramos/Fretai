/**
 * Link de conversa no WhatsApp para o telefone do outro lado do frete. A API devolve só dígitos, mas o
 * link tem que sair igual para qualquer formato: "(71) 98877-1234", "+55 71 98877-1234", "71988771234".
 * O wa.me quer o número com o código do país (55) e sem nada além de dígitos.
 */
export function linkWhatsApp(telefone: string, texto?: string): string {
  let digitos = telefone.replace(/\D/g, '')
  // DDD + número tem 10 ou 11 dígitos; com o 55 na frente, 12 ou 13.
  if (digitos.length >= 12 && digitos.startsWith('55')) digitos = digitos.slice(2)
  const base = `https://wa.me/55${digitos}`
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base
}
