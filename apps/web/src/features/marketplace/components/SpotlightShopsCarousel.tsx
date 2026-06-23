'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Sparkles, Store } from 'lucide-react'
import type { MarketplaceSpotlightShop } from '@/lib/marketplaceApi'
import { recordAdEvent } from '@/lib/adsApi'
import { AdImpressionTracker } from '@/hooks/useAdImpression'

interface SpotlightShopsCarouselProps {
  shops: MarketplaceSpotlightShop[]
}

export function SpotlightShopsCarousel({ shops }: SpotlightShopsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    const el = trackRef.current
    if (!el) return
    const amount = Math.max(el.clientWidth * 0.75, 240)
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  if (shops.length === 0) return null

  return (
    <div className="relative group/carousel">
      {shops.length > 4 && (
        <>
          <button
            type="button"
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-lg items-center justify-center text-slate-600 hover:text-slate-900 hover:border-brand-300 transition-all opacity-0 group-hover/carousel:opacity-100"
            aria-label="Précédent"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-lg items-center justify-center text-slate-600 hover:text-slate-900 hover:border-brand-300 transition-all opacity-0 group-hover/carousel:opacity-100"
            aria-label="Suivant"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 -mx-1 px-1 scroll-smooth"
      >
        {shops.map(shop => (
          <AdImpressionTracker key={shop.id} campaignId={shop.ad_campaign_id}>
            <Link
              href={`/m/${shop.slug}/boutique`}
              onClick={() => {
                if (shop.ad_campaign_id) recordAdEvent(shop.ad_campaign_id, 'click')
              }}
              className="flex flex-col items-center gap-2.5 min-w-[88px] sm:min-w-[100px] max-w-[100px] snap-start group shrink-0"
              style={{ textDecoration: 'none' }}
            >
            <div className="relative w-[72px] h-[72px] sm:w-20 sm:h-20">
              <div className="w-full h-full rounded-2xl bg-white border-2 border-slate-100 p-1 group-hover:border-brand-400 group-hover:shadow-lg transition-all">
                <div className="w-full h-full rounded-xl overflow-hidden bg-slate-50">
                  {shop.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shop.logo} alt={shop.business_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Store size={24} />
                    </div>
                  )}
                </div>
              </div>
              {shop.is_sponsored && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-sm border-2 border-white">
                  <Sparkles size={10} />
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-slate-700 group-hover:text-brand-600 text-center line-clamp-2 leading-tight w-full">
              {shop.business_name}
            </span>
            </Link>
          </AdImpressionTracker>
        ))}
      </div>
    </div>
  )
}
