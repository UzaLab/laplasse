'use client'

import { useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { BadgeCheck, SlidersHorizontal, X, TrendingUp, MapPin, Star, Search, Store, ShoppingBag, Loader2 } from 'lucide-react'

import { Navbar } from '@/components/layout/Navbar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { SearchBar } from '@/features/discovery/components/SearchBar'
import { SearchResultCard, type SearchHit } from '@/features/discovery/components/SearchResultCard'
import { ProductSearchResultCard } from '@/features/discovery/components/ProductSearchResultCard'
import { useCategories, useSearch, usePaginatedUnifiedSearch } from '@/features/discovery/hooks/useDiscovery'
import { useGeoCommunesForDefaultCity } from '@/features/discovery/hooks/useGeoCommunes'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { getDefaultCity, getCountryCode } from '@/lib/country'
import { allCityLabel, popularInCityLabel } from '@/lib/brandCopy'

type ResultTab = 'all' | 'merchants' | 'products'

const SORT_OPTIONS = [
  { value: 'trust_score', label: 'Mieux noté' },
  { value: 'created_at', label: 'Plus récents' },
]

const RESULT_TABS: { value: ResultTab; label: string; icon: typeof Store }[] = [
  { value: 'all', label: 'Tout', icon: Search },
  { value: 'merchants', label: 'Établissements', icon: Store },
  { value: 'products', label: 'Produits', icon: ShoppingBag },
]

function FilterPill({
  active,
  onClick,
  children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-xl text-sm font-bold transition-colors border ${
        active
          ? 'bg-slate-900 text-white border-slate-900'
          : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
      }`}
    >
      {children}
    </button>
  )
}

function parseResultTab(value: string | null): ResultTab {
  if (value === 'merchants' || value === 'products') return value
  return 'all'
}

function LoadMoreButton({
  onClick,
  loading,
  label,
}: {
  onClick: () => void
  loading: boolean
  label: string
}) {
  return (
    <div className="flex justify-center pt-6">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-brand-300 hover:text-brand-600 transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        {label}
      </button>
    </div>
  )
}

function SearchContent() {
  const searchParams = useSearchParams()
  const defaultCity = getDefaultCity(getCountryCode())

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') ?? '')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [verified, setVerified] = useState(false)
  const [sort, setSort] = useState<'trust_score' | 'created_at'>('trust_score')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [resultTab, setResultTab] = useState<ResultTab>(
    parseResultTab(searchParams.get('type')),
  )

  const debouncedQuery = useDebounce(query, 350)
  const { data: categories } = useCategories()
  const { data: communes = [], isLoading: communesLoading } = useGeoCommunesForDefaultCity()

  const searchParamsBase = {
    q: debouncedQuery || undefined,
    category: selectedCategory || undefined,
    city: defaultCity,
    district: selectedDistrict || undefined,
    verified: verified || undefined,
    sort,
    type: resultTab,
  }

  const {
    merchants,
    products,
    hasMoreMerchants,
    hasMoreProducts,
    isLoading,
    isFetching,
    loadingMore,
    loadMoreMerchants,
    loadMoreProducts,
    isError,
  } = usePaginatedUnifiedSearch(searchParamsBase, true)

  const hasMerchants = merchants.length > 0
  const hasProducts = products.length > 0
  const hasResults =
    resultTab === 'merchants'
      ? hasMerchants
      : resultTab === 'products'
        ? hasProducts
        : hasMerchants || hasProducts

  const noResults = !isLoading && !isFetching && !hasResults && !isError

  const { data: trendingResult } = useSearch({
    city: defaultCity, sort: 'trust_score', limit: 8,
  }, noResults && resultTab !== 'products')
  const trending = (trendingResult?.data ?? []) as SearchHit[]

  const clearAll = useCallback(() => {
    setSelectedCategory('')
    setSelectedDistrict('')
    setVerified(false)
    setSort('trust_score')
  }, [])

  const hasFilters = !!selectedCategory || !!selectedDistrict || verified || sort !== 'trust_score'

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />

      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-2.5">

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Établissements, produits, services…"
                autoFocus
              />
            </div>
            <button
              onClick={() => setShowAdvanced(v => !v)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-sm font-bold rounded-xl border transition-colors ${
                showAdvanced || hasFilters
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              <SlidersHorizontal size={15} />
              <span className="hidden sm:inline">Filtres</span>
              {hasFilters && <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />}
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {RESULT_TABS.map(tab => {
              const Icon = tab.icon
              return (
                <FilterPill
                  key={tab.value}
                  active={resultTab === tab.value}
                  onClick={() => setResultTab(tab.value)}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Icon size={13} />
                    {tab.label}
                  </span>
                </FilterPill>
              )
            })}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            <FilterPill active={!selectedCategory} onClick={() => setSelectedCategory('')}>
              Toutes catégories
            </FilterPill>
            {categories?.map(cat => (
              <FilterPill
                key={cat.id}
                active={selectedCategory === cat.slug}
                onClick={() => setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)}
              >
                {cat.name}
              </FilterPill>
            ))}
          </div>

          {showAdvanced && (
            <div className="pb-2 space-y-2.5 border-t border-slate-100 pt-2.5">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <MapPin size={11} /> Zone
                </span>
                <FilterPill active={!selectedDistrict} onClick={() => setSelectedDistrict('')}>
                  {allCityLabel(defaultCity)}
                </FilterPill>
                {communesLoading && (
                  <span className="text-xs text-slate-400 font-medium px-2">Chargement…</span>
                )}
                {communes.map(c => (
                  <FilterPill
                    key={c.id}
                    active={selectedDistrict === c.name}
                    onClick={() => setSelectedDistrict(selectedDistrict === c.name ? '' : c.name)}
                  >
                    {c.name}
                  </FilterPill>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setVerified(v => !v)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border transition-colors ${
                    verified
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <BadgeCheck size={14} /> Vérifiés uniquement
                </button>

                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-0.5">
                  <Star size={13} className="text-slate-400 shrink-0" />
                  {SORT_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      onClick={() => setSort(o.value as 'trust_score' | 'created_at')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                        sort === o.value
                          ? 'bg-white text-slate-900 border border-slate-200'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>

                {hasFilters && (
                  <button
                    onClick={clearAll}
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <X size={12} /> Tout effacer
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7 pb-24 md:pb-10">

        {(isLoading || isFetching) && !hasResults && debouncedQuery && (
          <p className="text-sm text-slate-500 font-medium mb-5 animate-pulse">
            Recherche en cours…
          </p>
        )}

        {isError && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Le moteur de recherche est momentanément indisponible. Réessayez dans quelques instants.
          </div>
        )}

        {(isLoading || isFetching) && !hasResults && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl h-72 animate-pulse border border-slate-100" />
            ))}
          </div>
        )}

        {!isLoading && hasResults && (
          <div className="space-y-10">
            {(resultTab === 'all' || resultTab === 'merchants') && hasMerchants && (
              <section>
                {resultTab === 'all' && (
                  <div className="flex items-center gap-2 mb-5">
                    <Store size={16} className="text-brand-500" />
                    <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                      Établissements
                    </h2>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {merchants.map(m => <SearchResultCard key={m.id} merchant={m} />)}
                </div>
                {hasMoreMerchants && (
                  <LoadMoreButton
                    onClick={loadMoreMerchants}
                    loading={loadingMore === 'merchants'}
                    label="Voir plus d'établissements"
                  />
                )}
              </section>
            )}

            {(resultTab === 'all' || resultTab === 'products') && hasProducts && (
              <section>
                {resultTab === 'all' && (
                  <div className="flex items-center gap-2 mb-5">
                    <ShoppingBag size={16} className="text-brand-500" />
                    <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                      Produits
                    </h2>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                  {products.map(p => <ProductSearchResultCard key={p.id} product={p} />)}
                </div>
                {hasMoreProducts && (
                  <LoadMoreButton
                    onClick={loadMoreProducts}
                    loading={loadingMore === 'products'}
                    label="Voir plus de produits"
                  />
                )}
              </section>
            )}
          </div>
        )}

        {noResults && (
          <div>
            <div className="flex flex-col items-center py-12 text-center mb-10">
              <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
                <Search size={28} className="text-slate-400" strokeWidth={1.75} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-1">Aucun résultat</h3>
              <p className="text-slate-500 text-sm max-w-xs">
                {debouncedQuery
                  ? `Rien ne correspond à "${debouncedQuery}"${selectedDistrict ? ` à ${selectedDistrict}` : ''}.`
                  : 'Essayez de modifier vos filtres ou votre recherche.'}
              </p>
              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="mt-4 text-sm font-bold text-brand-600 hover:text-brand-700 underline"
                >
                  Supprimer tous les filtres
                </button>
              )}
              {resultTab === 'products' && debouncedQuery && (
                <button
                  onClick={() => setResultTab('all')}
                  className="mt-3 text-sm font-bold text-slate-600 hover:text-slate-900 underline"
                >
                  Élargir à tous les types
                </button>
              )}
            </div>

            {trending.length > 0 && resultTab !== 'products' && (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp size={16} className="text-brand-500" />
                  <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    {popularInCityLabel(defaultCity)}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {trending.map(m => <SearchResultCard key={m.id} merchant={m} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">Chargement…</div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
