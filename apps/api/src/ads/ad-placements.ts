import { AdPlacement, AdTargetType } from '../../generated/prisma/client'

export const DISCOVERY_PLACEMENTS: AdPlacement[] = ['SEARCH', 'FEATURED', 'CATEGORY']

export const PLACEMENTS_BY_TARGET: Record<AdTargetType, AdPlacement[]> = {
  MERCHANT: ['SEARCH', 'FEATURED', 'CATEGORY'],
  SHOP: ['MARKETPLACE'],
  PRODUCT: ['MARKETPLACE_FEATURED_PRODUCTS'],
}

export const PLACEMENT_LABELS: Record<AdPlacement, string> = {
  SEARCH: 'Top recherche',
  FEATURED: "Page d'accueil",
  CATEGORY: 'Listing catégorie',
  MARKETPLACE: 'Boutiques à la une',
  MARKETPLACE_FEATURED_PRODUCTS: 'Produits à la une',
}

export const TARGET_LABELS: Record<AdTargetType, string> = {
  MERCHANT: 'Mon établissement',
  SHOP: 'Ma boutique',
  PRODUCT: 'Un produit',
}

export function assertPlacementForTarget(targetType: AdTargetType, placement: AdPlacement) {
  const allowed = PLACEMENTS_BY_TARGET[targetType]
  if (!allowed.includes(placement)) {
    throw new Error(`Placement ${placement} incompatible avec la cible ${targetType}`)
  }
}

export function discoveryPlacement(placement: AdPlacement): boolean {
  return DISCOVERY_PLACEMENTS.includes(placement)
}
