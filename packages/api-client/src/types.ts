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
  food_prep_minutes?: number
  food_min_order_amount?: number | null
  food_is_paused?: boolean
  food_pause_until?: string | null
  food_accepts_cash?: boolean
  food_cash_max_amount?: number | null
  food_opening_hours?: Record<string, { open: string; close: string } | null> | null
  is_sponsored?: boolean
  has_active_promo?: boolean
  tags?: string[]
  featured_vertical?: {
    kind: string
    badge: string
    name: string
    price: string | null
    image: string
    tab: string
    meta: string | null
  }
}

export interface ApiPaginated<T> {
  data: T[]
  meta: { total: number; limit: number; offset: number }
}

export interface MenuSearchHit {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  prep_minutes: number | null
  image_url: string | null
  section_name: string | null
  merchant: { business_name: string; slug: string }
}

export interface MenuItemRow {
  id: string
  section_id: string | null
  name: string
  description: string | null
  price: number
  currency: string
  image_url: string | null
  is_available: boolean
  prep_minutes: number | null
  modifier_groups: Array<{
    id: string
    name: string
    min_select: number
    max_select: number
    options: Array<{ id: string; name: string; price_delta: number }>
  }>
}

export interface MerchantMenuData {
  merchant: {
    id: string
    name: string
    slug: string
    food_prep_minutes?: number
    food_min_order_amount?: number | null
    food_is_paused?: boolean
    food_pause_until?: string | null
    food_accepts_cash?: boolean
    food_cash_max_amount?: number | null
    food_opening_hours?: Record<string, { open: string; close: string } | null> | null
    food_accepts_preorders?: boolean
    food_status?: 'open' | 'paused' | 'closed'
  }
  sections: Array<{ id: string; name: string; sort_order: number; items: MenuItemRow[] }>
  uncategorized: MenuItemRow[]
}

export interface ApiMerchantDetail extends ApiMerchant {
  email: string | null
  website?: string | null
  hours?: BusinessHour[]
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
  orders: Array<{
    orderId: string
    paymentId: string
    reference: string
    amount: number
    subtotal: number
    discount_amount?: number
    delivery_fee?: number
  }>
  total: number
  total_discount?: number
  total_delivery_fee?: number
  currency: string
  provider?: string
  orderId: string
  paymentId?: string
  reference: string
  amount?: number
  instructions: string
}

export interface Order {
  id: string
  status: OrderStatus
  delivery_type: DeliveryType
  delivery_address?: string | null
  delivery_district?: string | null
  customer_note?: string | null
  customer_phone?: string | null
  subtotal: number
  total: number
  discount_amount?: number | null
  delivery_fee?: number | null
  currency: string
  created_at: string
  items?: OrderItem[]
  merchant?: {
    business_name: string
    slug: string
    logo?: string | null
    phone?: string | null
    whatsapp?: string | null
  } | null
  shop?: {
    name: string
    slug: string
    logo?: string | null
    phone?: string | null
    whatsapp?: string | null
  } | null
  payment?: {
    id?: string
    status: string
    reference: string
    paid_at?: string | null
  } | null
  delivery_job?: {
    id: string
    status: string
    tracking_token: string
    eta_minutes: number | null
    delivery_code?: string | null
    courier?: {
      full_name: string
      phone: string | null
      vehicle: string | null
    } | null
  } | null
}

export interface OrderItem {
  id: string
  product_id?: string | null
  product_name: string
  variant_name?: string | null
  unit_price: number
  quantity: number
  line_total: number
  image_url?: string | null
  product?: {
    id: string
    slug: string
    image_url?: string | null
  } | null
}

export interface OrderEtaSnapshot {
  prep_remaining_minutes: number
  travel_minutes: number
  eta_minutes: number
  eta_arrival_at: string | null
  eta_updated_at: string
}

export interface DeliveryTrackingData {
  tracking_token: string
  status: string
  eta_minutes: number | null
  pickup_address: string | null
  dropoff_address: string | null
  dropoff_latitude: number | null
  dropoff_longitude: number | null
  assigned_at: string | null
  picked_up_at: string | null
  delivered_at: string | null
  updated_at: string
  courier_latitude: number | null
  courier_longitude: number | null
  courier: {
    full_name: string
    phone: string | null
    vehicle: string | null
    rating_avg?: number
  } | null
  order: {
    id: string
    status: string
    delivery_address: string | null
    shop: { name: string }
  }
  delivery_code?: string | null
}

export interface FavoriteMerchant extends ApiMerchant {
  avg_rating?: number | null
}

export interface FavoriteProduct {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  image_url: string | null
  status: string
  stock_quantity: number
  merchant: { id: string; business_name: string; slug: string }
}

export interface FavoriteToggleResult {
  is_favorited: boolean
  merchant_id?: string
  product_id?: string
}

export interface OtpSendResponse {
  sent: boolean
  expires_in: number
  dev_code?: string
}

export interface ConfirmPaymentResult {
  status: 'SUCCESS' | 'FAILED'
  orderId?: string
  orderIds?: string[]
  message: string
}

export interface BusinessHour {
  day: number
  open_time: string | null
  close_time: string | null
  is_closed: boolean
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

export type ProductCondition = 'NEW' | 'USED_GOOD' | 'USED_FAIR' | 'REFURBISHED'
export type ProductOrigin = 'LOCAL_CI' | 'IMPORTED' | 'HANDMADE'

export interface MarketplaceCatalogProduct extends FeaturedProduct {
  created_at?: string
  category?: { id: string; name: string; slug: string } | null
  condition?: ProductCondition
  origin?: ProductOrigin
  merchant: { business_name: string; slug: string; logo?: string | null }
  can_quick_add?: boolean
  default_variant_id?: string | null
}

export interface MarketplaceCatalogPage {
  data: MarketplaceCatalogProduct[]
  meta: { total: number; limit: number; offset: number; hasMore: boolean }
}

export interface ProductCategoryNode {
  id: string
  name: string
  slug: string
  icon: string | null
  sort_order: number
  children: ProductCategoryNode[]
}

export interface MarketplaceBoutique {
  id: string
  business_name: string
  slug: string
  logo: string | null
}

export interface ShopProductCategory {
  id: string
  name: string
  slug: string
  icon: string | null
  parent_id?: string | null
  sort_order?: number
}

export interface ShopCollectionPublic {
  id: string
  name: string
  slug: string
  description?: string | null
  product_count: number
}

export interface ShopTrustScore {
  score: number | null
  total_orders: number
  fulfilled_orders: number
  cancelled_orders: number
  label: string
  badge: 'trusted' | 'good' | 'new' | null
}

export interface ApiShopPublic {
  id: string
  name: string
  slug: string
  description?: string | null
  logo?: string | null
  cover_image?: string | null
  phone?: string | null
  whatsapp?: string | null
  city?: string | null
  district?: string | null
  merchant_id?: string | null
  merchant?: { slug: string; is_active?: boolean } | null
}

export interface MerchantServiceConfig {
  id: string
  slug?: string
  name: string
  description?: string | null
  duration_min: number
  price: number | null
  nightly_rate?: number | null
  weekend_nightly_rate?: number | null
  min_stay_nights?: number | null
  capacity?: number | null
  max_guests?: number | null
  surface_sqm?: number | null
  service_kind?: string
  image_urls?: string[]
  amenities?: string[]
  highlights?: string[]
  bedrooms?: number | null
  bathrooms?: number | null
  is_active?: boolean
}

export interface BookingSettingsConfig {
  max_capacity?: number
  require_payment?: boolean
  deposit_percent?: number
  cancellation_policy?: string | null
  no_show_policy?: string | null
}

export interface BookingConfig {
  enabled: boolean
  booking_type: string | null
  label: string
  cta: string
  category_slug: string
  services: MerchantServiceConfig[]
  room_services?: MerchantServiceConfig[]
  room_types?: string[]
  booking_settings?: BookingSettingsConfig
}

export interface RoomCalendarDay {
  date: string
  available: boolean
  remaining?: number
  nightly_rate: number | null
}

export interface RoomCalendarData {
  from: string
  to: string
  room_service: { id: string; name: string; nightly_rate: number; capacity: number }
  days: RoomCalendarDay[]
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
