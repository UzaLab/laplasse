'use client'

import { useEffect, useState } from 'react'
import { ProductCard } from '@/features/marketplace/components/ProductCard'
import { fetchRecommendations } from '@/lib/discoveryApi'
import type { MarketplaceProduct } from '@/lib/marketplaceApi'
import { useT } from '@/providers/LocaleProvider'

export function ProductRecommendations({
  productId,
  title,
  limit = 8,
}: {
  productId?: string
  title?: string
  limit?: number
}) {
  const t = useT()
  const [items, setItems] = useState<MarketplaceProduct[]>([])

  useEffect(() => {
    let cancelled = false
    fetchRecommendations(productId, limit)
      .then(data => { if (!cancelled) setItems(data) })
      .catch(() => { if (!cancelled) setItems([]) })
    return () => { cancelled = true }
  }, [productId, limit])

  if (!items.length) return null

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-extrabold text-slate-900">
        {title ?? t('discovery.recommendations')}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
