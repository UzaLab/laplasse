import { authApiFetch } from './authFetch'
import { authUrl } from './authClient'
import { countryRequestHeaders } from './country'
import { shopApiFetch } from './shopApi'
import { fetchWithTimeout } from './fetchWithTimeout'
import type { SelectedMenuModifier } from './menuModifiers'

export type FetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED'
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
export type DeliveryType = 'PICKUP' | 'DELIVERY'

export type OrderReturnStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED'

export type OrderReturnReason =
  | 'DEFECTIVE'
  | 'WRONG_ITEM'
  | 'NOT_RECEIVED'
  | 'CHANGED_MIND'
  | 'OTHER'

export const ORDER_RETURN_REASON_LABELS: Record<OrderReturnReason, string> = {
  DEFECTIVE: 'Produit défectueux',
  WRONG_ITEM: 'Mauvais article reçu',
  NOT_RECEIVED: 'Commande non reçue',
  CHANGED_MIND: 'Changement d\'avis',
  OTHER: 'Autre motif',
}

export const ORDER_RETURN_STATUS_LABELS: Record<OrderReturnStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvé',
  REJECTED: 'Refusé',
  REFUNDED: 'Remboursé',
}

export interface OrderReturnRequest {
  id: string
  order_id: string
  reason: string
  description?: string | null
  merchant_note?: string | null
  status: OrderReturnStatus
  created_at: string
  updated_at?: string
}

export interface MerchantOrderReturn extends OrderReturnRequest {
  shop_id: string
  user_id: string
  order?: {
    id: string
    total: number
    status: OrderStatus
    created_at: string
    user?: { full_name: string | null; email: string; phone?: string | null }
    items?: Array<{ product_name: string; quantity: number }>
  }
}

export interface ProductVariant {
  id: string
  name: string
  price: number
  stock_quantity: number
  sku?: string | null
}

export interface MarketplaceProduct {
  id: string
  name: string
  slug: string
  description?: string | null
  composition?: string | null
  price: number
  currency: string
  stock_quantity: number
  image_url?: string | null
  images?: string[]
  status: ProductStatus
  allow_pickup?: boolean
  allow_delivery?: boolean
  has_variants?: boolean
  variants?: ProductVariant[]
  category_id?: string | null
  category?: { id: string; name: string; slug: string; parent_id?: string | null } | null
  merchant?: {
    id: string
    business_name: string
    slug: string
    category?: { slug: string; name: string }
  }
}

export interface FeaturedProduct {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  image_url?: string | null
  merchant: { business_name: string; slug: string }
  is_sponsored?: boolean
  ad_campaign_id?: string | null
  has_variants?: boolean
  can_quick_add?: boolean
  default_variant_id?: string | null
}

export interface MarketplaceCatalogProduct extends FeaturedProduct {
  created_at?: string
  category?: { id: string; name: string; slug: string } | null
  merchant: { business_name: string; slug: string; logo?: string | null }
  has_variants?: boolean
  can_quick_add?: boolean
  default_variant_id?: string | null
}

export interface ProductCategoryNode {
  id: string
  name: string
  slug: string
  icon: string | null
  sort_order: number
  children: ProductCategoryNode[]
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

export interface MarketplaceBoutique {
  id: string
  business_name: string
  slug: string
  logo: string | null
}

export interface MarketplaceSpotlightShop extends MarketplaceBoutique {
  is_sponsored?: boolean
  is_admin_featured?: boolean
  ad_campaign_id?: string | null
}

export interface CartMerchantGroup {
  id: string
  business_name: string
  slug: string
  subtotal: number
  item_count: number
}

export interface CartItem {
  id: string
  quantity: number
  unit_price: number
  line_total: number
  line_kind?: 'menu' | 'product'
  menu_item_id?: string | null
  selected_modifiers?: SelectedMenuModifier[]
  modifiers_label?: string | null
  menu_item?: {
    id: string
    name: string
    price: number
    currency: string
    image_url?: string | null
    prep_minutes?: number | null
  } | null
  variant_id?: string | null
  variant?: ProductVariant | null
  product: MarketplaceProduct & {
    merchant: {
      id: string
      business_name: string
      slug: string
      category?: { slug: string }
    }
    has_variants?: boolean
  }
}

export interface Cart {
  id: string
  merchant_id: string | null
  items: CartItem[]
  subtotal: number
  currency: string
  kind?: 'empty' | 'marketplace' | 'food' | 'mixed'
  estimated_prep_minutes?: number | null
  merchant: { id: string; business_name: string; slug: string } | null
  merchants: CartMerchantGroup[]
  merchant_count: number
  item_count: number
  delivery_options?: {
    allow_pickup: boolean
    allow_delivery: boolean
  }
}

export interface OrderItem {
  id: string
  product_id?: string | null
  menu_item_id?: string | null
  variant_id?: string | null
  product_name: string
  variant_name?: string | null
  unit_price: number
  quantity: number
  line_total: number
  product?: {
    id: string
    slug: string
    image_url?: string | null
  } | null
}

export interface Order {
  id: string
  status: OrderStatus
  delivery_type: DeliveryType
  delivery_address?: string | null
  delivery_city_id?: string | null
  delivery_commune_id?: string | null
  delivery_district?: string | null
  delivery_city?: { id: string; name: string } | null
  delivery_commune?: { id: string; name: string } | null
  customer_note?: string | null
  customer_phone?: string | null
  subtotal: number
  total: number
  discount_amount?: number | null
  delivery_fee?: number | null
  created_at: string
  items: OrderItem[]
  promotion?: { title: string; code: string | null } | null
  merchant?: {
    business_name: string
    slug: string
    logo?: string | null
    phone?: string | null
    whatsapp?: string | null
  }
  user?: {
    full_name: string | null
    email: string
    phone?: string | null
  }
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
    assigned_at: string | null
    picked_up_at: string | null
    delivered_at: string | null
    delivery_code?: string | null
    courier: {
      id?: string
      full_name: string
      phone: string | null
      vehicle: string | null
    } | null
    courier_profile?: {
      phone: string
      vehicle: string
      rating_avg: number
      user: { full_name: string | null }
    } | null
  } | null
  courier_review?: {
    id: string
    rating: number
    comment: string | null
    status: string
    created_at: string
  } | null
  delivery_dispute?: {
    id: string
    reason: string
    description: string | null
    status: 'OPEN' | 'RESOLVED' | 'DISMISSED'
    created_at: string
    admin_note?: string | null
  } | null
  return_request?: OrderReturnRequest | null
}

export interface CheckoutOrderResult {
  orderId: string
  paymentId: string
  reference: string
  amount: number
  merchant: { id: string; business_name: string; slug: string }
}

export interface CheckoutResult {
  orders: CheckoutOrderResult[]
  total: number
  total_discount?: number
  total_delivery_fee?: number
  currency: string
  provider: string
  instructions: string
  orderId: string
  paymentId: string
  reference: string
  amount: number
}

export interface AppliedPromotionInput {
  shop_id: string
  promotion_id: string
  code: string
}

export interface CartPromoApplication {
  shop_id: string
  shop_name: string
  valid: boolean
  code: string
  promotion_id?: string
  promotion_title?: string
  discount: number
  free_delivery: boolean
  message: string
}

export interface ConfirmPaymentResult {
  status: 'SUCCESS' | 'FAILED'
  orderId?: string
  orderIds?: string[]
  message: string
}

export interface ProductVariantInput {
  name: string
  price: number
  stock_quantity?: number
  sku?: string
}

export interface CreateProductInput {
  name: string
  description?: string
  composition?: string
  price: number
  stock_quantity?: number
  image_url?: string
  images?: string[]
  status?: ProductStatus
  allow_pickup?: boolean
  allow_delivery?: boolean
  variants?: ProductVariantInput[]
  category_id?: string
}

export interface UpdateProductInput {
  name?: string
  description?: string
  composition?: string
  price?: number
  stock_quantity?: number
  image_url?: string
  images?: string[]
  status?: ProductStatus
  allow_pickup?: boolean
  allow_delivery?: boolean
  variants?: ProductVariantInput[]
  category_id?: string
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
}

export interface GuestCartItemInput {
  productId: string
  variantId?: string
  quantity: number
}

export interface GuestCheckoutInput extends CheckoutInput {
  guest_first_name: string
  guest_last_name: string
  create_account?: boolean
  email?: string
  password?: string
  cart_items: GuestCartItemInput[]
}

export interface ReorderResult {
  cart: Cart
  added_count: number
  added: string[]
  skipped: Array<{ name: string; reason: string }>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatPrice(amount: number | null | undefined, currency = 'XOF'): string {
  if (amount == null) return ''
  const label = currency === 'XOF' ? 'FCFA' : currency
  return `${amount.toLocaleString('fr-FR')} ${label}`
}

async function publicFetch<T>(path: string): Promise<T | null> {
  const result = await fetchPublicJson<T>(path)
  return result.ok ? result.data : null
}

export async function fetchPublicJson<T>(path: string, options?: RequestInit): Promise<FetchResult<T>> {
  try {
    const res = await fetchWithTimeout(authUrl(path), {
      ...options,
      headers: {
        ...countryRequestHeaders(),
        ...(options?.headers as Record<string, string> | undefined),
      },
    })
    if (!res.ok) {
      return { ok: false, error: await parseError(res) }
    }
    return { ok: true, data: await res.json() as T }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { ok: false, error: 'La requête a expiré. Vérifiez votre connexion.' }
    }
    return { ok: false, error: 'Impossible de joindre le serveur. Réessayez.' }
  }
}

async function parseJson<T>(res: Response): Promise<T | null> {
  if (!res.ok) return null
  return res.json() as Promise<T>
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json()
    if (Array.isArray(data.message)) return data.message.join(', ')
    return data.message ?? 'Erreur'
  } catch {
    return 'Erreur'
  }
}

export { parseError as parseApiError }

// ─── Public ───────────────────────────────────────────────────────────────────

export function fetchFeaturedProducts() {
  return publicFetch<FeaturedProduct[]>('/marketplace/featured')
}

export function fetchProductCategories(country?: string) {
  const qs = country ? `?country=${encodeURIComponent(country)}` : ''
  return publicFetch<ProductCategoryNode[]>(`/marketplace/product-categories${qs}`)
}

export function fetchMarketplaceProducts(params?: {
  q?: string
  merchant?: string
  category?: string
  sort?: string
  maxPrice?: number
}) {
  const qs = new URLSearchParams()
  if (params?.q) qs.set('q', params.q)
  if (params?.merchant) qs.set('merchant', params.merchant)
  if (params?.category) qs.set('category', params.category)
  if (params?.sort) qs.set('sort', params.sort)
  if (params?.maxPrice != null) qs.set('maxPrice', String(params.maxPrice))
  const query = qs.toString()
  return publicFetch<MarketplaceCatalogProduct[]>(
    `/marketplace/products${query ? `?${query}` : ''}`,
  )
}

export function fetchMarketplaceMerchants(limit = 20) {
  return publicFetch<MarketplaceBoutique[]>(`/marketplace/merchants?limit=${limit}`)
}

export function fetchMarketplaceSpotlight() {
  return publicFetch<MarketplaceSpotlightShop[]>('/marketplace/spotlight')
}

export interface ProductCategoryOption {
  id: string
  name: string
  slug: string
  icon: string | null
}

export function fetchMerchantProducts(
  shopSlug: string,
  params?: { category?: string; q?: string; collection?: string },
) {
  const qs = new URLSearchParams()
  if (params?.category) qs.set('category', params.category)
  if (params?.q) qs.set('q', params.q)
  if (params?.collection) qs.set('collection', params.collection)
  const query = qs.toString()
  return publicFetch<MarketplaceProduct[]>(
    `/shops/${shopSlug}/products${query ? `?${query}` : ''}`,
  )
}

export interface ShopCollectionPublic {
  id: string
  name: string
  slug: string
  description?: string | null
  product_count: number
}

export function fetchShopCollections(shopSlug: string) {
  return publicFetch<ShopCollectionPublic[]>(`/shops/${shopSlug}/collections`)
}

export interface ShopCollectionMine {
  id: string
  name: string
  slug: string
  description?: string | null
  sort_order: number
  is_active: boolean
  product_count: number
  product_ids?: string[]
  created_at: string
  updated_at: string
}

export interface ShopCollectionProduct {
  id: string
  name: string
  slug: string
  status: string
  image_url?: string | null
  sort_order: number
}

export function fetchShopProductCategories(shopSlug: string) {
  return publicFetch<ProductCategoryOption[]>(`/shops/${shopSlug}/product-categories`)
}

export function fetchProductDetail(shopSlug: string, productSlug: string) {
  return publicFetch<MarketplaceProduct>(`/shops/${shopSlug}/products/${productSlug}`)
}

// ─── Cart (auth) ──────────────────────────────────────────────────────────────

export async function fetchCart(): Promise<Cart | null> {
  const res = await authApiFetch('/cart')
  return parseJson<Cart>(res)
}

export async function addCartItem(
  productId: string,
  quantity: number,
  variantId?: string,
): Promise<{ cart: Cart | null; error?: string }> {
  const res = await authApiFetch('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity, ...(variantId ? { variantId } : {}) }),
  })
  if (!res.ok) return { cart: null, error: await parseError(res) }
  const cart = await res.json() as Cart
  return { cart }
}

export async function updateCartItemQuantity(
  itemId: string,
  quantity: number,
): Promise<{ cart: Cart | null; error?: string }> {
  const res = await authApiFetch(`/cart/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  })
  if (!res.ok) return { cart: null, error: await parseError(res) }
  const cart = await res.json() as Cart
  return { cart }
}

export async function clearCart(): Promise<boolean> {
  const res = await authApiFetch('/cart', { method: 'DELETE' })
  return res.ok
}

export async function fetchGuestCartPreview(
  items: GuestCartItemInput[],
): Promise<{ cart: Cart | null; error?: string }> {
  if (!items.length) return { cart: null }
  const res = await fetchWithTimeout(authUrl('/cart/guest/preview'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...countryRequestHeaders(),
    },
    body: JSON.stringify({ items }),
  })
  if (!res.ok) return { cart: null, error: await parseError(res) }
  const cart = await res.json() as Cart
  return { cart }
}

export async function applyCartPromo(
  code: string,
  shopId?: string,
): Promise<
  | { applications: CartPromoApplication[]; total_discount: number }
  | { error: string }
> {
  const res = await authApiFetch('/cart/promo/apply', {
    method: 'POST',
    body: JSON.stringify({ code, ...(shopId ? { shop_id: shopId } : {}) }),
  })
  if (!res.ok) return { error: await parseError(res) }
  return res.json() as Promise<{ applications: CartPromoApplication[]; total_discount: number }>
}

// ─── Orders (auth) ────────────────────────────────────────────────────────────

export async function checkout(
  input: CheckoutInput,
): Promise<{ result: CheckoutResult | null; error?: string }> {
  const res = await authApiFetch('/orders/checkout', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!res.ok) return { result: null, error: await parseError(res) }
  const result = await res.json() as CheckoutResult
  return { result }
}

export async function guestCheckout(
  input: GuestCheckoutInput,
): Promise<{ result: CheckoutResult | null; user?: unknown; error?: string }> {
  const res = await fetchWithTimeout(authUrl('/orders/checkout/guest'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...countryRequestHeaders(),
    },
    body: JSON.stringify(input),
  })
  if (!res.ok) return { result: null, error: await parseError(res) }
  const data = await res.json() as { checkout: CheckoutResult; user?: unknown }
  return { result: data.checkout, user: data.user }
}

export async function confirmOrderPayment(
  paymentId: string,
  simulateResult: 'success' | 'failure',
): Promise<{ result: ConfirmPaymentResult | null; error?: string }> {
  const res = await authApiFetch('/orders/pay/confirm', {
    method: 'POST',
    body: JSON.stringify({ paymentId, simulateResult }),
  })
  if (!res.ok) return { result: null, error: await parseError(res) }
  const result = await res.json() as ConfirmPaymentResult
  return { result }
}

export async function confirmBatchOrderPayments(
  paymentIds: string[],
  simulateResult: 'success' | 'failure',
): Promise<{ result: ConfirmPaymentResult | null; error?: string }> {
  const res = await authApiFetch('/orders/pay/confirm-batch', {
    method: 'POST',
    body: JSON.stringify({ paymentIds, simulateResult }),
  })
  if (!res.ok) return { result: null, error: await parseError(res) }
  const result = await res.json() as ConfirmPaymentResult
  return { result }
}

export interface ResumePaymentSession {
  checkoutResult: CheckoutResult
  cartSnapshot: {
    items: CartItem[]
    subtotal: number
    currency: string
    item_count: number
    merchant_count: number
    merchants: CartMerchantGroup[]
    merchant: Cart['merchant']
  }
  deliveryType: DeliveryType
  deliveryAddress?: string
  customerPhone?: string
  customerNote?: string
  discountAmount?: number
  deliveryFee?: number
}

export async function fetchResumePayment(
  orderIds: string[],
): Promise<{ session: ResumePaymentSession | null; error?: string }> {
  const qs = orderIds.map(id => encodeURIComponent(id)).join(',')
  const res = await authApiFetch(`/orders/pay/resume?orderIds=${qs}`)
  if (!res.ok) return { session: null, error: await parseError(res) }
  const session = (await res.json()) as ResumePaymentSession
  return { session }
}

export async function fetchMyOrders(): Promise<Order[]> {
  const res = await authApiFetch('/orders/mine')
  const data = await parseJson<Order[]>(res)
  return data ?? []
}

export async function fetchOrder(orderId: string): Promise<Order | null> {
  const res = await authApiFetch(`/orders/${orderId}`)
  return parseJson<Order>(res)
}

export interface OrderEtaSnapshot {
  prep_remaining_minutes: number
  travel_minutes: number
  eta_minutes: number
  eta_arrival_at: string | null
  eta_updated_at: string
}

export async function fetchOrderEta(orderId: string): Promise<OrderEtaSnapshot | null> {
  const res = await authApiFetch(`/orders/${orderId}/eta`)
  if (!res.ok) return null
  return res.json() as Promise<OrderEtaSnapshot>
}

export async function fetchMerchantOrderEta(
  orderId: string,
  shopId?: string | null,
): Promise<OrderEtaSnapshot | null> {
  const qs = shopId ? `?shopId=${encodeURIComponent(shopId)}` : ''
  const res = await authApiFetch(`/orders/merchant/${orderId}/eta${qs}`)
  if (!res.ok) return null
  return res.json() as Promise<OrderEtaSnapshot>
}

export async function reorderFromOrder(
  orderId: string,
): Promise<{ result: ReorderResult | null; error?: string }> {
  const res = await authApiFetch(`/orders/${orderId}/reorder`, { method: 'POST' })
  if (!res.ok) return { result: null, error: await parseError(res) }
  const result = await res.json() as ReorderResult
  return { result }
}

export async function fetchMerchantOrders(
  shopId: string | null | undefined,
  status?: OrderStatus,
): Promise<Order[]> {
  const path = status
    ? `/orders/merchant/mine?status=${status}`
    : '/orders/merchant/mine'
  const res = await shopApiFetch(path, shopId)
  const data = await parseJson<Order[]>(res)
  return data ?? []
}

export async function downloadMerchantOrdersCsv(
  shopId: string | null | undefined,
  days = 90,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const qs = new URLSearchParams({ days: String(days) })
  const res = await shopApiFetch(`/orders/merchant/export?${qs}`, shopId)
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    return { ok: false, error: err || 'Export impossible' }
  }
  const blob = await res.blob()
  const stamp = new Date().toISOString().slice(0, 10)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `commandes-${stamp}.csv`
  a.click()
  URL.revokeObjectURL(url)
  return { ok: true }
}

export interface ShopAnalyticsSummary {
  revenue: number
  orders_total: number
  orders_completed: number
  orders_pending: number
  orders_cancelled: number
  avg_order_value: number
  conversion_rate: number
  abandoned_checkouts: number
}

export interface ShopAnalyticsTopProduct {
  product_id: string | null
  menu_item_id: string | null
  name: string
  quantity_sold: number
  revenue: number
}

export interface ShopAnalytics {
  period_days: number
  summary: ShopAnalyticsSummary
  orders_by_status: Array<{ status: OrderStatus; count: number }>
  top_products: ShopAnalyticsTopProduct[]
  revenue_chart: Array<{ date: string; revenue: number; orders: number }>
}

export async function fetchShopAnalytics(
  shopId: string | null | undefined,
  days = 30,
): Promise<ShopAnalytics | null> {
  const res = await shopApiFetch(`/orders/merchant/analytics?days=${days}`, shopId)
  return parseJson<ShopAnalytics>(res)
}

export async function fetchMerchantOrder(
  orderId: string,
  shopId: string | null | undefined,
): Promise<Order | null> {
  const res = await shopApiFetch(`/orders/merchant/${orderId}`, shopId)
  return parseJson<Order>(res)
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  shopId: string | null | undefined,
): Promise<{ order: Order | null; error?: string }> {
  const res = await shopApiFetch(`/orders/${orderId}/status`, shopId, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  if (!res.ok) return { order: null, error: await parseError(res) }
  const order = await res.json() as Order
  return { order }
}

export async function createOrderReturn(
  orderId: string,
  input: { reason: OrderReturnReason; description?: string },
): Promise<{ result: OrderReturnRequest | null; error?: string }> {
  const res = await authApiFetch(`/orders/${orderId}/returns`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!res.ok) return { result: null, error: await parseError(res) }
  const result = await res.json() as OrderReturnRequest
  return { result }
}

export async function createCourierReview(
  orderId: string,
  input: { rating: number; comment?: string },
): Promise<{ result: Order['courier_review'] | null; error?: string }> {
  const res = await authApiFetch(`/orders/${orderId}/courier-review`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!res.ok) return { result: null, error: await parseError(res) }
  const result = await res.json() as NonNullable<Order['courier_review']>
  return { result }
}

export const DELIVERY_DISPUTE_REASONS = [
  { value: 'non_recu', label: 'Colis non reçu' },
  { value: 'endommage', label: 'Colis endommagé' },
  { value: 'mauvais_colis', label: 'Mauvais colis livré' },
  { value: 'comportement', label: 'Problème avec le livreur' },
  { value: 'autre', label: 'Autre' },
] as const

export const DELIVERY_DISPUTE_STATUS_LABELS: Record<NonNullable<Order['delivery_dispute']>['status'], string> = {
  OPEN: 'En cours d\'examen',
  RESOLVED: 'Résolu',
  DISMISSED: 'Classé sans suite',
}

export async function createDeliveryDispute(
  orderId: string,
  input: { reason: string; description?: string },
): Promise<{ result: Order['delivery_dispute'] | null; error?: string }> {
  const res = await authApiFetch(`/orders/${orderId}/delivery-dispute`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!res.ok) return { result: null, error: await parseError(res) }
  const result = await res.json() as NonNullable<Order['delivery_dispute']>
  return { result }
}

export async function fetchMerchantReturns(
  shopId: string | null | undefined,
  status?: OrderReturnStatus,
): Promise<MerchantOrderReturn[]> {
  const qs = status ? `?status=${status}` : ''
  const res = await shopApiFetch(`/orders/merchant/returns${qs}`, shopId)
  const data = await parseJson<MerchantOrderReturn[]>(res)
  return data ?? []
}

export async function updateOrderReturn(
  returnId: string,
  input: { status: 'APPROVED' | 'REJECTED' | 'REFUNDED'; merchant_note?: string },
  shopId: string | null | undefined,
): Promise<{ result: MerchantOrderReturn | null; error?: string }> {
  const res = await shopApiFetch(`/orders/returns/${returnId}`, shopId, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  if (!res.ok) return { result: null, error: await parseError(res) }
  const result = await res.json() as MerchantOrderReturn
  return { result }
}

// ─── Merchant products (auth) ─────────────────────────────────────────────────

export async function fetchMyProducts(shopId: string | null | undefined): Promise<MarketplaceProduct[]> {
  const res = await shopApiFetch('/products/mine', shopId)
  const data = await parseJson<MarketplaceProduct[]>(res)
  return data ?? []
}

export async function createProduct(
  input: CreateProductInput,
  shopId: string | null | undefined,
): Promise<{ product: MarketplaceProduct | null; error?: string }> {
  const res = await shopApiFetch('/products', shopId, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!res.ok) return { product: null, error: await parseError(res) }
  const product = await res.json() as MarketplaceProduct
  return { product }
}

export async function updateProduct(
  productId: string,
  input: UpdateProductInput,
  shopId: string | null | undefined,
): Promise<{ product: MarketplaceProduct | null; error?: string }> {
  const res = await shopApiFetch(`/products/${productId}`, shopId, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  if (!res.ok) return { product: null, error: await parseError(res) }
  const product = await res.json() as MarketplaceProduct
  return { product }
}

export async function deleteProduct(
  productId: string,
  shopId: string | null | undefined,
): Promise<{ success: boolean; error?: string }> {
  const res = await shopApiFetch(`/products/${productId}`, shopId, {
    method: 'DELETE',
  })
  if (!res.ok) return { success: false, error: await parseError(res) }
  return { success: true }
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  READY: 'Prête',
  OUT_FOR_DELIVERY: 'En livraison',
  DELIVERED: 'Livrée',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
}

export const ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PREPARING: 'bg-blue-50 text-blue-700 border-blue-200',
  READY: 'bg-violet-50 text-violet-700 border-violet-200',
  OUT_FOR_DELIVERY: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  DELIVERED: 'bg-teal-50 text-teal-700 border-teal-200',
  COMPLETED: 'bg-slate-50 text-slate-600 border-slate-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
  REFUNDED: 'bg-slate-50 text-slate-500 border-slate-200',
}

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Brouillon',
  ACTIVE: 'Actif',
  OUT_OF_STOCK: 'Rupture',
  ARCHIVED: 'Archivé',
}

export const PLACEHOLDER_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=400'
