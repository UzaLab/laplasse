'use client'

import { useState } from 'react'
import { ProductCard } from '@/features/marketplace/components/ProductCard'
import { AdImpressionTracker } from '@/hooks/useAdImpression'
import { useMarketplaceAddToCart } from '@/hooks/useMarketplaceAddToCart'
import type { FeaturedProduct } from '@/lib/marketplaceApi'

import { HomeMobileV2CarouselTrack } from './HomeMobileV2CarouselTrack'

interface HomeMobileV2ProductsCarouselProps {
  products: FeaturedProduct[]
}

export function HomeMobileV2ProductsCarousel({ products }: HomeMobileV2ProductsCarouselProps) {
  const { addToCart } = useMarketplaceAddToCart()
  const [addingId, setAddingId] = useState<string | null>(null)

  const handleAdd = async (product: FeaturedProduct) => {
    setAddingId(product.id)
    await addToCart(product.id, 1, { openDrawer: true })
    setAddingId(null)
  }

  return (
    <HomeMobileV2CarouselTrack className="pb-4">
      {products.map((product, index) => (
        <AdImpressionTracker key={product.id} campaignId={product.ad_campaign_id}>
          <div className="min-w-[168px] w-[168px] shrink-0 snap-start">
            <ProductCard
              product={product}
              compact
              showAddButton
              showBestSeller={index === 0}
              adCampaignId={product.ad_campaign_id}
              adding={addingId === product.id}
              onAdd={() => void handleAdd(product)}
            />
          </div>
        </AdImpressionTracker>
      ))}
    </HomeMobileV2CarouselTrack>
  )
}
