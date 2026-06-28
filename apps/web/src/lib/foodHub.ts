import type { LucideIcon } from 'lucide-react'
import {
  Coffee,
  Pizza,
  Sandwich,
  UtensilsCrossed,
  Wine,
} from 'lucide-react'
import { FOOD_CATEGORY_SLUGS } from '@/lib/merchantVertical'
import type { ApiMerchant } from '@/lib/api'

/** Frais de livraison indicatif affiché sur les cartes hub (fallback). */
export const FOOD_HUB_DELIVERY_FEE_ESTIMATE = 1500

export const FOOD_HUB_CATEGORY_CHIPS: {
  slug: string
  label: string
  icon: LucideIcon
}[] = [
  { slug: 'restaurants', label: 'Gastronomie', icon: UtensilsCrossed },
  { slug: 'fast-food', label: 'Fast Food', icon: Sandwich },
  { slug: 'cafes', label: 'Cafés', icon: Coffee },
  { slug: 'bars-lounges', label: 'Bars & Lounge', icon: Wine },
]

export type FoodHubFilter = 'all' | 'fast' | 'top' | 'free_delivery'

export {
  RESTAURATION_MENU_ITEM_PARAM,
  menuItemDomId,
  restaurationMenuItemHref,
} from './restaurationLinks'

export function isFoodCategorySlug(slug: string): boolean {
  return FOOD_CATEGORY_SLUGS.has(slug)
}

export type FoodStatus = 'open' | 'paused' | 'closed'

export function computeFoodStatusClient(
  food_is_paused?: boolean,
  food_pause_until?: string | null,
): FoodStatus {
  if (!food_is_paused) return 'open'
  if (!food_pause_until) return 'closed'
  return new Date(food_pause_until) > new Date() ? 'paused' : 'open'
}

/** Horaires génériques établissement (MerchantHour, jour 0 = dimanche). */
export function isOpenFromMerchantHours(
  hours: Array<{ day: number; open_time: string | null; close_time: string | null; is_closed: boolean }>,
  now: Date = new Date(),
): boolean {
  if (!hours.length) return true
  const dayOfWeek = now.getDay()
  const todayHours = hours.find(h => h.day === dayOfWeek)
  if (!todayHours || todayHours.is_closed) return false
  if (!todayHours.open_time || !todayHours.close_time) return true

  const nowNum = now.getHours() * 100 + now.getMinutes()
  const [oh, om] = todayHours.open_time.split(':').map(Number)
  const [ch, cm] = todayHours.close_time.split(':').map(Number)
  return nowNum >= oh * 100 + om && nowNum < ch * 100 + cm
}

/**
 * Statut food affichable : pause manuelle + horaires food_opening_hours ou hours établissement.
 */
export function resolveMerchantFoodStatus(
  merchant: Pick<ApiMerchant, 'food_is_paused' | 'food_pause_until' | 'food_opening_hours'> & {
    hours?: ApiMerchant['hours']
  },
  now: Date = new Date(),
): FoodStatus {
  const pauseStatus = computeFoodStatusClient(merchant.food_is_paused, merchant.food_pause_until)
  if (pauseStatus !== 'open') return pauseStatus

  const foodHours = merchant.food_opening_hours
  if (foodHours && Object.keys(foodHours).length > 0) {
    return isWithinOpeningHours(foodHours as OpeningHours, now) ? 'open' : 'closed'
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

// ─── Horaires d'ouverture & pre-commande ───────────────────────────────────

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
type DayKey = typeof DAY_KEYS[number]

export interface DaySchedule {
  open: string  // "HH:MM"
  close: string // "HH:MM"
}
export type OpeningHours = Partial<Record<DayKey, DaySchedule | null>>

/**
 * Parse une chaîne "HH:MM" en {h, m}.
 */
function parseHHMM(time: string): { h: number; m: number } {
  const [h, m] = time.split(':').map(Number)
  return { h: h ?? 0, m: m ?? 0 }
}

/**
 * Calcule la prochaine heure d'ouverture à partir de `now`.
 * Retourne null si aucun créneau défini dans les 7 prochains jours.
 */
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

/**
 * Vérifie si le restaurant est actuellement dans ses heures d'ouverture.
 * Ne remplace pas food_is_paused — c'est une couche supplémentaire.
 */
export function isWithinOpeningHours(
  hours: OpeningHours | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!hours) return true // pas d'horaires configurés → considéré ouvert

  const dayKey = DAY_KEYS[now.getDay()]
  const schedule = hours[dayKey]
  if (!schedule) return false // fermé ce jour

  const { h: oh, m: om } = parseHHMM(schedule.open)
  const { h: ch, m: cm } = parseHHMM(schedule.close)

  const openMin = oh * 60 + om
  const closeMin = ch * 60 + cm
  const nowMin = now.getHours() * 60 + now.getMinutes()

  return nowMin >= openMin && nowMin < closeMin
}

/** Formate la prochaine ouverture pour l'affichage UI. */
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

/**
 * Phase 4 — ETA dynamique.
 * Si distanceKm est connu, adapte le buffer livraison :
 *   < 2 km → +15 min | 2–5 km → +20 min | > 5 km → +30 min
 * Sinon, buffer par défaut = 15 min.
 */
export function formatFoodEta(prepMinutes = 25, deliveryBufferOrDistance?: number, isDistance = false): string {
  let buffer = 15
  if (isDistance && deliveryBufferOrDistance != null) {
    const km = deliveryBufferOrDistance
    buffer = km < 2 ? 15 : km < 5 ? 20 : 30
  } else if (!isDistance && deliveryBufferOrDistance != null) {
    buffer = deliveryBufferOrDistance
  }
  const low = Math.max(10, prepMinutes)
  const high = low + buffer
  return `${low}–${high} min`
}

export function formatFoodEtaFromDistance(prepMinutes = 25, distanceKm?: number): string {
  return formatFoodEta(prepMinutes, distanceKm, true)
}

/** Montant restant pour atteindre le minimum de commande (hors livraison), ou null si OK / pas de minimum. */
export function foodMinOrderRemaining(
  minOrder: number | null | undefined,
  subtotal: number,
): number | null {
  if (minOrder == null || minOrder <= 0 || subtotal >= minOrder) return null
  return minOrder - subtotal
}

export function foodMinOrderMessage(
  minOrder: number | null | undefined,
  subtotal: number,
): string | null {
  const remaining = foodMinOrderRemaining(minOrder, subtotal)
  if (remaining == null) return null
  return `Encore ${remaining.toLocaleString('fr-FR')} FCFA pour atteindre le minimum de commande`
}

export function formatFoodMinOrderLabel(minOrder: number): string {
  return `Min. ${minOrder.toLocaleString('fr-FR')} FCFA`
}

/** Créneaux de pré-commande disponibles (côté client, miroir API). */
export function getUpcomingPreorderSlots(
  hours: OpeningHours | null | undefined,
  now: Date = new Date(),
  maxSlots = 12,
): Array<{ at: string; label: string }> {
  if (!hours) return []
  const slots: Array<{ at: string; label: string }> = []
  const minLeadMinutes = 45
  const stepMinutes = 90
  const earliest = new Date(now.getTime() + minLeadMinutes * 60_000)

  for (let daysAhead = 0; daysAhead <= 7 && slots.length < maxSlots; daysAhead++) {
    const candidate = new Date(now)
    candidate.setDate(candidate.getDate() + daysAhead)
    candidate.setHours(0, 0, 0, 0)

    const dayKey = DAY_KEYS[candidate.getDay()]
    const schedule = hours[dayKey]
    if (!schedule) continue

    const { h: oh, m: om } = parseHHMM(schedule.open)
    const { h: ch, m: cm } = parseHHMM(schedule.close)
    const openMin = oh * 60 + om
    const closeMin = ch * 60 + cm

    for (let t = openMin; t < closeMin && slots.length < maxSlots; t += stepMinutes) {
      const slotDate = new Date(candidate)
      slotDate.setHours(Math.floor(t / 60), t % 60, 0, 0)
      if (slotDate <= earliest) continue
      slots.push({
        at: slotDate.toISOString(),
        label: formatPreorderSlotLabel(slotDate, now),
      })
    }
  }
  return slots
}

function formatPreorderSlotLabel(slotDate: Date, now: Date): string {
  const isToday = slotDate.toDateString() === now.toDateString()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow = slotDate.toDateString() === tomorrow.toDateString()
  const time = slotDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `Aujourd'hui · ${time}`
  if (isTomorrow) return `Demain · ${time}`
  const days = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']
  return `${days[slotDate.getDay()]} ${time}`
}

export function merchantCuisineLabel(merchant: ApiMerchant): string {
  const tags = merchant.tags?.slice(0, 2) ?? []
  const parts = [merchant.category.name, ...tags].filter(Boolean)
  return parts.join(' · ')
}

export function merchantDisplayRating(merchant: ApiMerchant): { score: string; count: number } | null {
  if (merchant.avg_rating != null && merchant.review_count >= 1) {
    return { score: merchant.avg_rating.toFixed(1), count: merchant.review_count }
  }
  if (merchant.review_count < 3) return null
  const score = Math.min(5, Math.max(3, merchant.trust_score / 20))
  return { score: score.toFixed(1), count: merchant.review_count }
}

export function filterFoodMerchants(
  merchants: ApiMerchant[],
  opts: {
    category?: string
    query?: string
    filter?: FoodHubFilter
  },
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
        || m.tags.some(t => t.toLowerCase().includes(q)),
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
      list = list.filter(m => m.is_sponsored)
      break
    default:
      break
  }

  return list
}
