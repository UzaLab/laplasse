import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
    staleTime: 10 * 60 * 1000, // 10 min — catégories changent rarement
  })
}

export function useFeaturedMerchants(city = 'Abidjan', limit = 3) {
  return useQuery({
    queryKey: ['merchants', 'featured', city, limit],
    queryFn: () => api.merchants.featured(city, limit),
  })
}

export function useNearbyMerchants(city = 'Abidjan', district?: string, limit = 6) {
  return useQuery({
    queryKey: ['merchants', 'nearby', city, district, limit],
    queryFn: () => api.merchants.nearby(city, district, limit),
  })
}

export function useMerchant(slug: string) {
  return useQuery({
    queryKey: ['merchant', slug],
    queryFn: () => api.merchants.bySlug(slug),
    enabled: !!slug,
  })
}

export function useSearch(params: {
  q?: string; category?: string; city?: string; district?: string;
  verified?: boolean; sort?: string; limit?: number; offset?: number
}, enabled = true) {
  return useQuery({
    queryKey: ['search', params],
    queryFn: () => api.search(params),
    enabled,
    staleTime: 30 * 1000,
  })
}
