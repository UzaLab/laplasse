'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { SlidersHorizontal, Star, Clock, Truck, Loader2 } from 'lucide-react'
import type { ApiMerchant } from '@/lib/api'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'
import { countryRequestHeaders } from '@/lib/country'
import { formatPrice } from '@/lib/marketplaceApi'
import { restaurationMenuItemHref } from '@/lib/restaurationLinks'
import {
  FOOD_HUB_CATEGORY_CHIPS,
  type FoodHubFilter,
  filterFoodMerchants,
} from '@/lib/foodHub'
import { RestaurationHubCard } from './RestaurationHubCard'
import { MenuSearchItemThumb } from './MenuSearchItemThumb'
import { HomeMobileHeader } from '@/features/discovery/home-mobile-v2/HomeMobileHeader'
import { HomeMobileV2CarouselTrack } from '@/features/discovery/home-mobile-v2/HomeMobileV2CarouselTrack'
import { HOME_MOBILE_GUTTER } from '@/features/discovery/home-mobile-v2/homeMobileLayout'
import { SearchAutocomplete } from '@/features/discovery/components/SearchAutocomplete'
import {
  MOBILE_BOTTOM_NAV_PAD,
  MOBILE_COMPACT_HEADER_PAD_LOOSE,
} from '@/lib/mobilePublicChrome'
import { cn } from '@/lib/utils'

const FILTER_CHIPS: { id: FoodHubFilter; label: string; icon: typeof Clock }[] = [
  { id: 'fast', label: 'Moins de 30 min', icon: Clock },
  { id: 'top', label: 'Mieux notés', icon: Star },
  { id: 'free_delivery', label: 'Offres spéciales', icon: Truck },
]

interface MenuSearchHit {
  id: string
  name: string
  price: number
  currency: string
  prep_minutes: number | null
  image_url: string | null
  merchant: { business_name: string; slug: string }
}

interface Props {
  merchants: ApiMerchant[]
  initialCategory?: string
  initialQuery?: string
}

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'
}

export function RestaurationHubPage({ merchants, initialCategory = '', initialQuery = '' }: Props) {
  const [menuQuery, setMenuQuery] = useState(initialQuery)
  const [category, setCategory] = useState(initialCategory)
  const [filter, setFilter] = useState<FoodHubFilter>('all')
  const [menuHits, setMenuHits] = useState<MenuSearchHit[]>([])
  const [menuSearchLoading, setMenuSearchLoading] = useState(false)

  useEffect(() => {
    const q = menuQuery.trim()
    if (q.length < 2) {
      setMenuHits([])
      return
    }
    setMenuSearchLoading(true)
    fetchWithTimeout(`${getApiUrl()}/search/menus?q=${encodeURIComponent(q)}&limit=12`, {
      headers: { 'Content-Type': 'application/json', ...countryRequestHeaders() },
    })
      .then(r => (r.ok ? r.json() : { data: [] }))
      .then(res => setMenuHits(Array.isArray(res.data) ? res.data : []))
      .catch(() => setMenuHits([]))
      .finally(() => setMenuSearchLoading(false))
  }, [menuQuery])

  const filtered = useMemo(
    () => filterFoodMerchants(merchants, { category: category || undefined, filter }),
    [merchants, category, filter],
  )

  // Promos réelles : restaurants avec has_active_promo=true (Phase 3b)
  const promos = useMemo(
    () => {
      const withPromo = merchants.filter(m => m.has_active_promo && m.cover_image)
      if (withPromo.length >= 2) return withPromo.slice(0, 6)
      // Fallback : sponsored ou restaurants avec cover_image si pas assez de promos
      const sponsored = merchants.filter(m => m.is_sponsored && m.cover_image && !m.has_active_promo)
      return [...withPromo, ...sponsored].slice(0, 6)
    },
    [merchants],
  )

  const showPromos = promos.length > 0 && !menuQuery.trim() && filter === 'all' && !category

  return (
    <div className={cn('min-h-dvh bg-[#FAFAFA] text-slate-900 overflow-x-hidden', MOBILE_BOTTOM_NAV_PAD)}>
      <HomeMobileHeader />

      <main className={cn('space-y-8 pb-6', MOBILE_COMPACT_HEADER_PAD_LOOSE)}>
        <section className={cn('relative', HOME_MOBILE_GUTTER)}>
          <div className="absolute -top-6 -right-8 w-48 h-48 bg-amber-100 rounded-full blur-[60px] -z-10 opacity-60 pointer-events-none" />
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Restauration</h1>
          <p className="text-base text-slate-500 mb-4">
            Restaurants, plats et commandes en livraison
          </p>
          <SearchAutocomplete
            placeholder="Rechercher un plat, un menu…"
            size="md"
            menusOnly
            navigateTo="current"
            value={menuQuery}
            onValueChange={setMenuQuery}
            onSearch={setMenuQuery}
          />
        </section>

        {/* Catégories culinaires */}
        <section>
          <HomeMobileV2CarouselTrack className="gap-4">
            <button
              type="button"
              onClick={() => setCategory('')}
              className="flex flex-col items-center gap-2 snap-start shrink-0 w-20"
            >
              <div
                className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center shadow-sm border',
                  !category ? 'bg-amber-500 border-amber-500 text-white' : 'bg-amber-50 border-amber-100 text-amber-700',
                )}
              >
                <SlidersHorizontal size={26} />
              </div>
              <span className="text-xs font-semibold text-slate-600">Tout</span>
            </button>
            {FOOD_HUB_CATEGORY_CHIPS.map(chip => {
              const Icon = chip.icon
              const active = category === chip.slug
              return (
                <button
                  key={chip.slug}
                  type="button"
                  onClick={() => setCategory(active ? '' : chip.slug)}
                  className="flex flex-col items-center gap-2 snap-start shrink-0 w-20"
                >
                  <div
                    className={cn(
                      'w-16 h-16 rounded-full flex items-center justify-center shadow-sm border transition-colors',
                      active
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'bg-amber-50/80 border-amber-100 text-amber-700',
                    )}
                  >
                    <Icon size={26} />
                  </div>
                  <span className={cn('text-xs font-semibold text-center leading-tight', active ? 'text-amber-900' : 'text-slate-600')}>
                    {chip.label}
                  </span>
                </button>
              )
            })}
          </HomeMobileV2CarouselTrack>
        </section>

        {/* Filtres rapides */}
        <section className={HOME_MOBILE_GUTTER}>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {FILTER_CHIPS.map(chip => {
              const Icon = chip.icon
              const active = filter === chip.id
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setFilter(active ? 'all' : chip.id)}
                  className={cn(
                    'whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border flex items-center gap-1.5 shrink-0 transition-colors',
                    active
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-slate-700 border-slate-200',
                  )}
                >
                  <Icon size={16} />
                  {chip.label}
                </button>
              )
            })}
          </div>
        </section>

        {/* Résultats recherche plats */}
        {menuQuery.trim().length >= 2 && (
          <section className={cn('space-y-3', HOME_MOBILE_GUTTER)}>
            <h2 className="text-lg font-bold text-slate-900">Plats correspondants</h2>
            {menuSearchLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-amber-400" />
              </div>
            ) : menuHits.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">Aucun plat trouvé pour « {menuQuery} ».</p>
            ) : (
              <ul className="space-y-2">
                {menuHits.map(hit => (
                  <li key={hit.id}>
                    <Link
                      href={restaurationMenuItemHref(hit.merchant.slug, hit.id)}
                      className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-amber-100/60 shadow-sm active:scale-[0.99] transition-transform"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <MenuSearchItemThumb imageUrl={hit.image_url} alt={hit.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{hit.name}</p>
                        <p className="text-xs text-slate-500 truncate">{hit.merchant.business_name}</p>
                        {hit.prep_minutes != null && (
                          <p className="text-xs text-amber-700 font-semibold mt-0.5 inline-flex items-center gap-1">
                            <Clock size={12} /> ~{hit.prep_minutes} min
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-bold text-amber-700 shrink-0 tabular-nums">
                        {formatPrice(hit.price, hit.currency)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Offres spéciales — piste carrousel alignée gouttière */}
        {showPromos && (
          <section>
            <div className={HOME_MOBILE_GUTTER}>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Offres spéciales</h2>
            </div>
            <HomeMobileV2CarouselTrack className="gap-4 pb-2">
              {promos.slice(0, 4).map(m => (
                <Link
                  key={m.id}
                  href={`/restauration/${m.slug}`}
                  className="relative w-[280px] h-[160px] flex-shrink-0 rounded-2xl overflow-hidden snap-start shadow-md block"
                  style={{ textDecoration: 'none' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.cover_image!}
                    alt={m.business_name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    {m.has_active_promo ? (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-1 inline-block">
                        Offre en cours
                      </span>
                    ) : m.is_sponsored ? (
                      <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-1 inline-block">
                        Sponsorisé
                      </span>
                    ) : null}
                    <h3 className="text-lg font-bold leading-tight">{m.business_name}</h3>
                  </div>
                </Link>
              ))}
            </HomeMobileV2CarouselTrack>
          </section>
        )}

        {/* Liste restaurants */}
        {!menuQuery.trim() && (
          <section className={cn('space-y-4', HOME_MOBILE_GUTTER)}>
            <h2 className="text-xl font-bold text-slate-900">
              {category
                ? FOOD_HUB_CATEGORY_CHIPS.find(c => c.slug === category)?.label ?? 'Restaurants'
                : 'Restaurants à proximité'}
            </h2>

            {filtered.length === 0 ? (
              <div className="text-center py-16 px-6 bg-white rounded-3xl border border-amber-100">
                <p className="text-slate-500 font-medium">Aucun restaurant trouvé.</p>
                <button
                  type="button"
                  onClick={() => { setMenuQuery(''); setCategory(''); setFilter('all') }}
                  className="mt-4 text-sm font-bold text-amber-700"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filtered.map(merchant => (
                  <RestaurationHubCard key={merchant.id} merchant={merchant} variant="featured" />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <div className="hidden md:flex min-h-[50vh] items-center justify-center p-8 text-center text-slate-500">
        Le hub Restauration est optimisé pour mobile. Ouvrez cette page sur votre téléphone.
      </div>
    </div>
  )
}

export function RestaurationHubLoading() {
  return (
    <div className="flex justify-center py-24">
      <Loader2 size={28} className="animate-spin text-amber-400" />
    </div>
  )
}
