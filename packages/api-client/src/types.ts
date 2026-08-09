export type DeliveryType = 'PICKUP' | 'DELIVERY'

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'

export interface AuthUser {
  id: string
  email: string
  full_name: string | null
  avatar: string | null
  phone: string | null
  role: string
  created_at: string
}

export interface AuthTokensResponse {
  user: AuthUser
  accessToken?: string
  refreshToken?: string
}

export interface ApiMerchantLocation {
  city: string
  district: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
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
  verification_status: string
  trust_score: number
  category: { id: string; name: string; slug: string; icon: string | null }
  location: ApiMerchantLocation | null
  review_count: number
  avg_rating?: number | null
  distance_km?: number
  has_marketplace?: boolean
}

export interface ApiMerchantDetail extends ApiMerchant {
  email: string | null
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

export interface ApiCategory {
  id: string
  name: string
  slug: string
  icon: string | null
  sort_order: number
  children: ApiCategory[]
  _count: { merchants: number }
}

export interface ApiProductSearchHit {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  image_url?: string | null
  merchant: { business_name: string; slug: string; logo?: string | null }
}

export interface ApiUnifiedSearchResult {
  merchants: {
    data: ApiMerchant[]
    meta: { total: number; query: string; limit: number; offset: number }
  }
  products: {
    data: ApiProductSearchHit[]
    meta: { total: number; query: string; limit: number; offset: number }
  }
  meta: { query: string; type: string }
}

export interface ProductVariant {
  id: string
  name: string
  price: number
  stock_quantity: number
  color_hex?: string | null
  image_url?: string | null
}

export interface MarketplaceProduct {
  id: string
  name: string
  slug: string
  short_description?: string | null
  description?: string | null
  price: number
  currency: string
  image_url?: string | null
  images?: string[]
  stock_quantity?: number
  has_variants?: boolean
  variants?: ProductVariant[]
  merchant?: {
    id: string
    business_name: string
    slug: string
  }
  shop?: {
    id: string
    name: string
    slug: string
  }
}

export interface CartItem {
  id: string
  quantity: number
  unit_price: number
  line_total: number
  variant_id?: string | null
  variant?: ProductVariant | null
  product: MarketplaceProduct & {
    merchant: { id: string; business_name: string; slug: string }
  }
}

export interface Cart {
  id: string
  items: CartItem[]
  subtotal: number
  currency: string
  item_count: number
  merchant: { id: string; business_name: string; slug: string } | null
  delivery_options?: { allow_pickup: boolean; allow_delivery: boolean }
}

export interface CheckoutInput {
  delivery_type?: DeliveryType
  delivery_address?: string
  delivery_district?: string
  customer_note?: string
  customer_phone: string
}

export interface CheckoutResult {
  orders: Array<{ id: string; total: number; status: OrderStatus }>
  total: number
  currency: string
  orderId: string
  reference: string
  instructions: string
}

export interface Order {
  id: string
  status: OrderStatus
  delivery_type: DeliveryType
  total: number
  subtotal: number
  currency: string
  created_at: string
  items?: CartItem[]
}

export interface ApiPaginated<T> {
  data: T[]
  meta: { total: number; limit: number; offset: number }
}

export interface FeaturedProduct {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  image_url?: string | null
  original_price?: number
  promo_price?: number | null
  merchant: { business_name: string; slug: string }
  is_sponsored?: boolean
  has_variants?: boolean
}

export interface MarketplaceSpotlightShop {
  id: string
  business_name: string
  slug: string
  logo: string | null
  is_sponsored?: boolean
}

export interface MerchantSuggestion {
  id: string
  business_name: string
  slug: string
  category_name: string
  district: string | null
  verification_status: string
  _highlight: string | null
}

export interface ProductSuggestion {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  category_name: string | null
  merchant: { business_name: string; slug: string }
  _highlight: string | null
}

export interface TrendingSearchItem {
  query: string
  count: number
}

export interface AutocompleteUnifiedResult {
  merchants: MerchantSuggestion[]
  products: ProductSuggestion[]
}

export interface UnifiedSearchParams {
  q: string
  type?: 'all' | 'merchants' | 'products'
  limit?: number
  offset?: number
  city?: string
  category?: string
  sort?: string
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
