'use client'

import { Search } from 'lucide-react'

import { cn } from '@/lib/utils'

interface MarketplaceFilterListSectionProps {
  title: string
  searchPlaceholder: string
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  emptyMessage?: string
  children: React.ReactNode
}

export function MarketplaceFilterListSection({
  title,
  searchPlaceholder,
  searchQuery,
  onSearchQueryChange,
  emptyMessage = 'Aucun résultat',
  children,
}: MarketplaceFilterListSectionProps) {
  return (
    <div className="mb-8">
      <h4 className="font-bold text-slate-900 text-sm mb-3 uppercase tracking-wider">
        {title}
      </h4>
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="search"
          value={searchQuery}
          onChange={e => onSearchQueryChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm font-medium outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10"
        />
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-2">
        {children ?? (
          <p className={cn('text-sm text-slate-400 font-medium px-2 py-3 text-center')}>
            {emptyMessage}
          </p>
        )}
      </div>
    </div>
  )
}
