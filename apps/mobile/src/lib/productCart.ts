import type { Cart, CartItem } from '@laplasse/api-client'
import { isMenuMirrorSlug } from '@/src/lib/cartKind'

type ProductCartLine = CartItem & {
  menu_item_id?: string | null
  line_kind?: 'menu' | 'product'
}

function isMarketplaceLine(item: ProductCartLine): boolean {
  if (item.line_kind === 'menu' || item.menu_item_id) return false
  if (item.line_kind === 'product') return true
  const slug = item.product?.slug ?? ''
  return !isMenuMirrorSlug(slug)
}

function variantKey(variantId?: string | null): string {
  return variantId ?? ''
}

export function findProductCartLine(
  cart: Cart | null,
  productId: string,
  variantId?: string | null,
): ProductCartLine | null {
  if (!cart) return null
  const targetVariant = variantKey(variantId)
  let fallback: ProductCartLine | null = null

  for (const raw of cart.items) {
    const item = raw as ProductCartLine
    if (!isMarketplaceLine(item)) continue
    if (item.product?.id !== productId) continue

    const lineVariant = variantKey(item.variant_id ?? item.variant?.id)
    if (lineVariant === targetVariant) return item
    if (!fallback) fallback = item
  }

  if (targetVariant === '' && fallback) return fallback
  return null
}

export function getProductQty(
  cart: Cart | null,
  productId: string,
  variantId?: string | null,
): number {
  return findProductCartLine(cart, productId, variantId)?.quantity ?? 0
}
