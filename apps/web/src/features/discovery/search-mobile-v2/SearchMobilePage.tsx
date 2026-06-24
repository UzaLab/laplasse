'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Menu, SlidersHorizontal } from 'lucide-react'

import { CartDrawer } from '@/components/layout/CartDrawer'
import { CartSync } from '@/components/layout/CartSync'
import { MobileNav } from '@/components/layout/MobileNav'
import { SearchAutocomplete } from '@/features/discovery/components/SearchAutocomplete'
import { HOME_MOBILE_GUTTER, HOME_MOBILE_TRACK } from '@/features/discovery/home-mobile-v2/homeMobileLayout'
import { getCategoryIcon } from '@/lib/icons'
import { coordsFromCityName } from '@/lib/cityCoords'
import { getCountryCode } from '@/lib/country'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore, useCartItemCount } from '@/stores/cartStore'
import type { ApiMerchant } from '@/lib/api'
import type { Category } from '@/types/merchant'
import { SearchMobileMerchantCard } from './SearchMobileMerchantCard'
import { SearchMobileRadiusControl } from './SearchMobileRadiusControl'
import { useSearchMobileNearby } from './useSearchMobileNearby'

const SearchMobileMap = dynamic(
  () => import('./SearchMobileMap').then(m => m.SearchMobileMap),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 z-0 bg-slate-100 animate-pulse" />,
  },
)

export interface SearchMobilePageProps {
  categories: Category[]
  merchants: ApiMerchant[]
  defaultCity: string
}

export function SearchMobilePage({
  categories,
  merchants: initialMerchants,
  defaultCity,
}: SearchMobilePageProps) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(initialMerchants[0]?.id ?? null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [radiusOpen, setRadiusOpen] = useState(false)
  const cardsRef = useRef<HTMLDivElement>(null)

  const { user, isAuthenticated, logoutRemote } = useAuthStore()
  const openDrawer = useCartStore(s => s.openDrawer)
  const itemCount = useCartItemCount()

  const {
    radiusKm,
    setRadiusKm,
    minRadiusKm,
    maxRadiusKm,
    userLocation,
    geoStatus,
    merchants: nearbyMerchants,
    loadingMerchants,
    requestGeolocation,
  } = useSearchMobileNearby(defaultCity, getCountryCode(), initialMerchants)

  const mapCenter = useMemo(
    () => userLocation ?? coordsFromCityName(defaultCity, getCountryCode()),
    [userLocation, defaultCity],
  )

  const filteredMerchants = useMemo(() => {
    if (!selectedCategory) return nearbyMerchants
    return nearbyMerchants.filter(m => m.category.slug === selectedCategory)
  }, [nearbyMerchants, selectedCategory])

  useEffect(() => {
    if (filteredMerchants.length === 0) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !filteredMerchants.some(m => m.id === selectedId)) {
      setSelectedId(filteredMerchants[0].id)
    }
  }, [filteredMerchants, selectedId])

  const scrollToMerchant = useCallback((merchantId: string) => {
    const container = cardsRef.current
    if (!container) return
    const card = container.querySelector(`[data-merchant-id="${merchantId}"]`)
    card?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }, [])

  const handleSelectMerchant = useCallback(
    (merchantId: string) => {
      setSelectedId(merchantId)
      scrollToMerchant(merchantId)
    },
    [scrollToMerchant],
  )

  const openAdvancedSearch = () => {
    router.push('/search?filters=1')
  }

  const handleLogout = async () => {
    await logoutRemote()
    setMobileOpen(false)
    router.push('/')
  }

  const topOffset = 'pt-[max(1rem,env(safe-area-inset-top))]'

  return (
    <div className="fixed inset-0 flex flex-col bg-[#FAFAFA] overflow-hidden touch-manipulation">
      <CartSync />

      <SearchMobileMap
        merchants={filteredMerchants}
        selectedId={selectedId}
        onSelect={handleSelectMerchant}
        center={mapCenter}
        userLocation={userLocation}
        radiusKm={userLocation ? radiusKm : undefined}
      />

      <div
        className={cn(
          'absolute top-0 inset-x-0 z-40 pointer-events-none flex flex-col gap-3',
          topOffset,
          HOME_MOBILE_GUTTER,
        )}
      >
        <div className="flex items-center justify-end pointer-events-auto">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xl border border-slate-100 shadow-sm flex items-center justify-center text-slate-900 hover:bg-brand-50 active:scale-95 transition-all"
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <div
            className={cn(
              'flex-1 min-w-0',
              '[&_form>div]:rounded-full [&_form>div]:h-12 [&_form>div]:px-4',
              '[&_form>div]:bg-white/95 [&_form>div]:backdrop-blur-xl [&_form>div]:border-slate-200/80',
              '[&_form>div]:shadow-sm [&_form>div]:focus-within:border-brand-400',
              '[&_form>div]:focus-within:ring-2 [&_form>div]:focus-within:ring-brand-500/15',
            )}
          >
            <SearchAutocomplete
              placeholder={`Rechercher à ${defaultCity}…`}
              size="sm"
              navigateTo="search"
            />
          </div>
          <button
            type="button"
            onClick={openAdvancedSearch}
            className="shrink-0 w-12 h-12 rounded-full bg-white/95 backdrop-blur-xl border border-slate-100 shadow-sm flex items-center justify-center hover:bg-brand-50 transition-colors"
            aria-label="Filtres avancés"
          >
            <SlidersHorizontal size={18} className="text-slate-700" />
          </button>
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 pointer-events-auto -mx-6 px-6">
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              className={cn(
                'shrink-0 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap shadow-sm flex items-center gap-2 transition-colors border',
                !selectedCategory
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white/95 backdrop-blur-md text-slate-700 border-slate-200 hover:border-brand-300',
              )}
            >
              Tout
            </button>
            {categories.map(cat => {
              const Icon = getCategoryIcon(cat.icon, cat.slug)
              const active = selectedCategory === cat.slug
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(active ? '' : cat.slug)}
                  className={cn(
                    'shrink-0 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap shadow-sm flex items-center gap-2 transition-colors border',
                    active
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white/95 backdrop-blur-md text-slate-700 border-slate-200 hover:border-brand-300',
                  )}
                >
                  <Icon
                    size={15}
                    className={active ? 'text-white' : 'text-brand-700'}
                  />
                  {cat.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="absolute bottom-16 inset-x-0 z-40 pointer-events-none flex flex-col">
        <div className="flex justify-end pointer-events-auto pb-2 pr-6">
          <SearchMobileRadiusControl
            radiusKm={radiusKm}
            minRadiusKm={minRadiusKm}
            maxRadiusKm={maxRadiusKm}
            onRadiusChange={setRadiusKm}
            open={radiusOpen}
            onOpenChange={setRadiusOpen}
            userLocation={userLocation}
            geoStatus={geoStatus}
            onRequestGeolocation={requestGeolocation}
            loadingMerchants={loadingMerchants}
          />
        </div>

        {filteredMerchants.length > 0 ? (
          <div
            ref={cardsRef}
            className={cn(
              'flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 pb-3 pointer-events-auto',
              HOME_MOBILE_TRACK,
            )}
          >
            {filteredMerchants.map(merchant => (
              <div key={merchant.id} data-merchant-id={merchant.id}>
                <SearchMobileMerchantCard
                  merchant={merchant}
                  active={merchant.id === selectedId}
                  onFocus={() => setSelectedId(merchant.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={cn('pointer-events-auto', HOME_MOBILE_GUTTER)}>
            <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-100 px-4 py-6 text-center shadow-sm">
              <p className="text-sm font-semibold text-slate-700 mb-2">
                {userLocation
                  ? `Aucun établissement dans un rayon de ${radiusKm} km.`
                  : 'Aucun établissement pour ce filtre.'}
              </p>
              {userLocation && radiusKm < maxRadiusKm && (
                <button
                  type="button"
                  onClick={() => setRadiusKm(km => Math.min(maxRadiusKm, km + 2))}
                  className="text-sm font-bold text-brand-600 hover:text-brand-700 mr-4"
                >
                  Élargir à {Math.min(maxRadiusKm, radiusKm + 2)} km
                </button>
              )}
              <button
                type="button"
                onClick={() => router.push('/search')}
                className="text-sm font-bold text-slate-600 hover:text-slate-900"
              >
                Recherche avancée →
              </button>
            </div>
          </div>
        )}
      </div>

      <CartDrawer />

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
        cartCount={itemCount}
        onCartClick={() => {
          setMobileOpen(false)
          openDrawer()
        }}
      />
    </div>
  )
}

/** Alias preview */
export const SearchMobileV2Page = SearchMobilePage
