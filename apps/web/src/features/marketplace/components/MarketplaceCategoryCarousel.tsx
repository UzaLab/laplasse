'use client'

import { getCategoryIcon } from '@/lib/icons'
import type { ProductCategoryNode } from '@/lib/marketplaceApi'
import { cn } from '@/lib/utils'

interface MarketplaceCategoryCarouselProps {
  categories: ProductCategoryNode[]
  selectedSlug: string
  onSelect: (slug: string) => void
  allLabel: string
  className?: string
}

export function MarketplaceCategoryCarousel({
  categories,
  selectedSlug,
  onSelect,
  allLabel,
  className,
}: MarketplaceCategoryCarouselProps) {
  if (categories.length === 0) return null

  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-0.5 -mx-6 px-6 scroll-pl-6',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onSelect('')}
        className={cn(
          'shrink-0 snap-start px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap flex items-center gap-2 transition-colors border',
          !selectedSlug
            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
            : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300',
        )}
      >
        {allLabel}
      </button>
      {categories.map(cat => {
        const Icon = getCategoryIcon(cat.icon, cat.slug)
        const active = selectedSlug === cat.slug
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(active ? '' : cat.slug)}
            className={cn(
              'shrink-0 snap-start px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap flex items-center gap-2 transition-colors border',
              active
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300',
            )}
          >
            <Icon size={15} className={active ? 'text-white' : 'text-brand-700'} />
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}
