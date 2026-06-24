import { api, type ApiCategory, type ApiMerchant } from '@/lib/api'
import type { Category } from '@/types/merchant'

function toCategory(c: ApiCategory): Category {
  return { ...c, icon: c.icon ?? 'UtensilsCrossed' }
}

export interface SearchMobileData {
  categories: Category[]
  merchants: ApiMerchant[]
}

export async function fetchSearchMobileData(
  defaultCity: string,
  country: string,
): Promise<SearchMobileData> {
  const [categoriesRaw, merchantsRaw] = await Promise.allSettled([
    api.categories.list(),
    api.merchants.featured(defaultCity, 12, country),
  ])

  return {
    categories:
      categoriesRaw.status === 'fulfilled' ? categoriesRaw.value.map(toCategory) : [],
    merchants: merchantsRaw.status === 'fulfilled' ? merchantsRaw.value : [],
  }
}

/** Établissements avec coordonnées exploitables sur la carte. */
export function merchantsWithCoords(merchants: ApiMerchant[]): ApiMerchant[] {
  return merchants.filter(
    m => m.location?.latitude != null && m.location?.longitude != null,
  )
}

export function buildSearchResultsUrl(params: {
  q?: string
  category?: string
  city?: string
}): string {
  const qs = new URLSearchParams()
  if (params.q?.trim()) qs.set('q', params.q.trim())
  if (params.category) qs.set('category', params.category)
  if (params.city) qs.set('city', params.city)
  const query = qs.toString()
  return query ? `/search?${query}` : '/search'
}
