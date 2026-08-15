import type { Cart, CheckoutResult, DeliveryQuoteItem } from '@laplasse/api-client'
import { secureStorage } from '@/src/lib/secureStorage'

const SESSION_KEY = 'laplasse_checkout_session'
const CONFIRMATION_KEY = 'laplasse_checkout_confirmation'
const DRAFT_KEY = 'laplasse_checkout_draft'

export interface CheckoutDraft {
  deliveryType: 'PICKUP' | 'DELIVERY'
  deliveryAddress?: string
  deliveryCityId?: string
  deliveryCommuneId?: string
  deliveryDistrict?: string
  deliveryAddressDetail?: string
  customerPhone?: string
  customerNote?: string
  selectedAddressId?: string
  foodPreorderFor?: string
}

export interface CheckoutSession {
  checkoutResult: CheckoutResult
  flow?: 'marketplace' | 'food'
  cartSnapshot: {
    items: Cart['items']
    subtotal: number
    currency: string
    item_count: number
    merchant_count: number
    merchants: Cart['merchants']
    merchant: Cart['merchant']
  }
  deliveryType: 'PICKUP' | 'DELIVERY'
  deliveryAddress?: string
  customerPhone?: string
  customerNote?: string
  discountAmount?: number
  deliveryFee?: number
  deliveryQuotes?: DeliveryQuoteItem[]
}

export interface CheckoutConfirmation {
  status: 'success' | 'failure'
  orderIds: string[]
  references: string[]
  total: number
  currency: string
  deliveryType: 'PICKUP' | 'DELIVERY'
  deliveryAddress?: string
  customerPhone?: string
  cartSnapshot: CheckoutSession['cartSnapshot']
  checkoutOrders: CheckoutResult['orders']
  discountAmount?: number
  deliveryFee?: number
}

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await secureStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

async function writeJson(key: string, value: unknown) {
  await secureStorage.setItem(key, JSON.stringify(value))
}

export async function getCheckoutSession() {
  return readJson<CheckoutSession>(SESSION_KEY)
}

export async function saveCheckoutSession(session: CheckoutSession) {
  await writeJson(SESSION_KEY, session)
}

export async function clearCheckoutSession() {
  await secureStorage.deleteItem(SESSION_KEY)
}

export async function getCheckoutDraft() {
  return readJson<CheckoutDraft>(DRAFT_KEY)
}

export async function saveCheckoutDraft(draft: CheckoutDraft) {
  await writeJson(DRAFT_KEY, draft)
}

export async function getCheckoutConfirmation() {
  return readJson<CheckoutConfirmation>(CONFIRMATION_KEY)
}

export async function saveCheckoutConfirmation(data: CheckoutConfirmation) {
  await writeJson(CONFIRMATION_KEY, data)
}

export async function clearCheckoutConfirmation() {
  await secureStorage.deleteItem(CONFIRMATION_KEY)
}

export function buildCheckoutSession(
  cart: Cart,
  checkoutResult: CheckoutResult,
  meta: {
    flow?: 'marketplace' | 'food'
    deliveryType: 'PICKUP' | 'DELIVERY'
    deliveryAddress?: string
    customerPhone?: string
    customerNote?: string
    discountAmount?: number
    deliveryFee?: number
    deliveryQuotes?: DeliveryQuoteItem[]
  },
): CheckoutSession {
  return {
    flow: meta.flow,
    checkoutResult,
    cartSnapshot: {
      items: cart.items,
      subtotal: cart.subtotal,
      currency: cart.currency,
      item_count: cart.item_count,
      merchant_count: cart.merchant_count ?? 1,
      merchants: cart.merchants,
      merchant: cart.merchant,
    },
    deliveryType: meta.deliveryType,
    deliveryAddress: meta.deliveryAddress,
    customerPhone: meta.customerPhone,
    customerNote: meta.customerNote,
    discountAmount: meta.discountAmount,
    deliveryFee: meta.deliveryFee,
    deliveryQuotes: meta.deliveryQuotes,
  }
}

export function buildCheckoutConfirmation(
  session: CheckoutSession,
  status: 'success' | 'failure',
): CheckoutConfirmation {
  const orders = session.checkoutResult.orders
  return {
    status,
    orderIds: orders.map(o => o.orderId),
    references: orders.map(o => o.reference),
    total: session.checkoutResult.total,
    currency: session.checkoutResult.currency,
    deliveryType: session.deliveryType,
    deliveryAddress: session.deliveryAddress,
    customerPhone: session.customerPhone,
    cartSnapshot: session.cartSnapshot,
    checkoutOrders: orders,
    discountAmount: session.discountAmount,
    deliveryFee: session.deliveryFee,
  }
}
