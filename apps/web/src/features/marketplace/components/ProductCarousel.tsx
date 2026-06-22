'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from '@/features/marketplace/components/ProductCard'
import type { MarketplaceProduct } from '@/lib/marketplaceApi'
import { cn } from '@/lib/utils'
import { useT } from '@/providers/LocaleProvider'

const GAP_PX = 16
const MOBILE_VISIBLE = 2
const DESKTOP_VISIBLE = 5
const MOBILE_STEP = 2
const DESKTOP_STEP = 5
const MAX_ITEMS = 10

export type ProductCarouselCardProps = {
  showAddButton?: boolean
  onAdd?: () => void
  adding?: boolean
  showBestSeller?: boolean
  merchantSlug?: string
  merchantName?: string
}

interface ProductCarouselProps {
  products: MarketplaceProduct[]
  title: ReactNode
  headerAction?: ReactNode
  maxItems?: number
  getCardProps?: (product: MarketplaceProduct, index: number) => ProductCarouselCardProps
  className?: string
}

function useCarouselSteps() {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return {
    visible: isDesktop ? DESKTOP_VISIBLE : MOBILE_VISIBLE,
    step: isDesktop ? DESKTOP_STEP : MOBILE_STEP,
  }
}

export function ProductCarousel({
  products,
  title,
  headerAction,
  maxItems = MAX_ITEMS,
  getCardProps,
  className,
}: ProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const t = useT()
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const { visible, step } = useCarouselSteps()

  const items = products.slice(0, maxItems)
  const showNav = items.length > visible

  const updateScrollState = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateScrollState()
    const el = trackRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [items.length, updateScrollState])

  const scroll = (dir: 'left' | 'right') => {
    const el = trackRef.current
    if (!el) return
    const first = el.children[0] as HTMLElement | undefined
    const cardWidth = first?.offsetWidth ?? el.clientWidth / visible
    const amount = (cardWidth + GAP_PX) * step
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  if (!items.length) return null

  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>
        <div className="flex items-center gap-2 ml-auto">
          {headerAction}
          {showNav && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label={t('marketplace.prevProducts')}
                className={cn(
                  'w-9 h-9 flex items-center justify-center rounded-full',
                  'bg-white border border-slate-200 shadow-sm text-slate-600',
                  'hover:bg-slate-50 hover:border-slate-300 transition-all',
                  'disabled:opacity-30 disabled:pointer-events-none',
                )}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                aria-label={t('marketplace.nextProducts')}
                className={cn(
                  'w-9 h-9 flex items-center justify-center rounded-full',
                  'bg-white border border-slate-200 shadow-sm text-slate-600',
                  'hover:bg-slate-50 hover:border-slate-300 transition-all',
                  'disabled:opacity-30 disabled:pointer-events-none',
                )}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative group/carousel">
        {showNav && canScrollLeft && (
          <div className="hidden lg:block absolute left-0 top-0 bottom-2 w-10 bg-gradient-to-r from-white to-transparent z-[1] pointer-events-none" />
        )}
        {showNav && canScrollRight && (
          <div className="hidden lg:block absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-white to-transparent z-[1] pointer-events-none" />
        )}

        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-1 -mx-1 px-1"
        >
          {items.map((product, index) => {
            const cardProps = getCardProps?.(product, index) ?? {}
            return (
              <div
                key={product.id}
                className="shrink-0 snap-start w-[calc((100%-16px)/2)] lg:w-[calc((100%-64px)/5)]"
              >
                <ProductCard
                  product={product}
                  variant="boutique"
                  {...cardProps}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
