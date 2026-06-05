import Link from 'next/link'
import {
  Utensils,
  Scissors,
  ShoppingBag,
  BedDouble,
  Pill,
  Coffee,
  Wrench,
  LucideIcon,
} from 'lucide-react'
import { Category } from '@/types/merchant'

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Scissors,
  ShoppingBag,
  BedDouble,
  Pill,
  Coffee,
  Wrench,
}

interface CategoryBarProps {
  categories: Category[]
  activeSlug?: string
}

export function CategoryBar({ categories, activeSlug }: CategoryBarProps) {
  return (
    <section style={{ padding: '32px 24px 0' }}>
      <div
        className="hide-scrollbar flex gap-4 overflow-x-auto pb-4"
        style={{ margin: '0 -24px', paddingLeft: '24px', paddingRight: '24px' }}
      >
        {categories.map((cat) => {
          const Icon = ICON_MAP[cat.icon] ?? Utensils
          const isActive = cat.slug === activeSlug

          return (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group flex min-w-[76px] flex-col items-center gap-2 no-underline transition-transform active:scale-95"
            >
              <div
                className="flex h-16 w-16 items-center justify-center transition-all"
                style={{
                  borderRadius: '16px',
                  background: isActive ? 'var(--primary)' : 'var(--surface)',
                  color: isActive ? 'white' : 'var(--primary)',
                  boxShadow: isActive ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                }}
              >
                <Icon size={28} />
              </div>
              <span
                className="text-center text-xs font-medium leading-tight"
                style={{ color: 'var(--text-main)', fontSize: '13px' }}
              >
                {cat.name}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
