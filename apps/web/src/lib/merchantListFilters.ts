/** Recherche texte côté client pour listes marchand. */
export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase()
}

export function matchesSearchQuery(
  fields: Array<string | null | undefined>,
  query: string,
): boolean {
  const q = normalizeSearchQuery(query)
  if (!q) return true
  return fields.some(f => f && f.toLowerCase().includes(q))
}

export const LOW_STOCK_THRESHOLD = 5

export interface ProductStockSource {
  stock_quantity: number
  variants?: Array<{ stock_quantity: number }> | null
}

export function getProductStockQuantity(product: ProductStockSource): number {
  if (product.variants?.length) {
    return product.variants.reduce((sum, variant) => sum + (variant.stock_quantity ?? 0), 0)
  }
  return product.stock_quantity ?? 0
}

export function isProductOutOfStock(product: ProductStockSource): boolean {
  return getProductStockQuantity(product) <= 0
}

export function isProductLowStock(product: ProductStockSource): boolean {
  const quantity = getProductStockQuantity(product)
  return quantity > 0 && quantity <= LOW_STOCK_THRESHOLD
}
