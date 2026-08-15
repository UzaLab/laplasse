import type { MerchantServiceConfig } from '@laplasse/api-client'

export interface StayPricingResult {
  nights: number
  total: number
  averageNightly: number
}

export function countStayNights(checkIn: string, checkOut: string): number {
  const start = new Date(`${checkIn.slice(0, 10)}T12:00:00`)
  const end = new Date(`${checkOut.slice(0, 10)}T12:00:00`)
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000))
}

function parsePeakMonths(raw: unknown): number[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(v => (typeof v === 'number' ? v : Number(v)))
    .filter(n => Number.isInteger(n) && n >= 1 && n <= 12)
}

function getBaseNightlyRate(service: MerchantServiceConfig): number {
  return service.nightly_rate ?? service.price ?? 0
}

function getNightlyRateForDate(service: MerchantServiceConfig, dateStr: string): number {
  const base = getBaseNightlyRate(service)
  if (!base) return 0

  const d = new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return base

  const month = d.getMonth() + 1
  const weekday = d.getDay()
  const peakMonths = parsePeakMonths(service.peak_months)

  if (service.peak_nightly_rate && peakMonths.includes(month)) {
    return service.peak_nightly_rate
  }
  if ((weekday === 5 || weekday === 6) && service.weekend_nightly_rate) {
    return service.weekend_nightly_rate
  }
  return base
}

export function computeStayPricing(
  service: MerchantServiceConfig,
  checkIn: string,
  checkOut: string,
): StayPricingResult | null {
  const nights = countStayNights(checkIn, checkOut)
  if (nights <= 0) return null

  let total = 0
  const cursor = new Date(`${checkIn.slice(0, 10)}T12:00:00`)

  for (let i = 0; i < nights; i++) {
    const y = cursor.getFullYear()
    const m = String(cursor.getMonth() + 1).padStart(2, '0')
    const day = String(cursor.getDate()).padStart(2, '0')
    total += getNightlyRateForDate(service, `${y}-${m}-${day}`)
    cursor.setDate(cursor.getDate() + 1)
  }

  return {
    nights,
    total,
    averageNightly: Math.round(total / nights),
  }
}

export function getMinStayNights(service: MerchantServiceConfig): number {
  return service.min_stay_nights ?? 1
}

export function formatDateInput(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatDisplayDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
