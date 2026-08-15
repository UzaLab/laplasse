import type { ApiMerchant } from '@laplasse/api-client'
import { businessDayFromDate } from '@laplasse/shared-config'
import { isFoodCategorySlug } from '@/src/lib/merchantVertical'

export const FOOD_HUB_DELIVERY_FEE_ESTIMATE = 1500

export const FOOD_HUB_CATEGORY_CHIPS = [
  { slug: 'restaurants', label: 'Gastronomie', icon: 'restaurant-outline' as const },
  { slug: 'fast-food', label: 'Fast Food', icon: 'fast-food-outline' as const },
  { slug: 'cafes', label: 'Cafés', icon: 'cafe-outline' as const },
  { slug: 'bars-lounges', label: 'Bars & Lounge', icon: 'wine-outline' as const },
]

export type FoodHubFilter = 'all' | 'fast' | 'top' | 'free_delivery'
export type FoodStatus = 'open' | 'paused' | 'closed'

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
type DayKey = typeof DAY_KEYS[number]

export interface DaySchedule {
  open: string
  close: string
}
export type OpeningHours = Partial<Record<DayKey, DaySchedule | null>>

export function computeFoodStatusClient(
  food_is_paused?: boolean,
  food_pause_until?: string | null,
): FoodStatus {
  if (!food_is_paused) return 'open'
  if (!food_pause_until) return 'closed'
  return new Date(food_pause_until) > new Date() ? 'paused' : 'open'
}

function parseHHMM(time: string): { h: number; m: number } {
  const [h, m] = time.split(':').map(Number)
  return { h: h ?? 0, m: m ?? 0 }
}

function getTodayFoodSchedule(
  at: Date,
  hours: OpeningHours | null | undefined,
): 'unset' | 'closed' | DaySchedule {
  if (!hours || Object.keys(hours).length === 0) return 'unset'
  const dayKey = DAY_KEYS[at.getDay()]
  if (!(dayKey in hours)) return 'unset'
  const schedule = hours[dayKey]
  if (!schedule) return 'closed'
  return schedule
}

function isWithinDaySchedule(schedule: DaySchedule, at: Date): boolean {
  const { h: oh, m: om } = parseHHMM(schedule.open)
  const { h: ch, m: cm } = parseHHMM(schedule.close)
  const openMin = oh * 60 + om
  const closeMin = ch * 60 + cm
  const nowMin = at.getHours() * 60 + at.getMinutes()
  return nowMin >= openMin && nowMin < closeMin
}

export function isWithinOpeningHours(
  hours: OpeningHours | null | undefined,
  now: Date = new Date(),
): boolean {
  const today = getTodayFoodSchedule(now, hours)
  if (today === 'unset') return true
  if (today === 'closed') return false
  return isWithinDaySchedule(today, now)
}

export function isOpenFromMerchantHours(
  hours: Array<{ day: number; open_time: string | null; close_time: string | null; is_closed: boolean }>,
  now: Date = new Date(),
): boolean {
  if (!hours.length) return true
  const dayOfWeek = businessDayFromDate(now)
  const todayHours = hours.find(h => h.day === dayOfWeek)
  if (!todayHours || todayHours.is_closed) return false
  if (!todayHours.open_time || !todayHours.close_time) return true
  const nowNum = now.getHours() * 100 + now.getMinutes()
  const [oh, om] = todayHours.open_time.split(':').map(Number)
  const [ch, cm] = todayHours.close_time.split(':').map(Number)
  return nowNum >= oh * 100 + om && nowNum < ch * 100 + cm
}

export function resolveMerchantFoodStatus(
  merchant: Pick<ApiMerchant, 'food_is_paused' | 'food_pause_until' | 'food_opening_hours'> & {
    hours?: Array<{ day: number; open_time: string | null; close_time: string | null; is_closed: boolean }>
  },
  now: Date = new Date(),
): FoodStatus {
  const pauseStatus = computeFoodStatusClient(merchant.food_is_paused, merchant.food_pause_until)
  if (pauseStatus !== 'open') return pauseStatus

  const foodToday = getTodayFoodSchedule(now, merchant.food_opening_hours as OpeningHours | null | undefined)
  if (foodToday === 'closed') return 'closed'
  if (foodToday !== 'unset') {
    return isWithinDaySchedule(foodToday, now) ? 'open' : 'closed'
  }

  if (merchant.hours?.length) {
    return isOpenFromMerchantHours(merchant.hours, now) ? 'open' : 'closed'
  }

  return 'open'
}

export function foodStatusLabel(status: FoodStatus): string {
  if (status === 'paused') return 'En pause'
  if (status === 'closed') return 'Fermé'
  return 'Ouvert'
}

export function foodPauseUntilLabel(food_pause_until?: string | null): string {
  if (!food_pause_until) return ''
  const d = new Date(food_pause_until)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function nextOpeningTime(
  hours: OpeningHours | null | undefined,
  now: Date = new Date(),
): Date | null {
  if (!hours) return null
  for (let daysAhead = 0; daysAhead <= 7; daysAhead++) {
    const candidate = new Date(now)
    candidate.setDate(candidate.getDate() + daysAhead)
    const dayKey = DAY_KEYS[candidate.getDay()]
    const schedule = hours[dayKey]
    if (!schedule) continue
    const { h, m } = parseHHMM(schedule.open)
    const openTime = new Date(candidate)
    openTime.setHours(h, m, 0, 0)
    if (openTime > now) return openTime
  }
  return null
}

export function nextOpeningLabel(nextOpen: Date | null): string {
  if (!nextOpen) return ''
  const now = new Date()
  const diffH = (nextOpen.getTime() - now.getTime()) / 3_600_000
  if (diffH < 24) {
    return `Ouvre à ${nextOpen.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  }
  const days = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam']
  const day = days[nextOpen.getDay()]
  const time = nextOpen.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `Ouvre ${day}. à ${time}`
}

export function formatFoodEtaFromDistance(prepMinutes = 25, distanceKm?: number): string {
  let buffer = 15
  if (distanceKm != null) {
    buffer = distanceKm < 2 ? 15 : distanceKm < 5 ? 20 : 30
  }
  const low = Math.max(10, prepMinutes)
  const high = low + buffer
  return `${low}–${high} min`
}

export function formatFoodMinOrderLabel(minOrder: number): string {
  return `Min. ${minOrder.toLocaleString('fr-FR')} FCFA`
}

export function merchantCuisineLabel(merchant: ApiMerchant): string {
  const tags = merchant.tags?.slice(0, 2) ?? []
  const parts = [merchant.category.name, ...tags].filter(Boolean)
  return parts.join(' · ')
}

export function merchantDisplayRating(
  merchant: ApiMerchant,
): { score: string; count: number } | null {
  if (merchant.avg_rating != null && merchant.review_count >= 1) {
    return { score: merchant.avg_rating.toFixed(1), count: merchant.review_count }
  }
  if (merchant.review_count < 3) return null
  const score = Math.min(5, Math.max(3, merchant.trust_score / 20))
  return { score: score.toFixed(1), count: merchant.review_count }
}

export function filterFoodMerchants(
  merchants: ApiMerchant[],
  opts: { category?: string; query?: string; filter?: FoodHubFilter },
): ApiMerchant[] {
  let list = [...merchants]
  if (opts.category && isFoodCategorySlug(opts.category)) {
    list = list.filter(m => m.category.slug === opts.category)
  }
  const q = opts.query?.trim().toLowerCase()
  if (q) {
    list = list.filter(
      m =>
        m.business_name.toLowerCase().includes(q)
        || m.category.name.toLowerCase().includes(q)
        || (m.tags ?? []).some(t => t.toLowerCase().includes(q)),
    )
  }
  switch (opts.filter) {
    case 'fast':
      list = list.filter(m => (m.food_prep_minutes ?? 25) <= 30)
      break
    case 'top':
      list = list.sort((a, b) => (b.trust_score ?? 0) - (a.trust_score ?? 0))
      break
    case 'free_delivery':
      list = list.filter(m => m.has_active_promo)
      break
    default:
      break
  }
  return list
}

export function merchantSearchRating(merchant: ApiMerchant): string | null {
  if (merchant.avg_rating != null && merchant.review_count >= 1) {
    return merchant.avg_rating.toFixed(1)
  }
  if (merchant.trust_score > 0) return (merchant.trust_score / 20).toFixed(1)
  return null
}

export function merchantLocationLine(merchant: ApiMerchant): string {
  const district = merchant.location?.district
  const city = merchant.location?.city
  const parts = [district, city].filter(Boolean)
  const base = parts.join(', ') || city || ''
  if (merchant.distance_km != null && merchant.distance_km > 0) {
    return base ? `${base} · ${merchant.distance_km.toFixed(1)} km` : `${merchant.distance_km.toFixed(1)} km`
  }
  return base
}
