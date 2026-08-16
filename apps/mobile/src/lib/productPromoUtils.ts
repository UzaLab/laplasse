export interface ProductPromotionInfo {
  id: string
  title: string
  type: string
  value: number
  code?: string | null
  discount_amount?: number
  promo_price?: number | null
}

export interface ProductWithPromo {
  price: number
  original_price?: number
  promo_price?: number | null
  promotion?: ProductPromotionInfo | null
}

export function getProductDisplayPrices(product: ProductWithPromo) {
  const basePrice = product.price
  if (product.promo_price != null && product.original_price != null) {
    return {
      displayPrice: product.promo_price,
      originalPrice: product.original_price,
      hasDiscount: product.promo_price < product.original_price,
    }
  }
  return {
    displayPrice: basePrice,
    originalPrice: null as number | null,
    hasDiscount: false,
  }
}

export function getPromoBadgeLabel(promotion: ProductPromotionInfo): string {
  if (promotion.type === 'PERCENTAGE') return `-${Math.round(promotion.value)}%`
  if (promotion.type === 'FIXED') return `-${Math.round(promotion.value).toLocaleString('fr-FR')} F`
  if (promotion.type === 'FREE_DELIVERY') return 'Livraison offerte'
  return 'Promo'
}
