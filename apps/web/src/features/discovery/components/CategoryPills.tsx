'use client'

import Link from 'next/link'
import { useRef, useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Category } from '@/types/merchant'
import { cn } from '@/lib/utils'
import { getCategoryIcon } from '@/lib/icons'

interface CategoryPillsProps {
  categories: Category[]
  activeSlug?: string
}

export function CategoryPills({ categories, activeSlug }: CategoryPillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [categories, updateScrollState])

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: dir === 'left' ? -280 : 280,
      behavior: 'smooth',
    })
  }

  return (
    <section className="py-10 border-y border-slate-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative group/carousel">

        {/* Boutons desktop uniquement */}
        <button
          type="button"
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          aria-label="Catégories précédentes"
          className={cn(
            'hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 z-10',
            'w-10 h-10 items-center justify-center rounded-full',
            'bg-white border border-slate-200 shadow-md text-slate-600',
            'hover:bg-slate-50 hover:border-slate-300 transition-all',
            'disabled:opacity-0 disabled:pointer-events-none',
          )}
        >
          <ChevronLeft size={20} />
        </button>

        <button
          type="button"
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          aria-label="Catégories suivantes"
          className={cn(
            'hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 z-10',
            'w-10 h-10 items-center justify-center rounded-full',
            'bg-white border border-slate-200 shadow-md text-slate-600',
            'hover:bg-slate-50 hover:border-slate-300 transition-all',
            'disabled:opacity-0 disabled:pointer-events-none',
          )}
        >
          <ChevronRight size={20} />
        </button>

        {/* Dégradés latéraux desktop quand scrollable */}
        {canScrollLeft && (
          <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-14 bg-gradient-to-r from-white to-transparent z-[1] pointer-events-none" />
        )}
        {canScrollRight && (
          <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-14 bg-gradient-to-l from-white to-transparent z-[1] pointer-events-none" />
        )}

        {/* Liste horizontale — scroll tactile tablette/mobile */}
        <div
          ref={scrollRef}
          className={cn(
            'flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar',
            'scroll-smooth pb-1 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-12',
          )}
        >
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.icon, cat.slug)
            const isActive = cat.slug === activeSlug

            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className={cn(
                  'group shrink-0 flex items-center gap-2.5 px-5 py-2.5 rounded-full border font-bold text-sm sm:text-base text-slate-700 transition-all',
                  isActive
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700',
                )}
                style={{ textDecoration: 'none' }}
              >
                <Icon
                  size={17}
                  className={cn(
                    'shrink-0 transition-colors',
                    isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-700',
                  )}
                />
                {cat.name}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
