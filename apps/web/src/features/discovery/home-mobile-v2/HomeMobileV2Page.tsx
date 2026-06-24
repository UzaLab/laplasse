'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'

import { CartDrawer } from '@/components/layout/CartDrawer'
import { CartSync } from '@/components/layout/CartSync'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
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

export interface HomeMobilePageProps {
  categories: Category[]
  merchants: ApiMerchant[]
  products: FeaturedProduct[]
  shops: MarketplaceSpotlightShop[]
  defaultCity: string
  /** Bandeau preview interne (route /preview/home-mobile) */
  preview?: boolean
}

function greetingName(fullName: string | null | undefined, email: string | undefined): string {
  if (fullName?.trim()) {
    return fullName.trim().split(/\s+/)[0] ?? fullName
  }
  if (email) return email.split('@')[0] ?? 'vous'
  return 'vous'
}

function PreviewBanner() {
  return (
    <div className="fixed top-0 inset-x-0 z-[60] bg-brand-800 text-white text-center py-1.5 px-3 text-[11px] font-bold tracking-wide pt-[max(0.375rem,env(safe-area-inset-top))]">
      Aperçu v2 mobile — non publié
    </div>
  )
}

function DesktopGate() {
  return (
    <div className="hidden md:flex min-h-dvh flex-col items-center justify-center bg-[#FAFAFA] px-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="inline-flex items-center gap-2 mx-auto">
          <div className="w-8 h-8 bg-slate-900 text-brand-500 rounded-lg flex items-center justify-center">
            <MapPin size={18} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">LaPlasse</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Accueil mobile v2</h1>
        <p className="text-slate-500 leading-relaxed">
          Cette preview est optimisée pour le mobile. Ouvrez{' '}
          <span className="font-bold text-brand-600">/preview/home-mobile</span>{' '}
          sur votre téléphone ou réduisez la fenêtre (&lt; 768px).
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-500 transition-colors"
          style={{ textDecoration: 'none' }}
        >
          Retour à l&apos;accueil actuel
        </Link>
      </div>
    </div>
  )
}

export function HomeMobilePage({
  categories,
  merchants,
  products,
  shops,
  defaultCity,
  preview = false,
}: HomeMobilePageProps) {
  const user = useAuthStore(s => s.user)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const firstName = mounted ? greetingName(user?.full_name, user?.email) : 'vous'
  const headerTop = preview ? 'top-[28px]' : 'top-0'
  const mainTop = preview ? 'pt-[calc(28px+4rem+0.5rem)]' : 'pt-[calc(4rem+0.5rem)]'

  const content = (
    <div className="min-h-dvh flex flex-col bg-[#FAFAFA] text-slate-900 antialiased selection:bg-brand-200 selection:text-brand-900 overflow-x-hidden">
      <CartSync />
      {preview && <PreviewBanner />}

      <HomeMobileHeader topOffsetClass={headerTop} />

      <main className={cn('flex-1 pb-24 overflow-y-auto no-scrollbar overflow-x-hidden', mainTop)}>
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
                    href={`/categories/${cat.slug}`}
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
                <div key={merchant.id} className="shrink-0 snap-start">
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

      <MobileBottomNav />
      <CartDrawer />
    </div>
  )

  if (preview) {
    return (
      <>
        <DesktopGate />
        <div className="md:hidden">{content}</div>
      </>
    )
  }

  return content
}

/** @deprecated Alias preview — préférer HomeMobilePage */
export const HomeMobileV2Page = HomeMobilePage
