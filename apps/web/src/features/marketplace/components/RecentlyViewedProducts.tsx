'use client'

import { useEffect, useState } from 'react'
import { ProductCarousel } from '@/features/marketplace/components/ProductCarousel'
import { fetchRecentlyViewed } from '@/lib/discoveryApi'
import type { MarketplaceProduct } from '@/lib/marketplaceApi'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useT } from '@/providers/LocaleProvider'

const CAROUSEL_LIMIT = 10

export function RecentlyViewedProducts({
  excludeProductId,
  title,
  limit = CAROUSEL_LIMIT,
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
    fetchRecentlyViewed(isAuthenticated, excludeProductId, Math.min(limit, CAROUSEL_LIMIT))
      .then(data => { if (!cancelled) setItems(data) })
      .catch(() => { if (!cancelled) setItems([]) })
    return () => { cancelled = true }
  }, [isAuthenticated, excludeProductId, limit])

  return (
    <ProductCarousel
      products={items}
      title={title ?? t('discovery.recentlyViewed')}
      maxItems={CAROUSEL_LIMIT}
    />
  )
}
