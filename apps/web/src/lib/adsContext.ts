import { getIndependentShops, getShopsForMerchant, type ShopSummary } from './shopApi'
import type { AdEligibility, AdEligibilityProduct, AdEligibilityShop, AdTargetType } from './adsApi'

/** Contexte d'affichage des options publicitaires */
export type AdsContextKind =
  | 'merchant_only'
  | 'merchant_retail'
  | 'linked_shop'
  | 'standalone_shop'

export const ADS_CONTEXT_LABELS: Record<AdsContextKind, string> = {
  merchant_only: 'Fiche établissement',
  merchant_retail: 'Établissement + boutique',
  linked_shop: 'Boutique liée',
  standalone_shop: 'Boutique standalone',
}

export const ADS_CONTEXT_DESCRIPTIONS: Record<AdsContextKind, string> = {
  merchant_only:
    'Boostez la visibilité de votre fiche en recherche, sur la page d\'accueil et dans les listings catégorie.',
  merchant_retail:
    'Sponsorisez votre fiche établissement, votre boutique marketplace ou un produit spécifique.',
  linked_shop:
    'Mettez en avant cette boutique ou l\'un de ses produits sur la marketplace.',
  standalone_shop:
    'Mettez en avant votre boutique ou un produit sur la marketplace (sans fiche établissement).',
}

export const TARGET_HINTS: Record<AdTargetType, string> = {
  MERCHANT: 'Recherche, page d\'accueil, catégories verticales',
  SHOP: 'Carousel « Boutiques à la une » sur la marketplace',
  PRODUCT: 'Carousel « Produits à la une » sur la marketplace',
}

export function resolveAdsContext(
  pathname: string,
  shops: ShopSummary[] | undefined,
  activeMerchantId: string | null | undefined,
): AdsContextKind {
  if (pathname.startsWith('/shop/manage')) return 'standalone_shop'
  if (pathname.startsWith('/merchant/shop/visibility')) return 'linked_shop'

  const linkedShops = getShopsForMerchant(shops, activeMerchantId)
  return linkedShops.length > 0 ? 'merchant_retail' : 'merchant_only'
}

export function scopeEligibilityShops(
  context: AdsContextKind,
  shops: AdEligibilityShop[],
  activeMerchantId: string | null | undefined,
  activeShopId: string | null | undefined,
): AdEligibilityShop[] {
  switch (context) {
    case 'merchant_only':
      return []
    case 'merchant_retail':
      return shops.filter(s => s.merchant_id === activeMerchantId)
    case 'linked_shop':
      return activeShopId ? shops.filter(s => s.id === activeShopId) : []
    case 'standalone_shop':
      return activeShopId
        ? shops.filter(s => s.id === activeShopId && !s.merchant_id)
        : shops.filter(s => !s.merchant_id)
  }
}

export function scopeEligibilityProducts(
  shops: AdEligibilityShop[],
  products: AdEligibilityProduct[],
): AdEligibilityProduct[] {
  const shopIds = new Set(shops.map(s => s.id))
  return products.filter(p => shopIds.has(p.shop_id))
}

export function getAllowedTargets(
  context: AdsContextKind,
  eligibility: AdEligibility | null,
  scopedShops: AdEligibilityShop[],
  scopedProducts: AdEligibilityProduct[],
): AdTargetType[] {
  if (!eligibility) return []

  const targets: AdTargetType[] = []

  if (
    (context === 'merchant_only' || context === 'merchant_retail') &&
    eligibility.merchant?.eligible
  ) {
    targets.push('MERCHANT')
  }

  if (context !== 'merchant_only') {
    if (scopedShops.some(s => s.eligible)) targets.push('SHOP')
    if (scopedProducts.length > 0) targets.push('PRODUCT')
  }

  return targets
}

export function getAdsApiScope(
  context: AdsContextKind,
  activeMerchantId: string | null | undefined,
  activeShopId: string | null | undefined,
  shops: ShopSummary[] | undefined,
): { merchantId?: string | null; shopId?: string | null } {
  switch (context) {
    case 'merchant_only':
    case 'merchant_retail':
      return { merchantId: activeMerchantId, shopId: null }
    case 'linked_shop':
      return { merchantId: activeMerchantId, shopId: activeShopId }
    case 'standalone_shop': {
      const independent = getIndependentShops(shops)
      const shopId = independent.some(s => s.id === activeShopId)
        ? activeShopId
        : independent[0]?.id ?? null
      return { merchantId: null, shopId }
    }
  }
}

export function getContextSubjectLabel(
  context: AdsContextKind,
  eligibility: AdEligibility | null,
  scopedShops: AdEligibilityShop[],
): string | null {
  if (context === 'merchant_only' || context === 'merchant_retail') {
    return eligibility?.merchant?.business_name ?? null
  }
  return scopedShops[0]?.name ?? null
}
