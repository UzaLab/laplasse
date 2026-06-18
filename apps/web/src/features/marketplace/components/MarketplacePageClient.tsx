'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  ShoppingBag,
  SlidersHorizontal,
  Store,
} from 'lucide-react'
import { PAGE_CONTAINER } from '@/lib/pageLayout'
import {
  fetchMarketplaceMerchants,
  fetchMarketplaceProducts,
  type MarketplaceBoutique,
  type MarketplaceCatalogProduct,
} from '@/lib/marketplaceApi'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useCartStore } from '@/stores/cartStore'
import { ProductCard } from './ProductCard'

type SortOption = 'newest' | 'price_asc' | 'price_desc'

export function MarketplacePageClient() {
  const router = useRouter()
  const { isAuthenticated } = useAuthReady()
  const addItem = useCartStore(s => s.addItem)
  const [products, setProducts] = useState<MarketplaceCatalogProduct[]>([])
  const [merchants, setMerchants] = useState<MarketplaceBoutique[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [selectedMerchants, setSelectedMerchants] = useState<Set<string>>(new Set())
  const [priceFilter, setPriceFilter] = useState(100_000)
  const [addingId, setAddingId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      fetchMarketplaceProducts({ sort }),
      fetchMarketplaceMerchants(20),
    ])
      .then(([productList, merchantList]) => {
        if (cancelled) return
        const list = productList ?? []
        setProducts(list)
        setMerchants(merchantList ?? [])
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

          {merchants.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                Boutiques à la une
              </h3>
              <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4">
                {merchants.map(m => (
                  <Link
                    key={m.id}
                    href={`/m/${m.slug}/boutique`}
                    className="flex flex-col items-center gap-2 min-w-[80px] group"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-100 p-1 group-hover:border-brand-400 group-hover:shadow-lg transition-all">
                      <div className="w-full h-full rounded-xl overflow-hidden bg-slate-50">
                        {m.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.logo} alt={m.business_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Store size={22} />
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-brand-600 text-center line-clamp-2">
                      {m.business_name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className={`${PAGE_CONTAINER} py-12`}>
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-28">
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

              <div className="mb-8">
                <h4 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">
                  Recherche
                </h4>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
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
                              onClick={() => toggleMerchant(m.slug)}
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
                    onChange={e => setPriceFilter(Number(e.target.value))}
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
            </div>
          </aside>

          <div className="flex-1 w-full min-w-0">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
              <p className="text-slate-500 font-medium text-sm">
                Affichage de{' '}
                <span className="font-bold text-slate-900">{filtered.length}</span> produit
                {filtered.length > 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-400 font-medium">Trier par :</span>
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as SortOption)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-900 outline-none cursor-pointer focus:border-brand-400"
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
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
    </>
  )
}
