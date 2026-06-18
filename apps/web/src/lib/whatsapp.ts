/** Normalise un numéro pour wa.me (chiffres uniquement, indicatif CI si besoin). */
export function normalizeWhatsAppNumber(phone: string): string {
  let digits = phone.replace(/\D/g, '')
  if (!digits) return ''

  // 07XXXXXXXX → 22507XXXXXXXX (Côte d'Ivoire)
  if (digits.startsWith('0') && digits.length === 10) {
    digits = `225${digits.slice(1)}`
  }

  return digits
}

export function getWhatsAppUrl(phone: string): string {
  const normalized = normalizeWhatsAppNumber(phone)
  return normalized ? `https://wa.me/${normalized}` : '#'
}

function trackWhatsAppClick(merchantId: string) {
  if (!merchantId) return
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/${merchantId}/interaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: 'WHATSAPP_CLICK' }),
  }).catch(() => {})
}

export function openWhatsApp(phone: string, merchantId?: string) {
  const url = getWhatsAppUrl(phone)
  if (url === '#') return
  if (merchantId) trackWhatsAppClick(merchantId)
  window.open(url, '_blank', 'noopener,noreferrer')
}
