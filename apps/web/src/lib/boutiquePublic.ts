import { api, type ApiMerchantDetail } from '@/lib/api'
import type { BoutiqueDisplay } from '@/features/marketplace/components/BoutiquePageClient'

export interface ApiPublicShop {
  id: string
  name: string
  slug: string
  description?: string | null
  logo?: string | null
  cover_image?: string | null
  phone?: string | null
  whatsapp?: string | null
  city?: string | null
  district?: string | null
  merchant_id?: string | null
  merchant?: {
    slug: string
    is_active?: boolean
  } | null
}

function merchantToBoutiqueDisplay(merchant: ApiMerchantDetail): BoutiqueDisplay {
  return {
    business_name: merchant.business_name,
    slug: merchant.slug,
    logo: merchant.logo,
    cover_image: merchant.cover_image,
    phone: merchant.phone,
    whatsapp: merchant.whatsapp,
    location: merchant.location,
    establishment_slug: merchant.slug,
  }
}

function shopToBoutiqueDisplay(shop: ApiPublicShop): BoutiqueDisplay {
  const merchantActive = shop.merchant?.is_active !== false
  return {
    business_name: shop.name,
    slug: shop.slug,
    logo: shop.logo,
    cover_image: shop.cover_image,
    phone: shop.phone,
    whatsapp: shop.whatsapp,
    location: shop.city ? { city: shop.city, district: shop.district ?? null } : null,
    establishment_slug:
      shop.merchant_id && merchantActive && shop.merchant?.slug
        ? shop.merchant.slug
        : null,
  }
}

/** Résout une vitrine publique par slug établissement ou slug boutique. */
export async function resolveBoutiqueDisplay(slug: string): Promise<BoutiqueDisplay | null> {
  try {
    const merchant = await api.merchants.bySlug(slug)
    return merchantToBoutiqueDisplay(merchant)
  } catch {
    // Pas un établissement — essayer une boutique standalone ou liée
  }

  try {
    const shop = await api.shops.bySlug(slug)
    return shopToBoutiqueDisplay(shop)
  } catch {
    return null
  }
}
