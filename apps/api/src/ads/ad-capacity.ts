import { AdPlacement } from '../../generated/prisma/client'

/** Capacité d'affichage simultanée par emplacement (campagnes ACTIVE). */
export const DEFAULT_PLACEMENT_CAPACITY: Record<AdPlacement, number> = {
  SEARCH: 3,
  FEATURED: 6,
  CATEGORY: 3,
  MARKETPLACE: 8,
  MARKETPLACE_FEATURED_PRODUCTS: 8,
}

export const ALL_AD_PLACEMENTS: AdPlacement[] = [
  'SEARCH',
  'FEATURED',
  'CATEGORY',
  'MARKETPLACE',
  'MARKETPLACE_FEATURED_PRODUCTS',
]
