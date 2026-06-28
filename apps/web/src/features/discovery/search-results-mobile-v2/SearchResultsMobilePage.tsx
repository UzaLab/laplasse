'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Loader2, Search, SlidersHorizontal, TrendingUp } from 'lucide-react'

import { SearchBar } from '@/features/discovery/components/SearchBar'
import { usePaginatedUnifiedSearch, useSearch } from '@/features/discovery/hooks/useDiscovery'
import type { SearchHit } from '@/features/discovery/components/SearchResultCard'
import type { ProductSearchHit } from '@/features/discovery/components/ProductSearchResultCard'
import { HomeMobileHeader } from '@/features/discovery/home-mobile-v2/HomeMobileHeader'
import { HOME_MOBILE_GUTTER } from '@/features/discovery/home-mobile-v2/homeMobileLayout'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { popularInCityLabel } from '@/lib/brandCopy'
import { cn } from '@/lib/utils'
import { MOBILE_BOTTOM_NAV_PAD, MOBILE_COMPACT_HEADER_PAD_LOOSE } from '@/lib/mobilePublicChrome'

import { SearchResultsMobileFiltersSheet, type SearchResultsMobileFilters } from './SearchResultsMobileFiltersSheet'
import { SearchResultsMobileMerchantCard } from './SearchResultsMobileMerchantCard'
import { SearchResultsMobileProductCard } from './SearchResultsMobileProductCard'

type ResultTab = 'merchants' | 'products'

const GRID_CLASS = 'grid grid-cols-2 gap-3'

function getMerchantCategorySlug(m: SearchHit): string | undefined {
  return m.category?.slug ?? m.category_slug
}

function getMerchantDistrict(m: SearchHit): string | undefined {
  return m.location?.district ?? m.district ?? undefined
}

function applyMerchantFilters(merchants: SearchHit[], filters: SearchResultsMobileFilters) {
  let list = merchants
  if (filters.categories.length > 0) {
    list = list.filter(m => {
      const slug = getMerchantCategorySlug(m)
      return slug != null && filters.categories.includes(slug)
    })
  }
  if (filters.districts.length > 0) {
    list = list.filter(m => {
      const district = getMerchantDistrict(m)
      return district != null && filters.districts.includes(district)
    })
  }
  return list
}

function applyProductFilters(products: ProductSearchHit[], filters: SearchResultsMobileFilters) {
  if (filters.categories.length === 0) return products
  return products.filter(p => {
    const slug = p.category?.slug
    return slug != null && filters.categories.includes(slug)
  })
}

function parseTab(value: string | null): ResultTab {
  return value === 'products' ? 'products' : 'merchants'
}

function TabBadge({ count, active }: { count: number; active: boolean }) {
  return (
    <span
      className={cn(
        'ml-1.5 min-w-[1.375rem] px-1.5 py-0.5 rounded-full text-[11px] font-bold tabular-nums',
        active
          ? 'bg-brand-100 text-brand-700'
          : 'bg-slate-100 text-slate-500',
      )}
    >
      {count}
    </span>
  )
}

export interface SearchResultsMobilePageProps {
  defaultCity: string
  /** Chemin de base pour la navigation */
  basePath?: string
}

export function SearchResultsMobilePage({
  defaultCity,
  basePath = '/search',
}: SearchResultsMobilePageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [activeTab, setActiveTab] = useState<ResultTab>(parseTab(searchParams.get('tab')))
  const [filtersOpen, setFiltersOpen] = useState(searchParams.get('filters') === '1')
  const [filters, setFilters] = useState<SearchResultsMobileFilters>(() => {
    const categoryParam = searchParams.get('category')
    return {
      categories: categoryParam ? categoryParam.split(',').filter(Boolean) : [],
      districts: [],
      verified: false,
      sort: 'trust_score',
    }
  })

  const debouncedQuery = useDebounce(query, 350)

  const searchParamsBase = useMemo(() => ({
    q: debouncedQuery || undefined,
    category: filters.categories.length === 1 ? filters.categories[0] : undefined,
    city: defaultCity,
    district: filters.districts.length === 1 ? filters.districts[0] : undefined,
    verified: filters.verified || undefined,
    sort: filters.sort,
    type: 'all' as const,
  }), [debouncedQuery, filters, defaultCity])

  const {
    merchants,
    products,
    merchantTotal,
    productTotal,
    hasMoreMerchants,
    hasMoreProducts,
    isLoading,
    isFetching,
    loadingMore,
    loadMoreMerchants,
    loadMoreProducts,
    isError,
  } = usePaginatedUnifiedSearch(searchParamsBase, true)

  const filteredMerchants = useMemo(
    () => applyMerchantFilters(merchants, filters),
    [merchants, filters],
  )

  const filteredProducts = useMemo(
    () => applyProductFilters(products, filters),
    [products, filters],
  )

  const multiFilterActive = filters.categories.length > 1 || filters.districts.length > 1
  const displayMerchantTotal = multiFilterActive ? filteredMerchants.length : merchantTotal
  const displayProductTotal = filters.categories.length > 1 ? filteredProducts.length : productTotal

  const activeTotal = activeTab === 'merchants' ? displayMerchantTotal : displayProductTotal
  const hasActiveResults = activeTab === 'merchants'
    ? filteredMerchants.length > 0
    : filteredProducts.length > 0
  const noResults = !isLoading && !isFetching && !hasActiveResults && !isError
  const hasFilters =
    filters.categories.length > 0
    || filters.districts.length > 0
    || filters.verified
    || filters.sort !== 'trust_score'

  const { data: trendingResult } = useSearch({
    city: defaultCity,
    sort: 'trust_score',
    limit: 6,
  }, noResults && activeTab === 'merchants')
  const trending = (trendingResult?.data ?? []) as SearchHit[]

  const syncUrl = useCallback((
    next: {
      q?: string
      tab?: ResultTab
      categories?: string[]
      filtersOpen?: boolean
    },
  ) => {
    const qs = new URLSearchParams()
    const q = next.q ?? debouncedQuery
    const tab = next.tab ?? activeTab
    const categories = next.categories ?? filters.categories
    const openFilters = next.filtersOpen ?? filtersOpen

    if (q.trim()) qs.set('q', q.trim())
    if (tab === 'products') qs.set('tab', 'products')
    if (categories.length > 0) qs.set('category', categories.join(','))
    if (openFilters) qs.set('filters', '1')

    const queryString = qs.toString()
    router.replace(queryString ? `${basePath}?${queryString}` : basePath, { scroll: false })
  }, [activeTab, basePath, debouncedQuery, filters.categories, filtersOpen, router])

  useEffect(() => {
    syncUrl({ q: debouncedQuery, tab: activeTab, categories: filters.categories, filtersOpen })
  }, [debouncedQuery, activeTab, filters.categories, filtersOpen, syncUrl])

  const handleTabChange = (tab: ResultTab) => {
    setActiveTab(tab)
  }

  const resultsLabel = debouncedQuery
    ? `${activeTotal} résultat${activeTotal > 1 ? 's' : ''} pour « ${debouncedQuery} »`
    : `${activeTotal} résultat${activeTotal > 1 ? 's' : ''}`

  return (
    <div className="min-h-dvh flex flex-col bg-[#FAFAFA] text-slate-900 antialiased overflow-x-hidden">
      <HomeMobileHeader />

      <main className={cn('flex-1 overflow-y-auto no-scrollbar', MOBILE_COMPACT_HEADER_PAD_LOOSE, MOBILE_BOTTOM_NAV_PAD, HOME_MOBILE_GUTTER)}>
        <section className="space-y-4 mb-6">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Établissements, produits, services…"
            autoFocus={!!searchParams.get('q')}
            className="rounded-xl py-3.5 border border-slate-200/80 shadow-sm focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/20"
          />

          <div className="flex border-b border-slate-200/80">
            <button
              type="button"
              onClick={() => handleTabChange('merchants')}
              className={cn(
                'flex-1 pb-2.5 border-b-2 text-sm font-bold tracking-wide transition-colors flex items-center justify-center',
                activeTab === 'merchants'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800',
              )}
            >
              Établissements
              <TabBadge count={displayMerchantTotal} active={activeTab === 'merchants'} />
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('products')}
              className={cn(
                'flex-1 pb-2.5 border-b-2 text-sm font-bold tracking-wide transition-colors flex items-center justify-center',
                activeTab === 'products'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800',
              )}
            >
              Produits
              <TabBadge count={displayProductTotal} active={activeTab === 'products'} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500 font-medium truncate">
              {(isLoading || isFetching) && !hasActiveResults ? (
                <span className="animate-pulse">Recherche en cours…</span>
              ) : (
                resultsLabel
              )}
            </p>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className={cn(
                'shrink-0 flex items-center gap-1.5 text-sm font-bold transition-colors',
                hasFilters || filtersOpen
                  ? 'text-brand-600'
                  : 'text-slate-500 hover:text-brand-600',
              )}
            >
              <SlidersHorizontal size={16} />
              Filtres
              {hasFilters && (
                <span className="w-2 h-2 rounded-full bg-brand-500" />
              )}
            </button>
          </div>
        </section>

        {isError && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Le moteur de recherche est momentanément indisponible. Réessayez dans quelques instants.
          </div>
        )}

        {(isLoading || isFetching) && !hasActiveResults && (
          <div className={GRID_CLASS}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-52 animate-pulse border border-slate-100" />
            ))}
          </div>
        )}

        {activeTab === 'merchants' && hasActiveResults && (
          <section className={GRID_CLASS}>
            {filteredMerchants.map(m => (
              <SearchResultsMobileMerchantCard key={m.id} merchant={m} compact />
            ))}
            {hasMoreMerchants && !multiFilterActive && (
              <div className="col-span-2 flex justify-center pt-2">
                <button
                  type="button"
                  onClick={loadMoreMerchants}
                  disabled={loadingMore === 'merchants'}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-brand-300 hover:text-brand-600 transition-colors disabled:opacity-60"
                >
                  {loadingMore === 'merchants' && <Loader2 size={16} className="animate-spin" />}
                  Voir plus d&apos;établissements
                </button>
              </div>
            )}
          </section>
        )}

        {activeTab === 'products' && hasActiveResults && (
          <section className={GRID_CLASS}>
            {filteredProducts.map(p => (
              <SearchResultsMobileProductCard key={p.id} product={p} variant="compact" />
            ))}
            {hasMoreProducts && filters.categories.length <= 1 && (
              <div className="col-span-2 flex justify-center pt-2">
                <button
                  type="button"
                  onClick={loadMoreProducts}
                  disabled={loadingMore === 'products'}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-brand-300 hover:text-brand-600 transition-colors disabled:opacity-60"
                >
                  {loadingMore === 'products' && <Loader2 size={16} className="animate-spin" />}
                  Voir plus de produits
                </button>
              </div>
            )}
          </section>
        )}

        {noResults && (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
              <Search size={28} className="text-slate-400" strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">Aucun résultat</h3>
            <p className="text-slate-500 text-sm max-w-xs">
              {debouncedQuery
                ? `Rien ne correspond à « ${debouncedQuery} »${filters.districts.length ? ` (${filters.districts.join(', ')})` : ''}.`
                : 'Essayez une autre recherche ou modifiez vos filtres.'}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => setFilters({ categories: [], districts: [], verified: false, sort: 'trust_score' })}
                className="mt-4 text-sm font-bold text-brand-600 hover:text-brand-700 underline"
              >
                Supprimer tous les filtres
              </button>
            )}
          </div>
        )}

        {activeTab === 'merchants' && filteredProducts.length > 0 && debouncedQuery && (
          <section className="mt-10 border-t border-slate-200/80 pt-8">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  Populaires en Produits
                </h2>
                <p className="text-sm text-slate-500">
                  Articles liés à « {debouncedQuery} »
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('products')}
                className="text-brand-600 text-sm font-bold hover:text-brand-700 transition-colors flex items-center shrink-0 ml-3"
              >
                Tout voir
                <ArrowRight size={14} className="ml-0.5" />
              </button>
            </div>

            <div className={GRID_CLASS}>
              {filteredProducts.slice(0, 2).map(p => (
                <SearchResultsMobileProductCard key={p.id} product={p} variant="compact" />
              ))}
            </div>
          </section>
        )}

        {noResults && trending.length > 0 && activeTab === 'merchants' && (
          <section className="mt-10 border-t border-slate-200/80 pt-8">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={16} className="text-brand-500" />
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                {popularInCityLabel(defaultCity)}
              </h2>
            </div>
            <div className={GRID_CLASS}>
              {trending.map(m => (
                <SearchResultsMobileMerchantCard key={m.id} merchant={m} compact />
              ))}
            </div>
          </section>
        )}
      </main>

      <SearchResultsMobileFiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        defaultCity={defaultCity}
      />
    </div>
  )
}
