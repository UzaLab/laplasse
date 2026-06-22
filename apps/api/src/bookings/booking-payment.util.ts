import { computeStayPricing, getBaseNightlyRate } from '../common/room-pricing'
import { formatLocalDate } from '../common/date-local'
import type { BookingType } from '../../generated/prisma/client'

interface ServiceRateFields {
  nightly_rate?: number | null
  price?: number | null
  weekend_nightly_rate?: number | null
  peak_nightly_rate?: number | null
  peak_months?: unknown
}

export function computeBookingBaseAmount(
  bookingType: BookingType,
  service: ServiceRateFields | null | undefined,
  bookedAt: Date,
  checkOutAt?: Date | null,
): number {
  if (!service) return 0

  if (bookingType === 'ROOM' && checkOutAt) {
    const stay = computeStayPricing(
      service,
      formatLocalDate(bookedAt),
      formatLocalDate(checkOutAt),
    )
    return stay?.total ?? 0
  }

  return service.price ?? getBaseNightlyRate(service) ?? 0
}

export function computeDepositAmount(baseAmount: number, depositPercent: number): number {
  if (baseAmount <= 0) return 0
  const pct = Math.min(100, Math.max(0, depositPercent))
  return Math.round((baseAmount * pct) / 100)
}

export function generatePaymentReference() {
  return `LP-SIM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}
