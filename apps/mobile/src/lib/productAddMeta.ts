type ProductAddSource = {
  has_variants?: boolean
  can_quick_add?: boolean
  default_variant_id?: string | null
  variants?: Array<{ id: string; stock_quantity?: number }>
}

export function resolveProductQuickAdd(product: ProductAddSource): {
  needsVariant: boolean
  variantId?: string
} {
  const inStockVariants = (product.variants ?? []).filter(v => (v.stock_quantity ?? 1) > 0)
  const variantId = product.default_variant_id ?? inStockVariants[0]?.id ?? undefined

  if (product.can_quick_add && variantId) {
    return { needsVariant: false, variantId }
  }

  if (product.has_variants && inStockVariants.length > 1) {
    return { needsVariant: true }
  }

  return { needsVariant: false, variantId }
}
