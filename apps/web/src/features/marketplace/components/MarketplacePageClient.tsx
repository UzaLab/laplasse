'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  ShoppingBag,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { PAGE_CONTAINER } from '@/lib/pageLayout'
import {
  fetchMarketplaceMerchants,
  fetchMarketplaceProducts,
  fetchMarketplaceSpotlight,
  type MarketplaceBoutique,
  type MarketplaceCatalogProduct,
  type MarketplaceSpotlightShop,
} from '@/lib/marketplaceApi'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useCartStore } from '@/stores/cartStore'
import { ProductCard } from './ProductCard'
import { SpotlightShopsCarousel } from './SpotlightShopsCarousel'

type SortOption = 'newest' | 'price_asc' | 'price_desc'

function MarketplaceFiltersPanel({
  search,
  onSearchChange,
  merchants,
  selectedMerchants,
  onToggleMerchant,
  priceFilter,
  onPriceFilterChange,
  priceCeiling,
}: {
  search: string
  onSearchChange: (v: string) => void
  merchants: MarketplaceBoutique[]
  selectedMerchants: Set<string>
  onToggleMerchant: (slug: string) => void
  priceFilter: number
  onPriceFilterChange: (v: number) => void
  priceCeiling: number
}) {
  return (
    <>
      <div className="mb-8">
        <h4 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">
          Recherche
        </h4>
        <input
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Produit, marque…"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10"
        />
      </div>

      {merchants.length > 0 && (
        <>
          <div className="h-px w-full bg-slate-100 mb-8" />
          <div className="mb-8">
            <h4 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">
              Boutiques
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
          Fourchette de prix
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
  const { isAuthenticated } = useAuthReady()
  const addItem = useCartStore(s => s.addItem)
  const [products, setProducts] = useState<MarketplaceCatalogProduct[]>([])
  const [merchants, setMerchants] = useState<MarketplaceBoutique[]>([])
  const [spotlight, setSpotlight] = useState<MarketplaceSpotlightShop[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [selectedMerchants, setSelectedMerchants] = useState<Set<string>>(new Set())
  const [priceFilter, setPriceFilter] = useState(100_000)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      fetchMarketplaceProducts({ sort }),
      fetchMarketplaceMerchants(50),
      fetchMarketplaceSpotlight(),
    ])
      .then(([productList, merchantList, spotlightList]) => {
        if (cancelled) return
        const list = productList ?? []
        setProducts(list)
        setMerchants(merchantList ?? [])
        setSpotlight(spotlightList ?? [])
        if (list.length > 0) {
          const highest = Math.max(...list.map(p => p.price))
          setPriceFilter(Math.ceil(highest / 1000) * 1000 || 100_000)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [sort])

  const priceCeiling = useMemo(() => {
    if (products.length === 0) return 100_000
    return Math.ceil(Math.max(...products.map(p => p.price)) / 1000) * 1000 || 100_000
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => p.price <= priceFilter)
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.merchant.business_name.toLowerCase().includes(q),
      )
    }
    if (selectedMerchants.size > 0) {
      list = list.filter(p => selectedMerchants.has(p.merchant.slug))
    }
    return list
  }, [products, priceFilter, debouncedSearch, selectedMerchants])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (search.trim()) count += 1
    if (selectedMerchants.size > 0) count += 1
    if (priceFilter < priceCeiling) count += 1
    return count
  }, [search, selectedMerchants, priceFilter, priceCeiling])

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
                <ShoppingBag size={14} /> Click & Collect ou Livraison
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                La Marketplace LaPlasse
              </h1>
              <p className="text-lg text-slate-500">
                L&apos;art de vivre ivoirien, de la table de nos chefs à votre dressing.
                Achetez en direct auprès des meilleurs établissements d&apos;Abidjan.
              </p>
            </div>
          </div>

          {spotlight.length > 0 && (
            <div className="mb-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                Boutiques à la une
              </h3>
              <SpotlightShopsCarousel shops={spotlight} />
            </div>
          )}
        </div>
      </header>

      <main className={`${PAGE_CONTAINER} py-8 md:py-12 pb-28 lg:pb-12`}>
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <aside className="hidden lg:block w-full lg:w-64 shrink-0 lg:sticky lg:top-28">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <SlidersHorizontal size={20} className="text-brand-500" /> Filtres
                </h3>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-bold text-slate-400 hover:text-slate-900"
                >
                  Effacer
                </button>
              </div>
              <MarketplaceFiltersPanel
                search={search}
                onSearchChange={setSearch}
                merchants={merchants}
                selectedMerchants={selectedMerchants}
                onToggleMerchant={toggleMerchant}
                priceFilter={priceFilter}
                onPriceFilterChange={setPriceFilter}
                priceCeiling={priceCeiling}
              />
            </div>
          </aside>

          <div className="flex-1 w-full min-w-0">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 sm:gap-4 mb-6 md:mb-8">
              <div className="flex items-center justify-between sm:justify-end gap-3 text-sm w-full sm:w-auto">
                <span className="text-slate-400 font-medium shrink-0">Trier par :</span>
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as SortOption)}
                  className="flex-1 sm:flex-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-900 outline-none cursor-pointer focus:border-brand-400"
                >
                  <option value="newest">Nouveautés</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-24">
                <Loader2 size={28} className="animate-spin text-slate-300" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-slate-100">
                <p className="text-slate-500 font-medium">Aucun produit ne correspond à vos filtres.</p>
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
            Filtres
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
                <SlidersHorizontal size={20} className="text-brand-500" /> Filtres
              </h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 pb-8">
              <MarketplaceFiltersPanel
                search={search}
                onSearchChange={setSearch}
                merchants={merchants}
                selectedMerchants={selectedMerchants}
                onToggleMerchant={toggleMerchant}
                priceFilter={priceFilter}
                onPriceFilterChange={setPriceFilter}
                priceCeiling={priceCeiling}
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
