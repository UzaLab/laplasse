'use client'

import { formatPrice, PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/marketplaceApi'
import type { ProductSearchHit } from '@/features/discovery/components/ProductSearchResultCard'
import { MobileProductCard } from '@/features/marketplace/components/MobileProductCard'

interface SearchResultsMobileProductCardProps {
  product: ProductSearchHit
  variant?: 'grid' | 'carousel' | 'compact'
}

export function SearchResultsMobileProductCard({
  product,
  variant = 'grid',
}: SearchResultsMobileProductCardProps) {
  const href = `/m/${product.merchant.slug}/p/${product.slug}`
  const mobileVariant = variant === 'carousel' ? 'carousel' : 'compact'

  return (
    <MobileProductCard
      href={href}
      name={product.name}
      formattedNameHtml={product._formatted?.name}
      image={product.image_url || PLACEHOLDER_PRODUCT_IMAGE}
      priceLabel={formatPrice(product.price, product.currency)}
      variant={mobileVariant}
    />
  )
}
