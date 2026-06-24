import { api, type ApiCategory, type ApiMerchant } from '@/lib/api'
import { fetchPublicJson, type FeaturedProduct, type MarketplaceSpotlightShop } from '@/lib/marketplaceApi'
import type { Category } from '@/types/merchant'

function toCategory(c: ApiCategory): Category {
  return { ...c, icon: c.icon ?? 'UtensilsCrossed' }
}

export interface HomeMobileData {
  categories: Category[]
  merchants: ApiMerchant[]
  products: FeaturedProduct[]
  shops: MarketplaceSpotlightShop[]
}

export async function fetchHomeMobileData(
  defaultCity: string,
  country: string,
): Promise<HomeMobileData> {
  const [categoriesRaw, merchantsRaw, productsRaw, spotlightRaw, marketplaceShopsRaw] =
    await Promise.allSettled([
      api.categories.list(),
      api.merchants.featured(defaultCity, 8, country),
      fetchPublicJson<FeaturedProduct[]>('/marketplace/featured'),
      fetchPublicJson<MarketplaceSpotlightShop[]>('/marketplace/spotlight'),
      fetchPublicJson<MarketplaceSpotlightShop[]>('/marketplace/merchants?limit=12'),
    ])

  const categories =
    categoriesRaw.status === 'fulfilled' ? categoriesRaw.value.map(toCategory) : []
  const merchants: ApiMerchant[] =
    merchantsRaw.status === 'fulfilled' ? merchantsRaw.value : []
  const products =
    productsRaw.status === 'fulfilled' && productsRaw.value.ok
      ? productsRaw.value.data.slice(0, 12)
      : []

  const spotlightShops =
    spotlightRaw.status === 'fulfilled' && spotlightRaw.value.ok
      ? spotlightRaw.value.data
      : []
  const marketplaceShops =
    marketplaceShopsRaw.status === 'fulfilled' && marketplaceShopsRaw.value.ok
      ? marketplaceShopsRaw.value.data
      : []
  const shops = spotlightShops.length > 0 ? spotlightShops : marketplaceShops

  return { categories, merchants, products, shops }
}
