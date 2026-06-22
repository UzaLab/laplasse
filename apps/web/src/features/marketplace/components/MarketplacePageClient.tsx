'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  RotateCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  X,
} from 'lucide-react'
import { PAGE_CONTAINER } from '@/lib/pageLayout'
import {
  fetchPublicJson,
  type MarketplaceBoutique,
  type MarketplaceCatalogProduct,
  type MarketplaceSpotlightShop,
  type ProductCategoryNode,
} from '@/lib/marketplaceApi'
import { getCountryCode } from '@/lib/country'
import { NetworkErrorBanner } from '@/components/ui/NetworkErrorBanner'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useCartStore } from '@/stores/cartStore'
import { ProductCard } from './ProductCard'
import { SpotlightShopsCarousel } from './SpotlightShopsCarousel'
import { ProductRecommendations } from './ProductRecommendations'
import { RecentlyViewedProducts } from './RecentlyViewedProducts'
import { useT } from '@/providers/LocaleProvider'
import { BRAND_MARKETPLACE_INTRO } from '@/lib/brandCopy'

type SortOption = 'newest' | 'price_asc' | 'price_desc'

function flattenCategories(
  nodes: ProductCategoryNode[],
  depth = 0,
): { slug: string; name: string; depth: number }[] {
  return nodes.flatMap(node => [
    { slug: node.slug, name: node.name, depth },
    ...flattenCategories(node.children, depth + 1),
  ])
}

function MarketplaceFiltersPanel({
  search,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
  merchants,
  selectedMerchants,
  onToggleMerchant,
  priceFilter,
  onPriceFilterChange,
  priceCeiling,
  t,
}: {
  search: string
  onSearchChange: (v: string) => void
  categories: ProductCategoryNode[]
  selectedCategory: string
  onCategoryChange: (slug: string) => void
  merchants: MarketplaceBoutique[]
  selectedMerchants: Set<string>
  onToggleMerchant: (slug: string) => void
  priceFilter: number
  onPriceFilterChange: (v: number) => void
  priceCeiling: number
  t: (key: string) => string
}) {
  const flatCategories = flattenCategories(categories)

  return (
    <>
      <div className="mb-8">
        <h4 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">
          {t('marketplace.searchLabel')}
        </h4>
        <input
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={t('marketplace.searchPlaceholder')}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10"
        />
      </div>

      {flatCategories.length > 0 && (
        <>
          <div className="h-px w-full bg-slate-100 mb-8" />
          <div className="mb-8">
            <h4 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">
              {t('marketplace.categories')}
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <label className="flex items-center gap-3 cursor-pointer group">
                <button
                  type="button"
                  onClick={() => onCategoryChange('')}
                  className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${
                    !selectedCategory
                      ? 'border-brand-500 bg-brand-500'
                      : 'border-slate-200 group-hover:border-brand-400'
                  }`}
                />
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">
                  {t('marketplace.allCategories')}
                </span>
              </label>
              {flatCategories.map(cat => (
                <label key={cat.slug} className="flex items-center gap-3 cursor-pointer group">
                  <button
                    type="button"
                    onClick={() => onCategoryChange(cat.slug)}
                    className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${
                      selectedCategory === cat.slug
                        ? 'border-brand-500 bg-brand-500'
                        : 'border-slate-200 group-hover:border-brand-400'
                    }`}
                    style={{ marginLeft: cat.depth * 12 }}
                  />
                  <span
                    className="text-sm font-medium text-slate-600 group-hover:text-slate-900"
                    style={{ paddingLeft: cat.depth * 12 }}
                  >
                    {cat.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {merchants.length > 0 && (
        <>
          <div className="h-px w-full bg-slate-100 mb-8" />
          <div className="mb-8">
            <h4 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">
              {t('marketplace.shops')}
            </h4>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {merchants.map(m => {
                const checked = selectedMerchants.has(m.slug)
                return (
                  <label
                    key={m.id}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleMerchant(m.slug)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        checked
                          ? 'border-brand-500 bg-brand-500 text-white'
                          : 'border-slate-200 group-hover:border-brand-400'
                      }`}
                    >
                      {checked && <span className="text-[10px]">✓</span>}
                    </button>
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">
                      {m.business_name}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </>
      )}

      <div className="h-px w-full bg-slate-100 mb-8" />

      <div>
        <h4 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">
          {t('marketplace.maxPrice')}
        </h4>
        <div className="mb-4">
          <input
            type="range"
            min={0}
            max={priceCeiling}
            step={500}
            value={Math.min(priceFilter, priceCeiling)}
            onChange={e => onPriceFilterChange(Number(e.target.value))}
            className="w-full appearance-none bg-transparent accent-brand-500"
          />
        </div>
        <div className="flex items-center justify-between text-sm font-bold text-slate-600">
          <span>0 F</span>
          <span>
            {priceFilter >= priceCeiling
              ? 'Tout'
              : `Jusqu'à ${priceFilter.toLocaleString('fr-FR')} F`}
          </span>
        </div>
      </div>
    </>
  )
}

export function MarketplacePageClient() {
  const router = useRouter()
  const t = useT()
  const { isAuthenticated } = useAuthReady()
  const addItem = useCartStore(s => s.addItem)
  const [products, setProducts] = useState<MarketplaceCatalogProduct[]>([])
  const [merchants, setMerchants] = useState<MarketplaceBoutique[]>([])
  const [spotlight, setSpotlight] = useState<MarketplaceSpotlightShop[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState<ProductCategoryNode[]>([])
  const [selectedMerchants, setSelectedMerchants] = useState<Set<string>>(new Set())
  const [priceFilter, setPriceFilter] = useState(100_000)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const loadCatalog = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    const qs = new URLSearchParams()
    if (sort === 'price_asc') qs.set('sort', 'price_asc')
    else if (sort === 'price_desc') qs.set('sort', 'price_desc')
    if (selectedCategory) qs.set('category', selectedCategory)
    if (debouncedSearch) qs.set('q', debouncedSearch)
    const productPath = `/marketplace/products${qs.toString() ? `?${qs}` : ''}`

    const [productResult, merchantResult, spotlightResult] = await Promise.all([
      fetchPublicJson<MarketplaceCatalogProduct[]>(productPath),
      fetchPublicJson<MarketplaceBoutique[]>('/marketplace/merchants?limit=50'),
      fetchPublicJson<MarketplaceSpotlightShop[]>('/marketplace/spotlight'),
    ])

    if (!productResult.ok) {
      setLoadError(productResult.error)
      setProducts([])
      setMerchants([])
      setSpotlight([])
      setLoading(false)
      return
    }

    const list = productResult.data
    setProducts(list)
    setMerchants(merchantResult.ok ? merchantResult.data : [])
    setSpotlight(spotlightResult.ok ? spotlightResult.data : [])

    if (list.length > 0) {
      const highest = Math.max(...list.map(p => p.price))
      setPriceFilter(Math.ceil(highest / 1000) * 1000 || 100_000)
    }

    setLoading(false)
  }, [sort, selectedCategory, debouncedSearch])

  useEffect(() => {
    void fetchPublicJson<ProductCategoryNode[]>(
      `/marketplace/product-categories?country=${encodeURIComponent(getCountryCode())}`,
    ).then(result => {
      if (result.ok) setCategories(result.data)
    })
  }, [])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  const priceCeiling = useMemo(() => {
    if (products.length === 0) return 100_000
    return Math.ceil(Math.max(...products.map(p => p.price)) / 1000) * 1000 || 100_000
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => p.price <= priceFilter)
    if (selectedMerchants.size > 0) {
      list = list.filter(p => selectedMerchants.has(p.merchant.slug))
    }
    return list
  }, [products, priceFilter, selectedMerchants])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (search.trim()) count += 1
    if (selectedMerchants.size > 0) count += 1
    if (selectedCategory) count += 1
    if (priceFilter < priceCeiling) count += 1
    return count
  }, [search, selectedMerchants, selectedCategory, priceFilter, priceCeiling])

  const toggleMerchant = (slug: string) => {
    setSelectedMerchants(prev => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSelectedMerchants(new Set())
    setPriceFilter(priceCeiling)
  }

  const handleAdd = async (product: MarketplaceCatalogProduct) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent('/marketplace')}`)
      return
    }
    setAddingId(product.id)
    await addItem(product.id, 1)
    setAddingId(null)
  }

  return (
    <>
      <header className="pt-32 pb-12 bg-white border-b border-slate-100">
        <div className={PAGE_CONTAINER}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-bold uppercase tracking-widest mb-4 border border-brand-100">
                <ShoppingBag size={14} /> {t('marketplace.badge')}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                {t('marketplace.title')}
              </h1>
              <p className="text-lg text-slate-500">
                {BRAND_MARKETPLACE_INTRO}
              </p>
            </div>
          </div>

          {spotlight.length > 0 && (
            <div className="mb-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                {t('marketplace.spotlight')}
              </h3>
              <SpotlightShopsCarousel shops={spotlight} />
            </div>
          )}
        </div>
      </header>

      <main className={`${PAGE_CONTAINER} py-8 md:py-12 pb-28 lg:pb-12`}>
        <div className="space-y-10 mb-10">
          <RecentlyViewedProducts />
          <ProductRecommendations />
        </div>
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <aside className="hidden lg:block w-full lg:w-64 shrink-0 lg:sticky lg:top-28">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <SlidersHorizontal size={20} className="text-brand-500" /> {t('marketplace.filters')}
                </h3>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-bold text-slate-400 hover:text-slate-900"
                >
                  {t('marketplace.clearFilters')}
                </button>
              </div>
              <MarketplaceFiltersPanel
                search={search}
                onSearchChange={setSearch}
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                merchants={merchants}
                selectedMerchants={selectedMerchants}
                onToggleMerchant={toggleMerchant}
                priceFilter={priceFilter}
                onPriceFilterChange={setPriceFilter}
                priceCeiling={priceCeiling}
                t={t}
              />
            </div>
          </aside>

          <div className="flex-1 w-full min-w-0">
            {loadError && (
              <NetworkErrorBanner
                message={loadError}
                onRetry={() => void loadCatalog()}
                loading={loading}
                className="mb-6"
              />
            )}

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 sm:gap-4 mb-6 md:mb-8">
              <div className="flex items-center justify-between sm:justify-end gap-3 text-sm w-full sm:w-auto">
                <span className="text-slate-400 font-medium shrink-0">{t('marketplace.sortBy')}</span>
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as SortOption)}
                  className="flex-1 sm:flex-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-900 outline-none cursor-pointer focus:border-brand-400"
                >
                  <option value="newest">{t('marketplace.sortNewest')}</option>
                  <option value="price_asc">{t('marketplace.sortPriceAsc')}</option>
                  <option value="price_desc">{t('marketplace.sortPriceDesc')}</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-24">
                <Loader2 size={28} className="animate-spin text-slate-300" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-100">
                {products.length === 0 && activeFilterCount === 0 && !debouncedSearch ? (
                  <>
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Store size={28} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 mb-2">
                      {t('marketplace.emptyCatalogTitle')}
                    </h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                      {t('marketplace.emptyCatalogBody')}
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      <Link
                        href="/search"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800"
                        style={{ textDecoration: 'none' }}
                      >
                        <Search size={16} /> {t('marketplace.exploreMerchants')}
                      </Link>
                      <Link
                        href="/merchant/signup"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-full text-sm font-bold hover:bg-slate-50"
                        style={{ textDecoration: 'none' }}
                      >
                        <Store size={16} /> {t('marketplace.becomeSeller')}
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-slate-500 font-medium mb-4">
                      {t('marketplace.noFilterMatch')}
                    </p>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-50 text-brand-700 rounded-full text-sm font-bold hover:bg-brand-100 border border-brand-100"
                    >
                      <RotateCcw size={16} /> {t('marketplace.resetFilters')}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 items-stretch">
                {filtered.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="boutique"
                    showBestSeller={index === 0 && sort === 'newest'}
                    showAddButton
                    onAdd={() => handleAdd(product)}
                    adding={addingId === product.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {!filtersOpen && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="pointer-events-auto w-full flex items-center justify-center gap-2.5 bg-slate-900 text-white py-4 rounded-full text-sm font-extrabold shadow-xl shadow-slate-900/25 hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            <SlidersHorizontal size={18} />
            {t('marketplace.filters')}
            {activeFilterCount > 0 && (
              <span className="bg-brand-500 text-white text-xs font-bold min-w-[1.25rem] h-5 px-1.5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      )}

      {filtersOpen && (
        <div className="lg:hidden fixed inset-0 z-[300] flex items-end justify-center">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setFiltersOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="marketplace-filters-title"
            className="relative bg-white w-full max-h-[85vh] overflow-y-auto rounded-t-[28px] shadow-2xl border border-slate-100"
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
              <h2 id="marketplace-filters-title" className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal size={20} className="text-brand-500" /> {t('marketplace.filters')}
              </h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 pb-8">
              <MarketplaceFiltersPanel
                search={search}
                onSearchChange={setSearch}
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                merchants={merchants}
                selectedMerchants={selectedMerchants}
                onToggleMerchant={toggleMerchant}
                priceFilter={priceFilter}
                onPriceFilterChange={setPriceFilter}
                priceCeiling={priceCeiling}
                t={t}
              />

              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="w-full mt-4 py-4 bg-slate-900 text-white rounded-full text-sm font-extrabold hover:bg-slate-800 transition-colors"
              >
                Voir {filtered.length} produit{filtered.length > 1 ? 's' : ''}
              </button>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    clearFilters()
                  }}
                  className="w-full mt-3 py-3 text-slate-500 text-sm font-bold hover:text-slate-900 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
