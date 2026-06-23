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
