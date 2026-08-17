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
  courier_profile?: {
    id: string
    status: string
    city: string
    country: string
    vehicle: string
    phone?: string
    plate_number?: string | null
    is_online?: boolean
    rating_avg?: number
    rating_count?: number
    completed_jobs?: number
    current_latitude?: number | null
    current_longitude?: number | null
    last_location_at?: string | null
    id_document_url?: string | null
  } | null
  logistics_partner?: {
    id: string
    legal_name: string
    trade_name: string | null
    slug: string
    city: string
    country: string
    phone: string
    verification: string
    is_active: boolean
    onboarding_step?: number
    logo?: string | null
    _count?: { couriers: number; contracts: number }
  } | null
}

export interface AuthTokensResponse {
  user: AuthUser
  accessToken?: string
  refreshToken?: string
  /** Legacy / fallback when X-Client header is ignored */
  access_token?: string
  refresh_token?: string
}

export function normalizeAuthTokens(data: AuthTokensResponse): {
  user: AuthUser
  accessToken?: string
  refreshToken?: string
} {
  const raw = data as AuthTokensResponse & Record<string, unknown>
  const accessToken =
    data.accessToken ??
    data.access_token ??
    (typeof raw.token === 'string' ? raw.token : undefined)
  const refreshToken =
    data.refreshToken ??
    data.refresh_token ??
    (typeof raw.refreshToken === 'string' ? raw.refreshToken : undefined)

  return {
    user: data.user,
    accessToken,
    refreshToken,
  }
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
  hours?: Array<{ day: number; open_time: string | null; close_time: string | null; is_closed: boolean }>
  is_sponsored?: boolean
  has_active_promo?: boolean
  tags?: string[]
  featured_product?: ApiShopFeaturedProduct
  featured_vertical?: ApiVerticalFeaturedItem
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
  menus: {
    data: MenuSearchHit[]
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

export interface ProductPromotionBadge {
  id: string
  title: string
  type: string
  value: number
  code?: string | null
  discount_amount?: number
  promo_price?: number | null
}

export interface ProductSpecification {
  label: string
  value: string
}

export interface ProductAttributeValue {
  attribute_id: string
  value: string
  attribute?: {
    id: string
    label: string
    key?: string
    unit?: string | null
  }
}

export interface MarketplaceProduct {
  id: string
  name: string
  slug: string
  short_description?: string | null
  description?: string | null
  composition?: string | null
  price: number
  original_price?: number
  promo_price?: number | null
  currency: string
  image_url?: string | null
  images?: string[]
  stock_quantity?: number
  has_variants?: boolean
  variants?: ProductVariant[]
  condition?: ProductCondition
  origin?: ProductOrigin
  weight_grams?: number | null
  dimensions?: string | null
  preparation_delay_days?: number | null
  specifications?: ProductSpecification[]
  attribute_values?: ProductAttributeValue[]
  category?: {
    id: string
    name: string
    slug: string
    legal_notice?: string | null
  } | null
  promotion?: ProductPromotionBadge | null
  created_at?: string
  is_best_seller?: boolean
  sales_count?: number
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
  variant?: { id: string; name: string } | null
  line_kind?: 'menu' | 'product'
  menu_item_id?: string | null
  modifiers_label?: string | null
  selected_modifiers?: Array<{ option_name?: string; price_delta?: number }> | null
  product: MarketplaceProduct & {
    merchant: { id: string; business_name: string; slug: string }
  }
}

export interface CartMerchantGroup {
  id: string
  business_name: string
  slug: string
  subtotal: number
  item_count: number
}

export interface CartPickupLocation {
  id: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
}

export interface FoodPreorderSlot {
  at: string
  label: string
}

export interface FoodScheduling {
  is_open_now: boolean
  accepts_preorders: boolean
  requires_preorder: boolean
  blocked: boolean
  block_reason?: 'paused' | 'manual_closed' | 'preorders_disabled' | 'no_slots'
  slots: FoodPreorderSlot[]
  suggested_preorder_for?: string
}

export interface Cart {
  id: string
  items: CartItem[]
  subtotal: number
  currency: string
  item_count: number
  merchant: {
    id: string
    business_name: string
    slug: string
    food_min_order_amount?: number | null
  } | null
  merchants?: CartMerchantGroup[]
  merchant_count?: number
  kind?: 'empty' | 'marketplace' | 'food' | 'mixed'
  delivery_options?: { allow_pickup: boolean; allow_delivery: boolean }
  pickup_locations?: CartPickupLocation[]
  estimated_prep_minutes?: number | null
  food_scheduling?: FoodScheduling | null
}

export interface AppliedPromotionInput {
  shop_id: string
  promotion_id: string
  code: string
}

export interface ShopCheckoutDeliveryInput {
  shop_id: string
  delivery_type: DeliveryType
  delivery_city_id?: string
  delivery_commune_id?: string
  delivery_district?: string
  delivery_address_detail?: string
  delivery_address?: string
  delivery_latitude?: number
  delivery_longitude?: number
}

export interface CheckoutInput {
  delivery_type?: DeliveryType
  delivery_address?: string
  delivery_city_id?: string
  delivery_commune_id?: string
  delivery_district?: string
  delivery_address_detail?: string
  delivery_latitude?: number
  delivery_longitude?: number
  customer_note?: string
  customer_phone: string
  applied_promotions?: AppliedPromotionInput[]
  shop_deliveries?: ShopCheckoutDeliveryInput[]
  food_promo_code?: string
  preorder_for?: string
}

export interface GuestCartItemInput {
  productId: string
  quantity: number
  variantId?: string
}

export interface GuestCheckoutInput extends CheckoutInput {
  guest_first_name: string
  guest_last_name: string
  create_account?: boolean
  email?: string
  password?: string
  cart_items: GuestCartItemInput[]
}

export interface CartPromoApplication {
  valid: boolean
  code: string
  shop_id: string
  promotion_id?: string
  discount: number
  message?: string
  free_delivery?: boolean
}

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

export interface DeliveryQuoteItem {
  shop_id: string
  merchant_id?: string
  shop_name: string
  available: boolean
  fee: number
  zone_name?: string
  eta_min?: number
  eta_max?: number
  message?: string
}

export interface UserAddress {
  id: string
  label: string | null
  city_id: string
  commune_id: string
  district: string
  address_detail: string | null
  latitude: number | null
  longitude: number | null
  is_default: boolean
  city: { id: string; name: string; slug: string; country: string }
  commune: { id: string; name: string; slug: string }
}

export interface CreateUserAddressInput {
  label?: string
  city_id: string
  commune_id: string
  district: string
  address_detail?: string
  latitude?: number | null
  longitude?: number | null
  is_default?: boolean
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
    courier_profile?: {
      rating_avg: number
      user: { full_name?: string | null }
    } | null
  } | null
  order_source?: 'MARKETPLACE' | 'FOOD' | string
  return_request?: OrderReturnRequest | null
  delivery_dispute?: DeliveryDispute | null
  courier_review?: {
    id: string
    rating: number
    comment?: string | null
  } | null
}

export interface OrderItem {
  id: string
  product_id?: string | null
  menu_item_id?: string | null
  product_name: string
  variant_name?: string | null
  unit_price: number
  quantity: number
  line_total: number
  image_url?: string | null
  modifiers?: unknown
  product?: {
    id: string
    slug: string
    image_url?: string | null
  } | null
}

export type OrderReturnReason =
  | 'DEFECTIVE'
  | 'WRONG_ITEM'
  | 'NOT_RECEIVED'
  | 'CHANGED_MIND'
  | 'OTHER'

export type OrderReturnStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED'

export interface OrderReturnRequest {
  id: string
  order_id: string
  reason: string
  description?: string | null
  merchant_note?: string | null
  status: OrderReturnStatus
  created_at: string
}

export type DeliveryDisputeStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED'

export interface DeliveryDispute {
  id: string
  reason: string
  description?: string | null
  status: DeliveryDisputeStatus
  created_at: string
  admin_note?: string | null
}

export interface OrderEtaSnapshot {
  prep_remaining_minutes: number
  travel_minutes: number
  eta_minutes: number
  eta_arrival_at: string | null
  eta_updated_at: string
}

export interface ReorderResult {
  cart: Cart
  added_count: number
  added: string[]
  skipped: Array<{ name: string; reason: string }>
}

export interface CourierReview {
  id: string
  rating: number
  comment?: string | null
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
  promotion?: ProductPromotionBadge | null
  merchant: { business_name: string; slug: string }
  is_sponsored?: boolean
  has_variants?: boolean
  created_at?: string
  is_best_seller?: boolean
  sales_count?: number
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
  peak_nightly_rate?: number | null
  peak_months?: unknown
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
  beds?: number | null
  property_type?: string | null
  unit_type?: string | null
  is_active?: boolean
}

export interface PublicRoomPayload {
  merchant: {
    id: string
    business_name: string
    slug: string
    cover_image?: string | null
    location?: {
      address?: string | null
      district?: string | null
      city?: string | null
    } | null
  }
  room: MerchantServiceConfig
  booking_settings?: BookingSettingsConfig | null
  booking_enabled?: boolean
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

export interface BookingSlot {
  time: string
  available: boolean
  remaining?: number
}

export interface BookingAvailability {
  slots: BookingSlot[]
  closed?: boolean
  reason?: string
}

export interface BookingPaymentInfo {
  id: string
  reference: string
  amount: number
  currency: string
  provider: string
  instructions: string
}

export interface BookingPaymentSession {
  payment_required: boolean
  booking_id: string
  merchant_name?: string
  payment?: BookingPaymentInfo
}

export interface CreateBookingResult {
  id: string
  payment_required?: boolean
  payment?: { id: string }
  pricing?: {
    base_amount: number
    deposit_percent: number
    due_now: number
  } | null
}

export interface MerchantSuggestion {
  id: string
  business_name: string
  slug: string
  category_name: string
  category_slug?: string
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

export interface MenuSuggestion {
  id: string
  name: string
  price: number
  currency: string
  prep_minutes: number | null
  image_url: string | null
  section_name: string | null
  merchant: { business_name: string; slug: string }
  _highlight: string | null
}

export interface AutocompleteUnifiedResult {
  merchants: MerchantSuggestion[]
  products: ProductSuggestion[]
  menus: MenuSuggestion[]
}

export interface UnifiedSearchParams {
  q: string
  type?: 'all' | 'merchants' | 'products' | 'menus'
  limit?: number
  offset?: number
  city?: string
  category?: string
  sort?: string
}

export type BookingType =
  | 'TABLE'
  | 'APPOINTMENT'
  | 'ROOM'
  | 'CONSULTATION'
  | 'VENUE'

export interface MyBooking {
  id: string
  booking_type: BookingType
  booked_at: string
  check_out_at?: string | null
  party_size: number
  status: string
  guest_name: string
  guest_phone: string
  guest_email?: string | null
  notes?: string | null
  room_type?: string | null
  service?: {
    id: string
    name: string
    price?: number | null
    duration_min?: number | null
  } | null
  merchant: {
    id: string
    business_name: string
    slug: string
    cover_image?: string | null
  }
  created_at?: string
}

export interface MyBookingsPage {
  items: MyBooking[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface LoyaltyAccount {
  account: { points: number; tier: string; total_earned?: number }
  transactions: { id: string; points: number; reason: string; created_at: string }[]
  tiers: { key: string; label: string; min: number; active: boolean }[]
  pointsToNext: number | null
}

export interface ReferralStats {
  code: string
  uses_count: number
  total_points_earned: number
  referrals: { id: string; invited_user: { full_name: string | null; created_at: string } }[]
}

export interface MyReview {
  id: string
  rating: number
  title: string | null
  content: string | null
  status: 'APPROVED' | 'PENDING' | 'REJECTED'
  created_at: string
  merchant: { id: string; business_name: string; slug: string }
}

export interface NotificationItem {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  created_at: string
  data?: Record<string, unknown> | null
}

export interface NotificationsPage {
  items: NotificationItem[]
  total: number
  totalAll: number
  page: number
  pageSize: number
  totalPages: number
  unreadCount: number
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
