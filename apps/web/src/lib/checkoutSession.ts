import type { Cart, CheckoutResult } from '@/lib/marketplaceApi'
import type { DeliveryQuoteItem } from '@/lib/geoApi'

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
  saveNewAddress?: boolean
  newAddressLabel?: string
}

export interface CheckoutSession {
  checkoutResult: CheckoutResult
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
  deliveryCityId?: string
  deliveryCommuneId?: string
  deliveryDistrict?: string
  deliveryAddressDetail?: string
  customerPhone?: string
  customerNote?: string
  selectedAddressId?: string
  saveNewAddress?: boolean
  newAddressLabel?: string
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
  customerNote?: string
  cartSnapshot: CheckoutSession['cartSnapshot']
  checkoutOrders: CheckoutResult['orders']
  discountAmount?: number
  deliveryFee?: number
  deliveryQuotes?: DeliveryQuoteItem[]
}

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(key, JSON.stringify(value))
}

export function saveCheckoutSession(session: CheckoutSession) {
  writeJson(SESSION_KEY, session)
}

export function getCheckoutSession(): CheckoutSession | null {
  return readJson<CheckoutSession>(SESSION_KEY)
}

export function clearCheckoutSession() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(SESSION_KEY)
}

export function saveCheckoutConfirmation(data: CheckoutConfirmation) {
  writeJson(CONFIRMATION_KEY, data)
}

export function getCheckoutConfirmation(): CheckoutConfirmation | null {
  return readJson<CheckoutConfirmation>(CONFIRMATION_KEY)
}

export function clearCheckoutConfirmation() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(CONFIRMATION_KEY)
}

export function saveCheckoutDraft(draft: CheckoutDraft) {
  writeJson(DRAFT_KEY, draft)
}

export function getCheckoutDraft(): CheckoutDraft | null {
  return readJson<CheckoutDraft>(DRAFT_KEY)
}

export function clearCheckoutDraft() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(DRAFT_KEY)
}

/** Reprend un brouillon depuis la session paiement (retour étape livraison). */
export function draftFromCheckoutSession(session: CheckoutSession): CheckoutDraft {
  return {
    deliveryType: session.deliveryType,
    deliveryAddress: session.deliveryAddress,
    deliveryCityId: session.deliveryCityId,
    deliveryCommuneId: session.deliveryCommuneId,
    deliveryDistrict: session.deliveryDistrict,
    deliveryAddressDetail: session.deliveryAddressDetail,
    customerPhone: session.customerPhone,
    customerNote: session.customerNote,
    selectedAddressId: session.selectedAddressId,
    saveNewAddress: session.saveNewAddress,
    newAddressLabel: session.newAddressLabel,
  }
}

/** Source la plus récente : brouillon actif, sinon session checkout en cours. */
export function getCheckoutFormState(): CheckoutDraft | null {
  return getCheckoutDraft() ?? (() => {
    const session = getCheckoutSession()
    return session ? draftFromCheckoutSession(session) : null
  })()
}

export function buildCheckoutSession(
  cart: Cart,
  checkoutResult: CheckoutResult,
  delivery: Pick<
    CheckoutSession,
    | 'deliveryType'
    | 'deliveryAddress'
    | 'deliveryCityId'
    | 'deliveryCommuneId'
    | 'deliveryDistrict'
    | 'deliveryAddressDetail'
    | 'customerPhone'
    | 'customerNote'
    | 'selectedAddressId'
    | 'saveNewAddress'
    | 'newAddressLabel'
    | 'discountAmount'
    | 'deliveryFee'
    | 'deliveryQuotes'
  >,
): CheckoutSession {
  return {
    checkoutResult,
    cartSnapshot: {
      items: cart.items,
      subtotal: cart.subtotal,
      currency: cart.currency,
      item_count: cart.item_count,
      merchant_count: cart.merchant_count,
      merchants: cart.merchants,
      merchant: cart.merchant,
    },
    ...delivery,
  }
}

export function buildCheckoutConfirmation(
  session: CheckoutSession,
  status: 'success' | 'failure',
): CheckoutConfirmation {
  return {
    status,
    orderIds: session.checkoutResult.orders.map(o => o.orderId),
    references: session.checkoutResult.orders.map(o => o.reference),
    total: session.checkoutResult.total,
    currency: session.checkoutResult.currency,
    deliveryType: session.deliveryType,
    deliveryAddress: session.deliveryAddress,
    customerPhone: session.customerPhone,
    customerNote: session.customerNote,
    cartSnapshot: session.cartSnapshot,
    checkoutOrders: session.checkoutResult.orders,
    discountAmount: session.discountAmount,
    deliveryFee: session.deliveryFee,
    deliveryQuotes: session.deliveryQuotes,
  }
}
