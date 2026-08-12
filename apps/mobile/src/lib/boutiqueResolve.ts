import type { ApiMerchantDetail, ApiShopPublic, MarketplaceProduct } from '@laplasse/api-client'
import { getApiClient } from '@/src/lib/api'
import { getMerchantVertical } from '@/src/lib/merchantVertical'

export interface BoutiqueResolved {
  merchant: ApiMerchantDetail | null
  shop: ApiShopPublic | null
  shopSlug: string
  displayName: string
}

export async function resolveBoutique(slug: string): Promise<BoutiqueResolved | null> {
  const api = getApiClient()

  let merchant: ApiMerchantDetail | null = null
  let shop: ApiShopPublic | null = null

  try {
    merchant = (await api.getMerchant(slug)) as ApiMerchantDetail
  } catch {
    // Not a merchant slug — try shop below
  }

  try {
    shop = await api.getShop(slug)
  } catch {
    // Not a shop slug either
  }

  if (merchant && !shop) {
    try {
      shop = await api.getShop(merchant.slug)
    } catch {
      // Products may still be available via merchant slug
    }
  }

  if (shop && !merchant && shop.merchant?.slug && shop.merchant.is_active !== false) {
    try {
      merchant = (await api.getMerchant(shop.merchant.slug)) as ApiMerchantDetail
    } catch {
      // Shop-only storefront
    }
  }

  if (!merchant && !shop) return null

  const shopSlug = shop?.slug ?? merchant!.slug
  const displayName = merchant?.business_name ?? shop?.name ?? slug

  return { merchant, shop, shopSlug, displayName }
}

export function getBoutiquePath(shopSlug: string): `/m/${string}/boutique` {
  return `/m/${shopSlug}/boutique`
}

/** Standalone shop ou boutique liée à un établissement → accès direct catalogue. */
export function shouldOpenBoutiqueDirect(resolved: BoutiqueResolved): boolean {
  const { merchant, shop } = resolved
  if (!merchant && shop) return true
  if (!merchant) return false

  const vertical = getMerchantVertical(merchant.category.slug)
  if (vertical === 'appointment' || vertical === 'hotel' || vertical === 'food') return false
  if (vertical === 'retail') return true
  return !!(shop || merchant.has_marketplace)
}

export function resolveProductBoutiqueSlug(
  product: MarketplaceProduct,
  routeSlug: string,
  resolved?: BoutiqueResolved | null,
): string {
  return product.shop?.slug ?? resolved?.shopSlug ?? product.merchant?.slug ?? routeSlug
}

export async function loadBoutiqueProducts(
  shopSlug: string,
  merchantSlug?: string | null,
): Promise<MarketplaceProduct[]> {
  const api = getApiClient()

  try {
    const products = await api.getShopProducts(shopSlug)
    if (products.length > 0) return products
  } catch {
    // Fall back to merchant products endpoint
  }

  if (merchantSlug) {
    try {
      const res = await api.getMerchantProducts(merchantSlug, 24, 0)
      return res.data
    } catch {
      return []
    }
  }

  return []
}
