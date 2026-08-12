import { secureStorage } from '@/src/lib/secureStorage'

export interface GuestCartLine {
  productId: string
  quantity: number
  variantId?: string
}

const STORAGE_KEY = 'lp_guest_cart'

function lineKey(item: Pick<GuestCartLine, 'productId' | 'variantId'>) {
  return `${item.productId}:${item.variantId ?? ''}`
}

async function read(): Promise<GuestCartLine[]> {
  try {
    const raw = await secureStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as GuestCartLine[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function write(items: GuestCartLine[]) {
  if (items.length === 0) {
    await secureStorage.deleteItem(STORAGE_KEY)
    return
  }
  await secureStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export async function getGuestCartLines(): Promise<GuestCartLine[]> {
  return read()
}

export async function setGuestCartLines(items: GuestCartLine[]) {
  await write(items)
}

export async function addGuestCartLine(item: GuestCartLine) {
  const items = await read()
  const key = lineKey(item)
  const existing = items.find(i => lineKey(i) === key)
  if (existing) {
    existing.quantity += item.quantity
  } else {
    items.push({ ...item })
  }
  await write(items)
}

export async function updateGuestCartLine(
  productId: string,
  variantId: string | undefined,
  quantity: number,
) {
  const items = await read()
  const key = lineKey({ productId, variantId })
  const idx = items.findIndex(i => lineKey(i) === key)
  if (quantity <= 0) {
    if (idx >= 0) items.splice(idx, 1)
  } else if (idx >= 0) {
    items[idx].quantity = quantity
  }
  await write(items)
}

export async function updateGuestCartLineByLocalId(localId: string, quantity: number) {
  const match = localId.match(/^guest-(.+)-(base|[\w-]+)$/)
  if (!match) return
  const productId = match[1]
  const variantPart = match[2]
  const variantId = variantPart === 'base' ? undefined : variantPart
  await updateGuestCartLine(productId, variantId, quantity)
}

export async function clearGuestCart() {
  await write([])
}
