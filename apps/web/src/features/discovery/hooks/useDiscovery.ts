import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { getDefaultCity } from '@/lib/country'
import type { ProductSearchHit } from '@/features/discovery/components/ProductSearchResultCard'
import type { SearchHit } from '@/features/discovery/components/SearchResultCard'

export const SEARCH_PAGE_SIZE = 12

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
    staleTime: 10 * 60 * 1000, // 10 min — catégories changent rarement
  })
}

export function useFeaturedMerchants(city = getDefaultCity(), limit = 3) {
  return useQuery({
    queryKey: ['merchants', 'featured', city, limit],
    queryFn: () => api.merchants.featured(city, limit),
  })
}

export function useNearbyMerchants(city = getDefaultCity(), district?: string, limit = 6) {
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

export function useUnifiedSearch(params: {
  q?: string; type?: 'all' | 'merchants' | 'products'; category?: string;
  city?: string; district?: string; verified?: boolean; sort?: string;
  limit?: number; offset?: number; merchantOffset?: number; productOffset?: number
}, enabled = true) {
  return useQuery({
    queryKey: ['search', 'unified', params],
    queryFn: () => api.searchUnified(params),
    enabled,
    staleTime: 30 * 1000,
  })
}

export function usePaginatedUnifiedSearch(
  params: {
    q?: string
    type?: 'all' | 'merchants' | 'products'
    category?: string
    city?: string
    district?: string
    verified?: boolean
    sort?: string
  },
  enabled = true,
) {
  const filterKey = useMemo(() => JSON.stringify(params), [params])

  const [merchants, setMerchants] = useState<SearchHit[]>([])
  const [products, setProducts] = useState<ProductSearchHit[]>([])
  const [merchantTotal, setMerchantTotal] = useState(0)
  const [productTotal, setProductTotal] = useState(0)
  const [loadingMore, setLoadingMore] = useState<'merchants' | 'products' | null>(null)

  const { data, isLoading, isFetching, error, isError } = useUnifiedSearch(
    { ...params, limit: SEARCH_PAGE_SIZE, offset: 0 },
    enabled,
  )

  useEffect(() => {
    setMerchants([])
    setProducts([])
    setMerchantTotal(0)
    setProductTotal(0)
  }, [filterKey])

  useEffect(() => {
    if (!data) return
    setMerchants(data.merchants.data as SearchHit[])
    setProducts(data.products.data as ProductSearchHit[])
    setMerchantTotal(data.merchants.meta.total)
    setProductTotal(data.products.meta.total)
  }, [data])

  const appendUnique = useCallback(<T extends { id: string }>(prev: T[], next: T[]) => {
    const ids = new Set(prev.map(item => item.id))
    return [...prev, ...next.filter(item => !ids.has(item.id))]
  }, [])

  const loadMoreMerchants = useCallback(async () => {
    if (loadingMore) return
    setLoadingMore('merchants')
    try {
      const res = await api.searchUnified({
        ...params,
        type: 'merchants',
        limit: SEARCH_PAGE_SIZE,
        offset: merchants.length,
      })
      setMerchants(prev => appendUnique(prev, res.merchants.data as SearchHit[]))
      setMerchantTotal(res.merchants.meta.total)
    } finally {
      setLoadingMore(null)
    }
  }, [appendUnique, loadingMore, merchants.length, params])

  const loadMoreProducts = useCallback(async () => {
    if (loadingMore) return
    setLoadingMore('products')
    try {
      const res = await api.searchUnified({
        ...params,
        type: 'products',
        limit: SEARCH_PAGE_SIZE,
        offset: products.length,
      })
      setProducts(prev => appendUnique(prev, res.products.data as ProductSearchHit[]))
      setProductTotal(res.products.meta.total)
    } finally {
      setLoadingMore(null)
    }
  }, [appendUnique, loadingMore, params, products.length])

  const showMerchants = params.type === 'all' || params.type === 'merchants'
  const showProducts = params.type === 'all' || params.type === 'products'

  return {
    merchants,
    products,
    hasMoreMerchants: showMerchants && merchants.length < merchantTotal,
    hasMoreProducts: showProducts && products.length < productTotal,
    isLoading,
    isFetching: isFetching && !loadingMore,
    loadingMore,
    loadMoreMerchants,
    loadMoreProducts,
    error,
    isError,
  }
}
