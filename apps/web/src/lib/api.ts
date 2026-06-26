import { fetchWithTimeout } from '@/lib/fetchWithTimeout'
import { countryRequestHeaders, getDefaultCity } from '@/lib/country'
import type { ApiPublicShop } from './boutiquePublic'

function getApiUrl(): string {
  // SSR dans Docker : URL interne Coolify (évite le loopback Traefik/SSL)
  if (typeof window === 'undefined' && process.env.API_INTERNAL_URL) {
    return process.env.API_INTERNAL_URL
  }
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'
}

function getSsrApiUrls(): string[] {
  const publicUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'
  if (typeof window !== 'undefined') return [publicUrl]
  const internal = process.env.API_INTERNAL_URL
  if (internal && internal !== publicUrl) return [internal, publicUrl]
  return [internal ?? publicUrl]
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const bases = getSsrApiUrls()
  let lastError: ApiError | Error | null = null

  for (const base of bases) {
    try {
      const res = await fetchWithTimeout(`${base}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...countryRequestHeaders(),
          ...(options?.headers as Record<string, string> | undefined),
        },
      })

      if (res.ok) {
        return res.json() as Promise<T>
      }

      const err = await res.json().catch(() => ({ message: res.statusText }))
      lastError = new ApiError(res.status, err.message ?? 'API error')
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
    }
  }

  throw lastError ?? new ApiError(503, 'API indisponible')
}

// ─── Types réponses API ────────────────────────────────────────────────────────

export interface ApiCategory {
  id: string
  name: string
  slug: string
  icon: string | null
  sort_order: number
  children: ApiCategory[]
  _count: { merchants: number }
}

export interface ApiMerchantLocation {
  city: string
  district: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
}

export interface ApiMerchantHour {
  day: number
  open_time: string | null
  close_time: string | null
  is_closed: boolean
}

export interface ApiShopFeaturedProduct {
  name: string
  price: string
  image: string
  slug: string
  shop_slug: string
}

export interface ApiVerticalFeaturedItem {
  kind: 'menu' | 'room' | 'service' | 'consultation'
  badge: string
  name: string
  price: string | null
  image: string
  tab: string
  meta: string | null
}

export interface ApiMerchant {
  id: string
  business_name: string
  slug: string
  description: string | null
  logo: string | null
  cover_image: string | null
  whatsapp: string | null
  phone: string | null
  website: string | null
  verification_status: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
  trust_score: number
  is_sponsored: boolean
  category: { id: string; name: string; slug: string; icon: string | null }
  location: ApiMerchantLocation | null
  hours: ApiMerchantHour[]
  tags: string[]
  review_count: number
  favorites_count: number
  has_marketplace?: boolean
  featured_product?: ApiShopFeaturedProduct
  featured_vertical?: ApiVerticalFeaturedItem
  distance_km?: number
}

export interface ApiMerchantDetail extends ApiMerchant {
  email: string | null
  avg_rating: number | null
  reviews: Array<{
    id: string
    rating: number
    title: string | null
    content: string | null
    created_at: string
    user: { id: string; full_name: string | null; avatar: string | null }
  }>
  media: Array<{ id: string; type: string; url: string; thumbnail: string | null; order: number }>
}

export interface ApiPaginated<T> {
  data: T[]
  meta: { total: number; limit: number; offset: number }
}

export interface ApiSearchResult {
  data: Array<ApiMerchant & { _formatted?: Record<string, string> }>
  meta: { total: number; query: string; limit: number; offset: number; processing_time_ms: number }
}

export interface ApiProductSearchHit {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  image_url?: string | null
  created_at?: string
  category?: { id: string; name: string; slug: string } | null
  merchant: { business_name: string; slug: string; logo?: string | null }
  _formatted?: Record<string, string>
}

export interface ApiProductSearchResult {
  data: ApiProductSearchHit[]
  meta: { total: number; query: string; limit: number; offset: number; processing_time_ms: number }
}

export interface ApiUnifiedSearchResult {
  merchants: ApiSearchResult
  products: ApiProductSearchResult
  meta: { query: string; type: 'all' | 'merchants' | 'products'; processing_time_ms: number }
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export const api = {
  health: () => apiFetch<{ status: string; services: Record<string, string> }>('/health'),

  categories: {
    list: () => apiFetch<ApiCategory[]>('/categories'),
    bySlug: (slug: string) => apiFetch<ApiCategory>(`/categories/${slug}`),
  },

  merchants: {
    list: (params?: Record<string, string | number>) => {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
      return apiFetch<ApiPaginated<ApiMerchant>>(`/merchants${qs}`)
    },
    featured: (city = getDefaultCity(), limit = 6, country?: string) => {
      const qs = new URLSearchParams({ city, limit: String(limit) })
      if (country) qs.set('country', country)
      return apiFetch<ApiMerchant[]>(`/merchants/featured?${qs}`)
    },
    nearby: (city = getDefaultCity(), district?: string, limit = 6) => {
      const qs = new URLSearchParams({ city, limit: String(limit) })
      if (district) qs.set('district', district)
      return apiFetch<ApiMerchant[]>(`/merchants/nearby?${qs}`)
    },
    nearbyGeo: (params: {
      city?: string
      lat: number
      lng: number
      radiusKm?: number
      limit?: number
      country?: string
    }) => {
      const qs = new URLSearchParams({
        lat: String(params.lat),
        lng: String(params.lng),
        radius: String(params.radiusKm ?? 2),
        limit: String(params.limit ?? 40),
      })
      if (params.city) qs.set('city', params.city)
      if (params.country) qs.set('country', params.country)
      return apiFetch<ApiMerchant[]>(`/merchants/nearby?${qs}`)
    },
    bySlug: (slug: string) => apiFetch<ApiMerchantDetail>(`/merchants/${slug}`),
    similar: (slug: string, limit = 4) =>
      apiFetch<ApiMerchant[]>(`/merchants/${slug}/similar?limit=${limit}`),
    trackInteraction: (id: string, event_type: string) =>
      apiFetch(`/merchants/${id}/interaction`, {
        method: 'POST',
        body: JSON.stringify({ event_type }),
      }),
  },

  shops: {
    bySlug: (slug: string) => apiFetch<ApiPublicShop>(`/shops/${slug}`),
  },

  search: (params: {
    q?: string; category?: string; city?: string; district?: string;
    verified?: boolean; sort?: string; limit?: number; offset?: number
  }) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== false) qs.set(k, String(v))
    })
    return apiFetch<ApiSearchResult>(`/search?${qs}`)
  },

  searchProducts: (params: {
    q?: string; category?: string; shop?: string; country?: string;
    sort?: string; maxPrice?: number; limit?: number; offset?: number
  }) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) qs.set(k, String(v))
    })
    return apiFetch<ApiProductSearchResult>(`/search/products?${qs}`)
  },

  searchUnified: (params: {
    q?: string; type?: 'all' | 'merchants' | 'products'; category?: string;
    city?: string; district?: string; verified?: boolean; sort?: string;
    limit?: number; offset?: number; merchantOffset?: number; productOffset?: number
  }) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== false) qs.set(k, String(v))
    })
    return apiFetch<ApiUnifiedSearchResult>(`/search/unified?${qs}`)
  },
}
