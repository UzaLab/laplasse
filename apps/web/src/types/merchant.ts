export interface Category {
  id: string
  name: string
  slug: string
  icon: string
}

export interface MerchantLocation {
  city: string
  district: string
  address?: string
  latitude?: number
  longitude?: number
}

export interface Merchant {
  id: string
  business_name: string
  slug: string
  description?: string
  category: Category
  logo?: string
  cover_image?: string
  phone?: string
  whatsapp?: string
  verification_status: 'UNVERIFIED' | 'PENDING' | 'VERIFIED'
  trust_score: number
  location?: MerchantLocation
  rating?: number
  review_count?: number
  distance_km?: number
  is_open?: boolean
  is_sponsored?: boolean
  tags?: string[]
}
