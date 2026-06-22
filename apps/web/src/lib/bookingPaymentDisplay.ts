import type { BookingSettingsConfig } from '@/lib/bookingConfig'

/** Montant de base + acompte affichés avant réservation (hôtel, spa, consultation). */
export function computeBookingPaymentPreview(
  baseAmount: number | null | undefined,
  settings?: BookingSettingsConfig | null,
): {
  baseAmount: number
  depositPercent: number
  dueNow: number
  requirePayment: boolean
} | null {
  if (baseAmount == null || baseAmount <= 0) return null
  const requirePayment = settings?.require_payment ?? false
  if (!requirePayment) {
    return { baseAmount, depositPercent: 0, dueNow: 0, requirePayment: false }
  }
  const depositPercent = Math.min(100, Math.max(0, settings?.deposit_percent ?? 100))
  const dueNow = Math.round((baseAmount * depositPercent) / 100)
  return { baseAmount, depositPercent, dueNow, requirePayment: true }
}

export function bookingPaymentFootnote(
  preview: ReturnType<typeof computeBookingPaymentPreview>,
): string {
  if (!preview?.requirePayment) {
    return 'Confirmation par l\'établissement — sans débit immédiat.'
  }
  if (preview.depositPercent >= 100) {
    return 'Paiement intégral demandé à la confirmation de la réservation.'
  }
  return `Acompte de ${preview.depositPercent} % (${preview.dueNow.toLocaleString('fr-FR')} F) à payer à la confirmation.`
}
