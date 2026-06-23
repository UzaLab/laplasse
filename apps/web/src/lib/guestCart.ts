export interface GuestCartLine {
  productId: string
  quantity: number
  variantId?: string
}

const STORAGE_KEY = 'lp_guest_cart'

function read(): GuestCartLine[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as GuestCartLine[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write(items: GuestCartLine[]) {
  if (typeof window === 'undefined') return
  if (items.length === 0) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function lineKey(item: Pick<GuestCartLine, 'productId' | 'variantId'>) {
  return `${item.productId}:${item.variantId ?? ''}`
}

export function getGuestCartLines(): GuestCartLine[] {
  return read()
}

export function addGuestCartLine(item: GuestCartLine) {
  const items = read()
  const key = lineKey(item)
  const existing = items.find(i => lineKey(i) === key)
  if (existing) {
    existing.quantity += item.quantity
  } else {
    items.push({ ...item })
  }
  write(items)
}

export function updateGuestCartLine(
  productId: string,
  variantId: string | undefined,
  quantity: number,
) {
  const items = read()
  const key = lineKey({ productId, variantId })
  const idx = items.findIndex(i => lineKey(i) === key)
  if (quantity <= 0) {
    if (idx >= 0) items.splice(idx, 1)
  } else if (idx >= 0) {
    items[idx].quantity = quantity
  }
  write(items)
}

export function updateGuestCartLineByLocalId(localId: string, quantity: number) {
  const match = localId.match(/^guest-(.+)-(base|[\w-]+)$/)
  if (!match) return
  const productId = match[1]
  const variantPart = match[2]
  const variantId = variantPart === 'base' ? undefined : variantPart
  updateGuestCartLine(productId, variantId, quantity)
}

export function clearGuestCart() {
  write([])
}

export function guestCartItemCount(): number {
  return read().reduce((sum, i) => sum + i.quantity, 0)
}
