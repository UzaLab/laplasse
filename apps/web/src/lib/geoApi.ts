import { fetchPublicJson } from '@/lib/marketplaceApi'
import { getCountryCode } from '@/lib/country'

export interface GeoCity {
  id: string
  name: string
  slug: string
  is_default?: boolean
  latitude?: number | null
  longitude?: number | null
}

export interface GeoCommune {
  id: string
  name: string
  slug: string
  city_id: string
  latitude?: number | null
  longitude?: number | null
}

export interface GeoCountry {
  code: string
  name: string
  latitude?: number | null
  longitude?: number | null
}

export async function fetchGeoCities(country = getCountryCode()) {
  return fetchPublicJson<GeoCity[]>(`/geo/cities?country=${encodeURIComponent(country)}`)
}

export async function fetchGeoCommunes(citySlug: string, country = getCountryCode()) {
  return fetchPublicJson<{ city: GeoCity; communes: GeoCommune[] }>(
    `/geo/cities/${encodeURIComponent(citySlug)}/communes?country=${encodeURIComponent(country)}`,
  )
}

export async function fetchGeoCountries() {
  return fetchPublicJson<GeoCountry[]>('/geo/countries')
}

export interface GeoPlaceResult {
  id: string
  label: string
  latitude: number
  longitude: number
  type: string | null
}

export async function searchGeoPlaces(
  query: string,
  opts?: { country?: string; lat?: number; lng?: number; limit?: number },
) {
  const q = query.trim()
  if (q.length < 2) return { ok: true as const, data: [] as GeoPlaceResult[] }

  const params = new URLSearchParams({ q })
  const country = opts?.country ?? getCountryCode()
  params.set('country', country)
  if (opts?.lat != null) params.set('lat', String(opts.lat))
  if (opts?.lng != null) params.set('lng', String(opts.lng))
  if (opts?.limit != null) params.set('limit', String(opts.limit))

  return fetchPublicJson<GeoPlaceResult[]>(`/geo/places/search?${params.toString()}`)
}

export interface DeliveryQuoteItem {
  shop_id: string
  merchant_id?: string
  shop_name: string
  available: boolean
  fee: number
  zone_name?: string
  eta_min_minutes?: number
  eta_max_minutes?: number
  vehicle?: string
  message?: string
}

export async function fetchDeliveryQuote(input: {
  shop_ids?: string[]
  merchant_ids?: string[]
  city_id: string
  commune_id: string
  subtotals?: Record<string, number>
  order_flow?: 'food' | 'marketplace'
}) {
  return fetchPublicJson<{ quotes: DeliveryQuoteItem[]; total_delivery_fee: number }>(
    '/checkout/delivery-quote',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )
}
