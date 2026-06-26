'use client'

import { Search, X } from 'lucide-react'

export function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
        active
          ? 'bg-slate-900 text-white border-slate-900'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  )
}

interface MerchantListToolbarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  resultCount?: number
  totalCount?: number
  onReset?: () => void
  showReset?: boolean
  children?: React.ReactNode
}

export function MerchantListToolbar({
  value,
  onChange,
  placeholder = 'Rechercher…',
  resultCount,
  totalCount,
  onReset,
  showReset,
  children,
}: MerchantListToolbarProps) {
  const hasQuery = value.trim().length > 0
  const showResultHint =
    hasQuery && resultCount !== undefined && totalCount !== undefined && totalCount > 0

  return (
    <div className="space-y-3 mb-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            aria-hidden
          />
          <input
            type="search"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-2.5 rounded-full border-2 border-slate-200 bg-white text-sm font-medium text-slate-900 outline-none focus:border-amber-400 placeholder:text-slate-400"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Effacer la recherche"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {showReset && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="shrink-0 px-4 py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {children ? (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      ) : null}

      {showResultHint && (
        <p className="text-xs font-medium text-slate-500">
          {resultCount} résultat{resultCount !== 1 ? 's' : ''} sur {totalCount}
        </p>
      )}
    </div>
  )
}
