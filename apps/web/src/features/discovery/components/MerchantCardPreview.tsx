'use client'

import type { ApiMerchant } from '@/lib/api'
import { ShopPreviewSnippet } from './ShopPreviewSnippet'
import { VerticalPreviewSnippet } from './VerticalPreviewSnippet'

interface MerchantCardPreviewProps {
  merchant: Pick<ApiMerchant, 'slug' | 'has_marketplace' | 'featured_product' | 'featured_vertical'>
  className?: string
}

/** Vitrine boutique ou, à défaut, contenu métier (menu, chambre, prestation…). */
export function MerchantCardPreview({ merchant, className }: MerchantCardPreviewProps) {
  if (merchant.has_marketplace && merchant.featured_product) {
    return (
      <ShopPreviewSnippet
        product={merchant.featured_product}
        merchantSlug={merchant.slug}
        className={className}
      />
    )
  }

  if (merchant.featured_vertical) {
    return (
      <VerticalPreviewSnippet
        item={merchant.featured_vertical}
        merchantSlug={merchant.slug}
        className={className}
      />
    )
  }

  return null
}
