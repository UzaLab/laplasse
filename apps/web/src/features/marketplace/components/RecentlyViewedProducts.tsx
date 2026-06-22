'use client'

import { useEffect, useState } from 'react'
import { ProductCard } from '@/features/marketplace/components/ProductCard'
import { fetchRecentlyViewed } from '@/lib/discoveryApi'
import type { MarketplaceProduct } from '@/lib/marketplaceApi'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useT } from '@/providers/LocaleProvider'

export function RecentlyViewedProducts({
  excludeProductId,
  title,
  limit = 8,
}: {
  excludeProductId?: string
  title?: string
  limit?: number
}) {
  const t = useT()
  const { isAuthenticated } = useAuthReady()
  const [items, setItems] = useState<MarketplaceProduct[]>([])

  useEffect(() => {
    let cancelled = false
    fetchRecentlyViewed(isAuthenticated, excludeProductId, limit)
      .then(data => { if (!cancelled) setItems(data) })
      .catch(() => { if (!cancelled) setItems([]) })
    return () => { cancelled = true }
  }, [isAuthenticated, excludeProductId, limit])

  if (!items.length) return null

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-extrabold text-slate-900">
        {title ?? t('discovery.recentlyViewed')}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
