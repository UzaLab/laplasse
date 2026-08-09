import { Linking } from 'react-native'

export function normalizePhoneForWhatsApp(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function openWhatsApp(phone: string, message?: string): void {
  const digits = normalizePhoneForWhatsApp(phone)
  if (!digits) return
  const base = `https://wa.me/${digits}`
  const url = message ? `${base}?text=${encodeURIComponent(message)}` : base
  void Linking.openURL(url)
}
