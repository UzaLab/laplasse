export interface RoomRateFields {
  nightly_rate?: number | null
  price?: number | null
  weekend_nightly_rate?: number | null
  peak_nightly_rate?: number | null
  peak_months?: unknown
  min_stay_nights?: number | null
}

export function parsePeakMonths(raw: unknown): number[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(v => (typeof v === 'number' ? v : Number(v)))
    .filter(n => Number.isInteger(n) && n >= 1 && n <= 12)
}

export function getBaseNightlyRate(service: RoomRateFields): number {
  return service.nightly_rate ?? service.price ?? 0
}

/** Tarif pour une nuit (date d'arrivée de la nuit, format YYYY-MM-DD). */
export function getNightlyRateForDate(service: RoomRateFields, dateStr: string): number {
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

export interface StayPricingResult {
  nights: number
  total: number
  averageNightly: number
  breakdown: Array<{ date: string; rate: number }>
}

export function countStayNights(checkIn: string, checkOut: string): number {
  const start = new Date(`${checkIn.slice(0, 10)}T12:00:00`)
  const end = new Date(`${checkOut.slice(0, 10)}T12:00:00`)
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000))
}

export function computeStayPricing(
  service: RoomRateFields,
  checkIn: string,
  checkOut: string,
): StayPricingResult | null {
  const nights = countStayNights(checkIn, checkOut)
  if (nights <= 0) return null

  const breakdown: Array<{ date: string; rate: number }> = []
  let total = 0
  const cursor = new Date(`${checkIn.slice(0, 10)}T12:00:00`)

  for (let i = 0; i < nights; i++) {
    const y = cursor.getFullYear()
    const m = String(cursor.getMonth() + 1).padStart(2, '0')
    const day = String(cursor.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${day}`
    const rate = getNightlyRateForDate(service, dateStr)
    breakdown.push({ date: dateStr, rate })
    total += rate
    cursor.setDate(cursor.getDate() + 1)
  }

  return {
    nights,
    total,
    averageNightly: Math.round(total / nights),
    breakdown,
  }
}

export function assertMinStay(
  service: RoomRateFields,
  checkIn: string,
  checkOut: string,
): string | null {
  const minStay = service.min_stay_nights ?? 1
  if (minStay <= 1) return null
  const nights = countStayNights(checkIn, checkOut)
  if (nights < minStay) {
    return `Séjour minimum : ${minStay} nuit${minStay > 1 ? 's' : ''}`
  }
  return null
}
