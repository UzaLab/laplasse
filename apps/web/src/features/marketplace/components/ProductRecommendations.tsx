'use client'

import { useEffect, useState } from 'react'
import { ProductCarousel } from '@/features/marketplace/components/ProductCarousel'
import { fetchRecommendations } from '@/lib/discoveryApi'
import type { MarketplaceProduct } from '@/lib/marketplaceApi'
import { useMarketplaceAddToCart } from '@/hooks/useMarketplaceAddToCart'
import { useT } from '@/providers/LocaleProvider'

const CAROUSEL_LIMIT = 10

export function ProductRecommendations({
  productId,
  title,
  limit = CAROUSEL_LIMIT,
}: {
  productId?: string
  title?: string
  limit?: number
}) {
  const t = useT()
  const { addToCart } = useMarketplaceAddToCart()
  const [items, setItems] = useState<MarketplaceProduct[]>([])
  const [addingId, setAddingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchRecommendations(productId, Math.min(limit, CAROUSEL_LIMIT))
      .then(data => { if (!cancelled) setItems(data) })
      .catch(() => { if (!cancelled) setItems([]) })
    return () => { cancelled = true }
  }, [productId, limit])

  const handleAdd = async (product: MarketplaceProduct) => {
    setAddingId(product.id)
    await addToCart(product.id, 1)
    setAddingId(null)
  }

  return (
    <ProductCarousel
      products={items}
      title={title ?? t('discovery.recommendations')}
      maxItems={CAROUSEL_LIMIT}
      getCardProps={product => ({
        showAddButton: true,
        onAdd: () => handleAdd(product),
        adding: addingId === product.id,
      })}
    />
  )
}
