'use client'

import { useEffect, useMemo } from 'react'
import { BadgeCheck, Star, X } from 'lucide-react'

import { useCategories } from '@/features/discovery/hooks/useDiscovery'
import { useGeoCommunesForDefaultCity } from '@/features/discovery/hooks/useGeoCommunes'
import { cn } from '@/lib/utils'

import { FilterLiveMultiSelect } from './FilterLiveMultiSelect'

const SORT_OPTIONS = [
  { value: 'trust_score', label: 'Mieux noté' },
  { value: 'created_at', label: 'Plus récents' },
] as const

export interface SearchResultsMobileFilters {
  categories: string[]
  districts: string[]
  verified: boolean
  sort: 'trust_score' | 'created_at'
}

interface SearchResultsMobileFiltersSheetProps {
  open: boolean
  onClose: () => void
  filters: SearchResultsMobileFilters
  onChange: (filters: SearchResultsMobileFilters) => void
  defaultCity: string
}

function FilterPill({
  active,
  onClick,
  children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 px-3 py-1.5 rounded-full text-sm font-bold transition-colors border',
        active
          ? 'bg-slate-900 text-white border-slate-900'
          : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300',
      )}
    >
      {children}
    </button>
  )
}

export function SearchResultsMobileFiltersSheet({
  open,
  onClose,
  filters,
  onChange,
  defaultCity,
}: SearchResultsMobileFiltersSheetProps) {
  const { data: categories } = useCategories()
  const { data: communes = [], isLoading: communesLoading } = useGeoCommunesForDefaultCity()

  const categoryOptions = useMemo(
    () => (categories ?? []).map(cat => ({ value: cat.slug, label: cat.name })),
    [categories],
  )

  const districtOptions = useMemo(
    () => communes.map(c => ({ value: c.name, label: c.name })),
    [communes],
  )

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const hasFilters =
    filters.categories.length > 0
    || filters.districts.length > 0
    || filters.verified
    || filters.sort !== 'trust_score'

  const clearAll = () => {
    onChange({ categories: [], districts: [], verified: false, sort: 'trust_score' })
  }

  return (
    <div className="fixed inset-0 z-[70] md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        aria-label="Fermer les filtres"
        onClick={onClose}
      />

      <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] flex flex-col bg-white rounded-t-3xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-extrabold text-slate-900">Filtres</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <FilterLiveMultiSelect
            label="Catégories"
            placeholder="Toutes les catégories"
            searchPlaceholder="Rechercher une catégorie…"
            options={categoryOptions}
            selected={filters.categories}
            onChange={categories => onChange({ ...filters, categories })}
          />

          <FilterLiveMultiSelect
            label={`Zones — ${defaultCity}`}
            placeholder="Toute la ville"
            searchPlaceholder="Rechercher une zone…"
            options={districtOptions}
            selected={filters.districts}
            onChange={districts => onChange({ ...filters, districts })}
            loading={communesLoading}
            emptyMessage={communesLoading ? 'Chargement…' : 'Aucune zone trouvée'}
          />

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Star size={12} /> Options
            </p>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={() => onChange({ ...filters, verified: !filters.verified })}
                className={cn(
                  'shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border transition-colors',
                  filters.verified
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300',
                )}
              >
                <BadgeCheck size={14} /> Vérifiés uniquement
              </button>

              {SORT_OPTIONS.map(o => (
                <FilterPill
                  key={o.value}
                  active={filters.sort === o.value}
                  onClick={() => onChange({ ...filters, sort: o.value })}
                >
                  {o.label}
                </FilterPill>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="flex-1 py-3 rounded-full border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Tout effacer
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-brand-500 transition-colors"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  )
}
