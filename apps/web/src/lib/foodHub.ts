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
