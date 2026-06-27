'use client'

import { useEffect, useState } from 'react'

import { CartDrawer } from '@/components/layout/CartDrawer'
import { CartSync } from '@/components/layout/CartSync'
import { NearbyCard } from '@/features/discovery/components/NearbyCard'
import { SearchAutocomplete } from '@/features/discovery/components/SearchAutocomplete'
import { SpotlightShopsCarousel } from '@/features/marketplace/components/SpotlightShopsCarousel'
import { getCategoryIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import type { ApiMerchant } from '@/lib/api'
import type { FeaturedProduct, MarketplaceSpotlightShop } from '@/lib/marketplaceApi'
import type { Category } from '@/types/merchant'
import { getCategoryCircleStyle } from './categoryStyles'
import { HomeMobileHeader } from './HomeMobileHeader'
import { HOME_MOBILE_GUTTER, HOME_MOBILE_TRACK } from './homeMobileLayout'
import { HomeMobileV2ProductsCarousel } from './HomeMobileV2ProductsCarousel'
import { HomeMobileV2SectionHeader } from './HomeMobileV2SectionHeader'
import { HomeMobileV2CarouselTrack } from './HomeMobileV2CarouselTrack'
import Link from 'next/link'
import { MOBILE_BOTTOM_NAV_PAD, MOBILE_COMPACT_HEADER_PAD_LOOSE } from '@/lib/mobilePublicChrome'
import { isFoodCategorySlug } from '@/lib/foodHub'

export interface HomeMobilePageProps {
  categories: Category[]
  merchants: ApiMerchant[]
  products: FeaturedProduct[]
  shops: MarketplaceSpotlightShop[]
  defaultCity: string
}

function greetingName(fullName: string | null | undefined, email: string | undefined): string {
  if (fullName?.trim()) {
    return fullName.trim().split(/\s+/)[0] ?? fullName
  }
  if (email) return email.split('@')[0] ?? 'vous'
  return 'vous'
}

export function HomeMobilePage({
  categories,
  merchants,
  products,
  shops,
  defaultCity,
}: HomeMobilePageProps) {
  const user = useAuthStore(s => s.user)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const firstName = mounted ? greetingName(user?.full_name, user?.email) : 'vous'

  return (
    <div className="min-h-dvh flex flex-col bg-[#FAFAFA] text-slate-900 antialiased selection:bg-brand-200 selection:text-brand-900 overflow-x-hidden">
      <CartSync />

      <HomeMobileHeader />

      <main className={cn('flex-1 overflow-y-auto no-scrollbar overflow-x-hidden', MOBILE_COMPACT_HEADER_PAD_LOOSE, MOBILE_BOTTOM_NAV_PAD)}>
        <section className={cn('mb-8 relative', HOME_MOBILE_GUTTER)}>
          <div className="absolute -top-6 -right-8 w-48 h-48 bg-brand-100 rounded-full blur-[60px] -z-10 opacity-60 pointer-events-none" />

          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
            Bonjour, {firstName}
          </h2>
          <p className="text-base text-slate-500">
            Prêt à découvrir de nouvelles pépites à {defaultCity} ?
          </p>

          <div className="mt-4">
            <SearchAutocomplete
              placeholder="Établissements, produits, services…"
              size="md"
              navigateTo="search"
            />
          </div>
        </section>

        {categories.length > 0 && (
          <section className="mb-8">
            <HomeMobileV2CarouselTrack>
              {categories.map(cat => {
                const Icon = getCategoryIcon(cat.icon, cat.slug)
                const style = getCategoryCircleStyle(cat.slug)
                return (
                  <Link
                    key={cat.id}
                    href={
                      isFoodCategorySlug(cat.slug)
                        ? `/restauration?cat=${cat.slug}`
                        : `/categories/${cat.slug}`
                    }
                    className="flex flex-col items-center min-w-[80px] gap-2 group shrink-0 snap-start"
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      className={cn(
                        'w-16 h-16 rounded-full flex items-center justify-center border shadow-sm transition-colors',
                        style.circle,
                      )}
                    >
                      <Icon size={26} strokeWidth={1.75} className={style.icon} />
                    </div>
                    <span className={cn('text-xs font-bold text-center leading-tight', style.label)}>
                      {cat.name}
                    </span>
                  </Link>
                )
              })}
            </HomeMobileV2CarouselTrack>
          </section>
        )}

        <section className="mb-8">
          <div className={HOME_MOBILE_GUTTER}>
            <HomeMobileV2SectionHeader title="Établissements à la une" href="/search" />
          </div>

          {merchants.length > 0 ? (
            <HomeMobileV2CarouselTrack>
              {merchants.map(merchant => (
                <div key={merchant.id} className="w-[280px] shrink-0 snap-start">
                  <NearbyCard merchant={merchant} />
                </div>
              ))}
            </HomeMobileV2CarouselTrack>
          ) : (
            <p className={cn('text-sm text-slate-400 py-8 text-center', HOME_MOBILE_GUTTER)}>
              Aucun établissement disponible pour le moment.
            </p>
          )}
        </section>

        {products.length > 0 && (
          <section className="mb-8">
            <div className={HOME_MOBILE_GUTTER}>
              <HomeMobileV2SectionHeader title="Nouveautés Marketplace" href="/marketplace" />
            </div>
            <HomeMobileV2ProductsCarousel products={products} />
          </section>
        )}

        {shops.length > 0 && (
          <section>
            <div className={HOME_MOBILE_GUTTER}>
              <HomeMobileV2SectionHeader title="Boutiques à découvrir" href="/marketplace" />
            </div>
            <SpotlightShopsCarousel shops={shops} trackClassName={HOME_MOBILE_TRACK} />
          </section>
        )}
      </main>

      <CartDrawer />
    </div>
  )
}

/** @deprecated Alias preview — préférer HomeMobilePage */
export const HomeMobileV2Page = HomeMobilePage
