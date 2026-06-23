'use client'

import { ShoppingBag, ArrowRight, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchPublicJson, type FeaturedProduct } from '@/lib/marketplaceApi'
import { ProductCard } from '@/features/marketplace/components/ProductCard'
import { NetworkErrorBanner } from '@/components/ui/NetworkErrorBanner'
import { AdImpressionTracker } from '@/hooks/useAdImpression'
import { BRAND_MARKETPLACE_SECTION } from '@/lib/brandCopy'

export function MarketplaceSection() {
  const [products, setProducts] = useState<FeaturedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFeatured = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await fetchPublicJson<FeaturedProduct[]>('/marketplace/featured')
    if (result.ok) {
      setProducts(result.data)
    } else {
      setProducts([])
      setError(result.error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadFeatured()
  }, [loadFeatured])

  if (!loading && !error && products.length === 0) return null

  return (
    <section className="py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center max-w-2xl mx-auto mb-16">
          <ShoppingBag size={32} className="text-brand-500 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
            Achetez l&apos;expérience.
          </h2>
          <p className="text-slate-500 text-lg">
            {BRAND_MARKETPLACE_SECTION}
          </p>
        </div>

        {error && (
          <NetworkErrorBanner
            message={error}
            onRetry={() => void loadFeatured()}
            loading={loading}
            className="max-w-lg mx-auto mb-8"
          />
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        ) : error ? null : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map(product => (
              <AdImpressionTracker key={product.id} campaignId={product.ad_campaign_id}>
                <ProductCard product={product} adCampaignId={product.ad_campaign_id} />
              </AdImpressionTracker>
            ))}
          </div>
        )}

        {!error && (
          <div className="text-center mt-12">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 font-bold text-slate-900 border-b-2 border-slate-900 pb-1 hover:text-brand-600 hover:border-brand-600 transition-colors"
            >
              Explorer la Marketplace <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
