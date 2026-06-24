/** Produit marketplace ajoutable en un clic depuis une liste (sans choix de variante). */
export interface MarketplaceQuickAddProduct {
  has_variants?: boolean
  can_quick_add?: boolean
  default_variant_id?: string | null
  merchant: { slug: string }
  slug: string
}

export function shouldRedirectToProductPage(product: MarketplaceQuickAddProduct): boolean {
  return (
    product.can_quick_add === false
    || Boolean(product.has_variants && !product.default_variant_id)
  )
}

export function marketplaceQuickAddOptions(product: MarketplaceQuickAddProduct) {
  return {
    variantId: product.default_variant_id ?? undefined,
  }
}

export function marketplaceProductHref(product: MarketplaceQuickAddProduct): string {
  return `/m/${product.merchant.slug}/p/${product.slug}`
}
