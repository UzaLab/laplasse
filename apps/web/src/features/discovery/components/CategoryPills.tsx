import Link from 'next/link'
import {
  UtensilsCrossed, Wine, Gem, Sparkles, Coffee, BedDouble, Pill,
  type LucideIcon,
} from 'lucide-react'
import { Category } from '@/types/merchant'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed, Wine, Gem, Sparkles, Coffee, BedDouble, Pill,
}

interface CategoryPillsProps {
  categories: Category[]
  activeSlug?: string
}

export function CategoryPills({ categories, activeSlug }: CategoryPillsProps) {
  return (
    <section className="py-12 border-y border-slate-100 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap justify-center gap-4 lg:gap-8">
          {categories.map((cat) => {
            const Icon = ICON_MAP[cat.icon] ?? UtensilsCrossed
            const isActive = cat.slug === activeSlug

            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className={cn(
                  'group flex items-center gap-3 px-6 py-3 rounded-full border font-bold text-slate-700 transition-all',
                  isActive
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700',
                )}
              >
                <Icon
                  size={18}
                  className={cn(
                    'transition-colors',
                    isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-brand-600',
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
