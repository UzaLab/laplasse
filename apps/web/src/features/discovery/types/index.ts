export type { Category, Merchant, MerchantLocation } from '@/types/merchant'

export interface SearchFilters {
  category?: string
  city?: string
  district?: string
  radius_km?: number
}
