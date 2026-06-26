const NEW_PRODUCT_MS = 7 * 24 * 60 * 60 * 1000

export function isProductNew(createdAt?: string | null): boolean {
  if (!createdAt) return false
  const created = new Date(createdAt).getTime()
  if (Number.isNaN(created)) return false
  return Date.now() - created < NEW_PRODUCT_MS
}

export function isProductBestSeller(product: {
  is_best_seller?: boolean
  sales_count?: number
}): boolean {
  return Boolean(product.is_best_seller && (product.sales_count ?? 0) > 0)
}
