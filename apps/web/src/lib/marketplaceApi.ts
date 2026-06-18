import { authApiFetch } from './authFetch'
import { authUrl } from './authClient'
import { shopApiFetch } from './shopApi'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED'
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'
export type DeliveryType = 'PICKUP' | 'DELIVERY'

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
  status: ProductStatus
  allow_pickup?: boolean
  allow_delivery?: boolean
  has_variants?: boolean
  variants?: ProductVariant[]
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
}

export interface MarketplaceCatalogProduct extends FeaturedProduct {
  created_at?: string
  merchant: { business_name: string; slug: string; logo?: string | null }
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
  variant_id?: string | null
  product_name: string
  variant_name?: string | null
  unit_price: number
  quantity: number
  line_total: number
}

export interface Order {
  id: string
  status: OrderStatus
  delivery_type: DeliveryType
  delivery_address?: string | null
  customer_note?: string | null
  customer_phone?: string | null
  subtotal: number
  total: number
  created_at: string
  items: OrderItem[]
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
    status: string
    reference: string
    paid_at?: string | null
  } | null
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
  currency: string
  provider: string
  instructions: string
  orderId: string
  paymentId: string
  reference: string
  amount: number
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
  status?: ProductStatus
  allow_pickup?: boolean
  allow_delivery?: boolean
  variants?: ProductVariantInput[]
}

export interface UpdateProductInput {
  name?: string
  description?: string
  composition?: string
  price?: number
  stock_quantity?: number
  image_url?: string
  status?: ProductStatus
  allow_pickup?: boolean
  allow_delivery?: boolean
  variants?: ProductVariantInput[]
}

export interface CheckoutInput {
  delivery_type: DeliveryType
  delivery_address?: string
  customer_note?: string
  customer_phone?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatPrice(amount: number | null | undefined, currency = 'XOF'): string {
  if (amount == null) return ''
  const label = currency === 'XOF' ? 'FCFA' : currency
  return `${amount.toLocaleString('fr-FR')} ${label}`
}

async function publicFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(authUrl(path))
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
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

// ─── Public ───────────────────────────────────────────────────────────────────

export function fetchFeaturedProducts() {
  return publicFetch<FeaturedProduct[]>('/marketplace/featured')
}

export function fetchMarketplaceProducts(params?: {
  q?: string
  merchant?: string
  sort?: string
  maxPrice?: number
}) {
  const qs = new URLSearchParams()
  if (params?.q) qs.set('q', params.q)
  if (params?.merchant) qs.set('merchant', params.merchant)
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

export function fetchMerchantProducts(shopSlug: string) {
  return publicFetch<MarketplaceProduct[]>(`/shops/${shopSlug}/products`)
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

export async function fetchMyOrders(): Promise<Order[]> {
  const res = await authApiFetch('/orders/mine')
  const data = await parseJson<Order[]>(res)
  return data ?? []
}

export async function fetchOrder(orderId: string): Promise<Order | null> {
  const res = await authApiFetch(`/orders/${orderId}`)
  return parseJson<Order>(res)
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
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
}

export const ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PREPARING: 'bg-blue-50 text-blue-700 border-blue-200',
  READY: 'bg-violet-50 text-violet-700 border-violet-200',
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
