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

export function computePromoPriceForAmount(
  amount: number,
  promotion: ProductPromotionInfo,
): { promoPrice: number; discountAmount: number } | null {
  if (promotion.type === 'FREE_DELIVERY') return null
  if (promotion.type === 'PERCENTAGE') {
    const discountAmount = Math.floor((amount * promotion.value) / 100)
    if (discountAmount <= 0) return null
    return { promoPrice: Math.max(amount - discountAmount, 0), discountAmount }
  }
  if (promotion.type === 'FIXED') {
    const discountAmount = Math.min(Math.floor(promotion.value), amount)
    if (discountAmount <= 0) return null
    return { promoPrice: Math.max(amount - discountAmount, 0), discountAmount }
  }
  return null
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
  if (product.promotion && product.promotion.type !== 'FREE_DELIVERY') {
    const computed = computePromoPriceForAmount(basePrice, product.promotion)
    if (computed) {
      return {
        displayPrice: computed.promoPrice,
        originalPrice: basePrice,
        hasDiscount: true,
      }
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
