export interface PendingCartAdd {
  productId: string
  quantity: number
  variantId?: string
}

const STORAGE_KEY = 'lp_pending_cart_adds'

function read(): PendingCartAdd[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PendingCartAdd[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write(items: PendingCartAdd[]) {
  if (typeof window === 'undefined') return
  if (items.length === 0) {
    sessionStorage.removeItem(STORAGE_KEY)
    return
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function getPendingCartAdds(): PendingCartAdd[] {
  return read()
}

export function addPendingCartAdd(item: PendingCartAdd) {
  const items = read()
  const existing = items.find(
    i => i.productId === item.productId && i.variantId === item.variantId,
  )
  if (existing) {
    existing.quantity += item.quantity
  } else {
    items.push(item)
  }
  write(items)
}

export function clearPendingCartAdds() {
  write([])
}

export function hasPendingCartAdds(): boolean {
  return read().length > 0
}
