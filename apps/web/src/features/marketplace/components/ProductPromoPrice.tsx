'use client'

import { formatPrice } from '@/lib/marketplaceApi'
import {
  getProductDisplayPrices,
  getPromoBadgeLabel,
  type ProductWithPromo,
} from '@/lib/productPromoUtils'
import { cn } from '@/lib/utils'

interface ProductPromoPriceProps {
  product: ProductWithPromo
  currency?: string
  priceClassName?: string
  originalClassName?: string
  showBadge?: boolean
  badgeClassName?: string
  layout?: 'inline' | 'stacked'
}

export function ProductPromoPrice({
  product,
  currency = 'XOF',
  priceClassName = 'font-extrabold text-brand-600',
  originalClassName = 'text-sm text-slate-400 line-through font-medium',
  showBadge = false,
  badgeClassName,
  layout = 'inline',
}: ProductPromoPriceProps) {
  const { displayPrice, originalPrice, hasDiscount } = getProductDisplayPrices(product)
  const promotion = product.promotion

  if (layout === 'stacked') {
    return (
      <div>
        <div className="flex items-end gap-3 flex-wrap">
          <span className={priceClassName}>{formatPrice(displayPrice, currency)}</span>
          {hasDiscount && originalPrice != null && (
            <span className={originalClassName}>{formatPrice(originalPrice, currency)}</span>
          )}
          {showBadge && promotion && (
            <span className={cn(
              'text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-rose-500 text-white',
              badgeClassName,
            )}
            >
              {getPromoBadgeLabel(promotion)}
            </span>
          )}
        </div>
        {promotion?.code && (
          <p className="text-xs text-amber-700 font-semibold mt-1">
            Code : <span className="font-mono">{promotion.code}</span>
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={priceClassName}>{formatPrice(displayPrice, currency)}</span>
      {hasDiscount && originalPrice != null && (
        <span className={originalClassName}>{formatPrice(originalPrice, currency)}</span>
      )}
      {showBadge && promotion && (
        <span className={cn(
          'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white',
          badgeClassName,
        )}
        >
          {getPromoBadgeLabel(promotion)}
        </span>
      )}
    </div>
  )
}
