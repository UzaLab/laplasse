import { useQuery } from '@tanstack/react-query'
import { getDefaultCity } from '@laplasse/shared-config'
import { getApiClient } from '@/src/lib/api'

export function useHomeData(countryCode: string) {
  const city = getDefaultCity(countryCode)
  const api = getApiClient()

  return useQuery({
    queryKey: ['home', city, countryCode],
    queryFn: async () => {
      const [categories, merchants, products, spotlight, shopsFallback] = await Promise.allSettled([
        api.getCategories(),
        api.getFeaturedMerchants(city, 8, countryCode),
        api.getMarketplaceFeatured(),
        api.getMarketplaceSpotlight(),
        api.getMarketplaceShops(12),
      ])

      const spotlightShops =
        spotlight.status === 'fulfilled' ? spotlight.value : []
      const fallbackShops =
        shopsFallback.status === 'fulfilled' ? shopsFallback.value : []

      if (categories.status === 'rejected' && merchants.status === 'rejected') {
        throw new Error('API indisponible')
      }

      return {
        categories: categories.status === 'fulfilled' ? categories.value : [],
        merchants: merchants.status === 'fulfilled' ? merchants.value : [],
        products:
          products.status === 'fulfilled'
            ? products.value.slice(0, 12)
            : [],
        shops: spotlightShops.length > 0 ? spotlightShops : fallbackShops,
        city,
      }
    },
  })
}
