'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Loader2,
  RotateCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  X,
} from 'lucide-react'
import { SearchAutocomplete } from '@/features/discovery/components/SearchAutocomplete'
import { HOME_MOBILE_GUTTER, HOME_MOBILE_TRACK } from '@/features/discovery/home-mobile-v2/homeMobileLayout'
import { PAGE_CONTAINER } from '@/lib/pageLayout'
import { cn } from '@/lib/utils'
import { useScrollFabVisibility } from '@/hooks/useScrollFabVisibility'
import {
  fetchPublicJson,
  type MarketplaceBoutique,
  type MarketplaceCatalogProduct,
  type MarketplaceSpotlightShop,
  type ProductCategoryNode,
  PRODUCT_CONDITION_LABELS,
  PRODUCT_ORIGIN_LABELS,
  type ProductCondition,
  type ProductOrigin,
} from '@/lib/marketplaceApi'
import { getCountryCode } from '@/lib/country'
import {
  marketplaceProductHref,
  marketplaceQuickAddOptions,
  shouldRedirectToProductPage,
} from '@/lib/marketplaceQuickAdd'
import { NetworkErrorBanner } from '@/components/ui/NetworkErrorBanner'
import { useMarketplaceAddToCart } from '@/hooks/useMarketplaceAddToCart'
import { MarketplaceCategoryCarousel } from './MarketplaceCategoryCarousel'
import { MarketplaceFilterListSection } from './MarketplaceFilterListSection'
import { ProductCard } from './ProductCard'
import { SpotlightShopsCarousel } from './SpotlightShopsCarousel'
import { ProductRecommendations } from './ProductRecommendations'
import { RecentlyViewedProducts } from './RecentlyViewedProducts'
import { useT } from '@/providers/LocaleProvider'
import { BRAND_MARKETPLACE_INTRO } from '@/lib/brandCopy'

type SortOption = 'newest' | 'price_asc' | 'price_desc'

const PAGE_SIZE = 24

interface MarketplaceCatalogPage {
  data: MarketplaceCatalogProduct[]
  meta: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

function flattenCategories(
  nodes: ProductCategoryNode[],
  depth = 0,
): { slug: string; name: string; depth: number }[] {
  return nodes.flatMap(node => [
    { slug: node.slug, name: node.name, depth },
    ...flattenCategories(node.children, depth + 1),
  ])
}

const SORT_OPTIONS: { value: SortOption; labelKey: string }[] = [
  { value: 'newest', labelKey: 'marketplace.sortNewest' },
  { value: 'price_asc', labelKey: 'marketplace.sortPriceAsc' },
  { value: 'price_desc', labelKey: 'marketplace.sortPriceDesc' },
]

function FilterRadioGroup<T extends string>({
  title,
  options,
  selected,
  onSelect,
  allLabel = 'Tous',
}: {
  title: string
  options: { value: T; label: string }[]
  selected: T | ''
  onSelect: (v: T | '') => void
  allLabel?: string
}) {
  return (
    <div className="mb-8">
      <h4 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">{title}</h4>
      <div className="space-y-1">
        <label className="flex items-center gap-3 cursor-pointer group px-1 py-1 rounded-lg hover:bg-white">
          <button
            type="button"
            onClick={() => onSelect('')}
            className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${
              !selected ? 'border-brand-500 bg-brand-500' : 'border-slate-200 group-hover:border-brand-400'
            }`}
          />
          <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{allLabel}</span>
        </label>
        {options.map(opt => (
          <label key={opt.value} className="flex items-center gap-3 cursor-pointer group px-1 py-1 rounded-lg hover:bg-white">
            <button
              type="button"
              onClick={() => onSelect(opt.value)}
              className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${
                selected === opt.value ? 'border-brand-500 bg-brand-500' : 'border-slate-200 group-hover:border-brand-400'
              }`}
            />
            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

const CONDITION_OPTIONS = (Object.keys(PRODUCT_CONDITION_LABELS) as ProductCondition[]).map(k => ({
  value: k,
  label: PRODUCT_CONDITION_LABELS[k],
}))

const ORIGIN_OPTIONS = (Object.keys(PRODUCT_ORIGIN_LABELS) as ProductOrigin[]).map(k => ({
  value: k,
  label: PRODUCT_ORIGIN_LABELS[k],
}))

function MarketplaceFiltersPanel({
  search,
  onSearchChange,
  showSearch = true,
  showSort = false,
  sort,
  onSortChange,
  categories,
  selectedCategory,
  onCategoryChange,
  selectedCondition,
  onConditionChange,
  selectedOrigin,
  onOriginChange,
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
  showSearch?: boolean
  showSort?: boolean
  sort?: SortOption
  onSortChange?: (v: SortOption) => void
  categories: ProductCategoryNode[]
  selectedCategory: string
  onCategoryChange: (slug: string) => void
  selectedCondition: ProductCondition | ''
  onConditionChange: (v: ProductCondition | '') => void
  selectedOrigin: ProductOrigin | ''
  onOriginChange: (v: ProductOrigin | '') => void
  merchants: MarketplaceBoutique[]
  selectedMerchants: Set<string>
  onToggleMerchant: (slug: string) => void
  priceFilter: number
  onPriceFilterChange: (v: number) => void
  priceCeiling: number
  t: (key: string) => string
}) {
  const flatCategories = flattenCategories(categories)
  const [categoryQuery, setCategoryQuery] = useState('')
  const [merchantQuery, setMerchantQuery] = useState('')

  const filteredCategories = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase()
    if (!q) return flatCategories
    return flatCategories.filter(cat => cat.name.toLowerCase().includes(q))
  }, [flatCategories, categoryQuery])

  const filteredMerchants = useMemo(() => {
    const q = merchantQuery.trim().toLowerCase()
    if (!q) return merchants
    return merchants.filter(m => m.business_name.toLowerCase().includes(q))
  }, [merchants, merchantQuery])

  return (
    <>
      {showSearch && (
        <div className="mb-8">
          <h4 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">
            {t('marketplace.searchLabel')}
          </h4>
          <input
            type="text"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={t('marketplace.searchPlaceholder')}
            className="w-full bg-slate-50 border border-slate-200 rounded-full px-3 py-2.5 text-sm font-medium outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10"
          />
        </div>
      )}

      {showSort && sort != null && onSortChange && (
        <div className="mb-8">
          <h4 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">
            {t('marketplace.sortBy')}
          </h4>
          <select
            value={sort}
            onChange={e => onSortChange(e.target.value as SortOption)}
            className="w-full bg-slate-50 border border-slate-200 rounded-full px-3 py-2.5 text-sm font-bold text-slate-900 outline-none cursor-pointer focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </div>
      )}

      {(showSearch || showSort) && flatCategories.length > 0 && (
        <div className="h-px w-full bg-slate-100 mb-8" />
      )}

      {flatCategories.length > 0 && (
        <MarketplaceFilterListSection
          title={t('marketplace.categories')}
          searchPlaceholder="Rechercher une catégorie…"
          searchQuery={categoryQuery}
          onSearchQueryChange={setCategoryQuery}
          emptyMessage="Aucune catégorie trouvée"
        >
          <label className="flex items-center gap-3 cursor-pointer group px-1 py-1 rounded-full hover:bg-white">
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
          {filteredCategories.length === 0 ? (
            <p className="text-sm text-slate-400 font-medium px-2 py-3 text-center">
              Aucune catégorie trouvée
            </p>
          ) : (
            filteredCategories.map(cat => (
            <label key={cat.slug} className="flex items-center gap-3 cursor-pointer group px-1 py-1 rounded-lg hover:bg-white">
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
            ))
          )}
        </MarketplaceFilterListSection>
      )}

      {merchants.length > 0 && (
        <>
          <div className="h-px w-full bg-slate-100 mb-8" />
          <MarketplaceFilterListSection
            title={t('marketplace.shops')}
            searchPlaceholder="Rechercher une boutique…"
            searchQuery={merchantQuery}
            onSearchQueryChange={setMerchantQuery}
            emptyMessage="Aucune boutique trouvée"
          >
            {filteredMerchants.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium px-2 py-3 text-center">
                Aucune boutique trouvée
              </p>
            ) : (
              filteredMerchants.map(m => {
              const checked = selectedMerchants.has(m.slug)
              return (
                <label
                  key={m.id}
                  className="flex items-center gap-3 cursor-pointer group px-1 py-1 rounded-lg hover:bg-white"
                >
                  <button
                    type="button"
                    onClick={() => onToggleMerchant(m.slug)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
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
            })
            )}
          </MarketplaceFilterListSection>
        </>
      )}

      <div className="h-px w-full bg-slate-100 mb-8" />

      <FilterRadioGroup
        title="État du produit"
        options={CONDITION_OPTIONS}
        selected={selectedCondition}
        onSelect={v => onConditionChange(v as ProductCondition | '')}
        allLabel="Tous les états"
      />

      <div className="h-px w-full bg-slate-100 mb-8" />

      <FilterRadioGroup
        title="Origine"
        options={ORIGIN_OPTIONS}
        selected={selectedOrigin}
        onSelect={v => onOriginChange(v as ProductOrigin | '')}
        allLabel="Toutes origines"
      />

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
  const t = useT()
  const router = useRouter()
  const { addToCart } = useMarketplaceAddToCart()
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
  const [selectedCondition, setSelectedCondition] = useState<ProductCondition | ''>('')
  const [selectedOrigin, setSelectedOrigin] = useState<ProductOrigin | ''>('')
  const [priceFilter, setPriceFilter] = useState(100_000)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [totalProducts, setTotalProducts] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const filtersFabVisible = useScrollFabVisibility()

  const rootCategories = categories

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const loadCatalog = useCallback(async (pageIndex = 0, append = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    setLoadError(null)

    const qs = new URLSearchParams()
    if (sort === 'price_asc') qs.set('sort', 'price_asc')
    else if (sort === 'price_desc') qs.set('sort', 'price_desc')
    if (selectedCategory) qs.set('category', selectedCategory)
    if (selectedCondition) qs.set('condition', selectedCondition)
    if (selectedOrigin) qs.set('origin', selectedOrigin)
    if (debouncedSearch) qs.set('q', debouncedSearch)
    if (selectedMerchants.size === 1) {
      qs.set('merchant', [...selectedMerchants][0]!)
    }
    qs.set('limit', String(PAGE_SIZE))
    qs.set('offset', String(pageIndex * PAGE_SIZE))
    qs.set('paged', '1')
    const productPath = `/marketplace/products?${qs}`

    const productResult = await fetchPublicJson<MarketplaceCatalogPage>(productPath)

    if (!productResult.ok) {
      setLoadError(productResult.error)
      if (!append) {
        setProducts([])
        setMerchants([])
        setSpotlight([])
        setTotalProducts(0)
        setHasMore(false)
      }
      setLoading(false)
      setLoadingMore(false)
      return
    }

    const payload = productResult.data
    const list = payload.data ?? []
    setProducts(prev => (append ? [...prev, ...list] : list))
    setTotalProducts(payload.meta?.total ?? list.length)
    setHasMore(Boolean(payload.meta?.hasMore))
    setPage(pageIndex)

    if (!append) {
      const [merchantResult, spotlightResult] = await Promise.all([
        fetchPublicJson<MarketplaceBoutique[]>('/marketplace/merchants?limit=50'),
        fetchPublicJson<MarketplaceSpotlightShop[]>('/marketplace/spotlight'),
      ])
      setMerchants(merchantResult.ok ? merchantResult.data : [])
      setSpotlight(spotlightResult.ok ? spotlightResult.data : [])

      if (list.length > 0) {
        const highest = Math.max(...list.map((p: MarketplaceCatalogProduct) => p.price))
        const ceiling = Math.ceil(highest / 1000) * 1000 || 100_000
        setPriceFilter(prev => (prev === 100_000 ? ceiling : prev))
      }
    }

    setLoading(false)
    setLoadingMore(false)
  }, [sort, selectedCategory, selectedCondition, selectedOrigin, debouncedSearch, selectedMerchants])

  useEffect(() => {
    void fetchPublicJson<ProductCategoryNode[]>(
      `/marketplace/product-categories?country=${encodeURIComponent(getCountryCode())}`,
    ).then(result => {
      if (result.ok) setCategories(result.data)
    })
  }, [])

  useEffect(() => {
    void loadCatalog(0, false)
  }, [loadCatalog])

  const loadMore = () => {
    if (loadingMore || !hasMore) return
    void loadCatalog(page + 1, true)
  }

  const priceCeiling = useMemo(() => {
    if (products.length === 0) return 100_000
    return Math.ceil(Math.max(...products.map(p => p.price)) / 1000) * 1000 || 100_000
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => p.price <= priceFilter)
    if (selectedMerchants.size > 1) {
      list = list.filter(p => selectedMerchants.has(p.merchant.slug))
    } else if (selectedMerchants.size === 1) {
      const slug = [...selectedMerchants][0]!
      list = list.filter(p => p.merchant.slug === slug)
    }
    return list
  }, [products, priceFilter, selectedMerchants])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (search.trim()) count += 1
    if (selectedMerchants.size > 0) count += 1
    if (selectedCategory) count += 1
    if (selectedCondition) count += 1
    if (selectedOrigin) count += 1
    if (priceFilter < priceCeiling) count += 1
    return count
  }, [search, selectedMerchants, selectedCategory, selectedCondition, selectedOrigin, priceFilter, priceCeiling])

  const mobileModalFilterCount = useMemo(() => {
    let count = 0
    if (selectedMerchants.size > 0) count += 1
    if (selectedCondition) count += 1
    if (selectedOrigin) count += 1
    if (priceFilter < priceCeiling) count += 1
    if (sort !== 'newest') count += 1
    return count
  }, [selectedMerchants, selectedCondition, selectedOrigin, priceFilter, priceCeiling, sort])

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
    setSelectedCondition('')
    setSelectedOrigin('')
    setSelectedMerchants(new Set())
    setPriceFilter(priceCeiling)
    setSort('newest')
  }

  const handleAdd = async (product: MarketplaceCatalogProduct) => {
    if (shouldRedirectToProductPage(product)) {
      router.push(marketplaceProductHref(product))
      return
    }
    setAddingId(product.id)
    await addToCart(product.id, 1, marketplaceQuickAddOptions(product))
    setAddingId(null)
  }

  return (
    <>
      {/* ── Desktop hero ── */}
      <header className="hidden md:block pt-32 pb-12 bg-white border-b border-slate-100">
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

      {/* ── Mobile top : recherche, catégories, à la une ── */}
      <section className="md:hidden pt-[calc(5rem+1rem)] bg-[#FAFAFA] border-b border-slate-100/80">
        <div className={cn(HOME_MOBILE_GUTTER, 'space-y-5 pb-5')}>
          <SearchAutocomplete
            productsOnly
            navigateTo="current"
            value={search}
            onValueChange={setSearch}
            onSearch={setSearch}
            placeholder={t('marketplace.searchPlaceholder')}
            size="sm"
          />

          <MarketplaceCategoryCarousel
            categories={rootCategories}
            selectedSlug={selectedCategory}
            onSelect={setSelectedCategory}
            allLabel={t('marketplace.allCategories')}
          />
        </div>

        {spotlight.length > 0 && (
          <div className="pb-5">
            <div className={HOME_MOBILE_GUTTER}>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                {t('marketplace.spotlight')}
              </h3>
            </div>
            <SpotlightShopsCarousel shops={spotlight} trackClassName={HOME_MOBILE_TRACK} />
          </div>
        )}
      </section>

      <main className={`${PAGE_CONTAINER} py-5 md:py-12 pb-24 lg:pb-12`}>
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
                selectedCondition={selectedCondition}
                onConditionChange={setSelectedCondition}
                selectedOrigin={selectedOrigin}
                onOriginChange={setSelectedOrigin}
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
                onRetry={() => void loadCatalog(0, false)}
                loading={loading}
                className="mb-6"
              />
            )}

            <div className="hidden md:flex bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 sm:gap-4 mb-6 md:mb-8">
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
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 items-stretch">
                  {filtered.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant="boutique"
                      showBestSeller={index === 0 && sort === 'newest' && page === 0}
                      showAddButton
                      onAdd={() => handleAdd(product)}
                      adding={addingId === product.id}
                    />
                  ))}
                </div>
                {hasMore && selectedMerchants.size <= 1 && (
                  <div className="flex justify-center pt-8 pb-2">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-brand-300 hover:text-brand-600 transition-colors disabled:opacity-60"
                    >
                      {loadingMore && <Loader2 size={16} className="animate-spin" />}
                      Voir plus de produits
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="space-y-10 mt-8 md:mt-12 lg:mt-16">
          <RecentlyViewedProducts />
          <ProductRecommendations />
        </div>
      </main>

      {!filtersOpen && (
        <div
          className={cn(
            'lg:hidden fixed bottom-[calc(4rem+0.75rem)] inset-x-0 z-30 px-6 pointer-events-none transition-all duration-300 ease-out',
            filtersFabVisible
              ? 'translate-y-0 opacity-100'
              : 'translate-y-6 opacity-0',
          )}
          aria-hidden={!filtersFabVisible}
        >
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            tabIndex={filtersFabVisible ? 0 : -1}
            className={cn(
              'w-full flex items-center justify-center gap-2.5 bg-slate-900 text-white py-3.5 rounded-full text-sm font-extrabold shadow-xl shadow-slate-900/20 hover:bg-slate-800 active:scale-[0.98] transition-transform',
              filtersFabVisible ? 'pointer-events-auto scale-100' : 'pointer-events-none scale-95',
            )}
          >
            <SlidersHorizontal size={18} />
            {t('marketplace.filters')}
            {mobileModalFilterCount > 0 && (
              <span className="bg-brand-500 text-white text-xs font-bold min-w-[1.25rem] h-5 px-1.5 rounded-full flex items-center justify-center">
                {mobileModalFilterCount}
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
            className="relative bg-white w-full max-h-[85vh] flex flex-col rounded-t-[28px] shadow-2xl border border-slate-100"
          >
            <div className="shrink-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
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

            <div className="flex-1 overflow-y-auto p-5 min-h-0">
              <MarketplaceFiltersPanel
                search={search}
                onSearchChange={setSearch}
                showSearch={false}
                showSort
                sort={sort}
                onSortChange={setSort}
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedCondition={selectedCondition}
                onConditionChange={setSelectedCondition}
                selectedOrigin={selectedOrigin}
                onOriginChange={setSelectedOrigin}
                merchants={merchants}
                selectedMerchants={selectedMerchants}
                onToggleMerchant={toggleMerchant}
                priceFilter={priceFilter}
                onPriceFilterChange={setPriceFilter}
                priceCeiling={priceCeiling}
                t={t}
              />
            </div>

            <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="shrink-0 w-12 h-12 rounded-full border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  aria-label={t('marketplace.resetFilters')}
                >
                  <RotateCcw size={18} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex-1 min-w-0 py-3.5 bg-slate-900 text-white rounded-full text-sm font-extrabold hover:bg-slate-800 transition-colors"
              >
                {t('marketplace.applyFilters')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
