'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Headphones,
  Loader2,
  MapPin,
  SlidersHorizontal,
  Store,
} from 'lucide-react'
import {
  fetchMerchantProducts,
  type MarketplaceProduct,
} from '@/lib/marketplaceApi'
import { PAGE_CONTAINER } from '@/lib/pageLayout'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useCartStore } from '@/stores/cartStore'
import { ProductCard } from './ProductCard'

export interface BoutiqueDisplay {
  business_name: string
  slug: string
  logo?: string | null
  cover_image?: string | null
  phone?: string | null
  whatsapp?: string | null
  location?: { city?: string; district?: string | null } | null
}

type SortOption = 'recommended' | 'newest' | 'price_asc' | 'price_desc'

interface BoutiquePageClientProps {
  merchant: BoutiqueDisplay
}

function sortProducts(products: MarketplaceProduct[], sort: SortOption): MarketplaceProduct[] {
  const copy = [...products]
  switch (sort) {
    case 'price_asc':
      return copy.sort((a, b) => a.price - b.price)
    case 'price_desc':
      return copy.sort((a, b) => b.price - a.price)
    case 'newest':
      return copy.reverse()
    default:
      return copy
  }
}

function formatLocation(merchant: BoutiqueDisplay): string {
  if (!merchant.location) return ''
  return [merchant.location.district, merchant.location.city].filter(Boolean).join(', ')
}

export function BoutiquePageClient({ merchant }: BoutiquePageClientProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuthReady()
  const addItem = useCartStore(s => s.addItem)
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('recommended')
  const [addingId, setAddingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchMerchantProducts(merchant.slug)
      .then(data => {
        if (cancelled) return
        const list = data ?? []
        setProducts(list)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [merchant.slug])

  const priceCeiling = useMemo(() => {
    if (products.length === 0) return 100_000
    return Math.ceil(Math.max(...products.map(p => p.price)) / 1000) * 1000 || 100_000
  }, [products])

  const [priceFilter, setPriceFilter] = useState(priceCeiling)

  useEffect(() => {
    setPriceFilter(priceCeiling)
  }, [priceCeiling])

  const filtered = useMemo(() => {
    let list = products.filter(p => p.price <= priceFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q))
    }
    return sortProducts(list, sort)
  }, [products, priceFilter, search, sort])

  const handleAddToCart = async (product: MarketplaceProduct) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/m/${merchant.slug}/boutique`)}`)
      return
    }
    setAddingId(product.id)
    await addItem(product.id, 1)
    setAddingId(null)
  }

  const contactHref = merchant.whatsapp
    ? `https://wa.me/${merchant.whatsapp.replace(/\D/g, '')}`
    : merchant.phone
      ? `tel:${merchant.phone}`
      : `/m/${merchant.slug}`

  const locationLabel = formatLocation(merchant)
  const cover = merchant.cover_image
  const logo = merchant.logo

  return (
    <>
      <header className="pt-20">
        <div className="relative h-[25vh] md:h-[35vh] w-full bg-slate-900">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={merchant.business_name}
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 opacity-80" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />

          <div className="absolute bottom-0 left-0 w-full translate-y-1/2">
            <div className={`${PAGE_CONTAINER} flex items-end justify-between gap-6`}>
              <div className="flex items-end gap-4 md:gap-6 min-w-0">
                <div className="w-20 h-20 md:w-32 md:h-32 rounded-2xl bg-white p-2 shadow-xl border-4 border-[#FAFAFA] shrink-0">
                  <div className="w-full h-full rounded-xl overflow-hidden bg-slate-100">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo} alt={merchant.business_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Store size={28} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="pb-1 md:pb-4 text-white min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-brand-500 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1">
                      <Store size={12} /> Boutique Officielle
                    </span>
                  </div>
                  <h1 className="text-xl md:text-4xl font-extrabold tracking-tight truncate">
                    {merchant.business_name}
                  </h1>
                  {locationLabel && (
                    <p className="text-sm md:text-base text-slate-300 flex items-center gap-1 mt-1">
                      <MapPin size={16} className="text-brand-500 shrink-0" />
                      {locationLabel}
                    </p>
                  )}
                </div>
              </div>

              <div className="hidden md:block pb-4 shrink-0">
                <Link
                  href={`/m/${merchant.slug}`}
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-white/20 transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  <ArrowLeft size={16} /> Voir l&apos;établissement
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className={`${PAGE_CONTAINER} pt-24 md:pt-32 pb-16`}>
        <div className="md:hidden mb-6">
          <Link
            href={`/m/${merchant.slug}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            style={{ textDecoration: 'none' }}
          >
            <ArrowLeft size={16} /> Voir l&apos;établissement
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-28">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <h3 className="font-extrabold text-slate-900 text-lg mb-6 flex items-center gap-2">
                <SlidersHorizontal size={20} className="text-brand-500" /> Filtres
              </h3>

              <div className="mb-8">
                <h4 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">
                  Recherche
                </h4>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Nom du produit…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 transition-all"
                />
              </div>

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
                    value={priceFilter}
                    onChange={e => setPriceFilter(Number(e.target.value))}
                    className="w-full appearance-none bg-transparent accent-brand-500"
                  />
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-slate-600">
                  <span>0 F</span>
                  <span>Jusqu&apos;à {priceFilter.toLocaleString('fr-FR')} F</span>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-brand-50 rounded-3xl p-5 border border-brand-100 text-center">
              <Headphones size={32} className="text-brand-500 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 text-sm mb-2">Une question ?</h4>
              <p className="text-xs text-slate-600 mb-4">
                Contactez directement la boutique pour toute demande spécifique.
              </p>
              <a
                href={contactHref}
                target={merchant.whatsapp ? '_blank' : undefined}
                rel={merchant.whatsapp ? 'noopener noreferrer' : undefined}
                className="block w-full bg-white border border-brand-200 text-brand-700 py-2 rounded-xl text-sm font-bold hover:bg-brand-100 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                Contacter le vendeur
              </a>
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
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-900 outline-none cursor-pointer focus:border-brand-400 transition-colors"
                >
                  <option value="recommended">Recommandés</option>
                  <option value="newest">Nouveautés</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
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
                    merchantSlug={merchant.slug}
                    merchantName={merchant.business_name}
                    variant="boutique"
                    showBestSeller={index === 0 && sort === 'recommended'}
                    showAddButton
                    onAdd={() => handleAddToCart(product)}
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
