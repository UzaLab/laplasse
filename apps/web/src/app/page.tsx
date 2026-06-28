import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Navbar } from '@/components/layout/Navbar'
import { AppFooter } from '@/components/layout/AppFooter'
import { CountryHubModal } from '@/components/layout/CountryHubModal'
import { HubCountriesSection } from '@/components/layout/HubCountriesSection'
import { HeroSection } from '@/features/discovery/components/HeroSection'
import { CategoryPills } from '@/features/discovery/components/CategoryPills'
import { SpotCard } from '@/features/discovery/components/SpotCard'
import { NearbyCard } from '@/features/discovery/components/NearbyCard'
import { MarketplaceSection } from '@/features/discovery/components/MarketplaceSection'
import { B2BSection } from '@/features/discovery/components/B2BSection'
import { HomeMobilePage } from '@/features/discovery/home-mobile-v2/HomeMobileV2Page'
import { fetchHomeMobileData } from '@/features/discovery/home-mobile-v2/fetchHomeMobileData'
import { api, ApiMerchant, ApiCategory } from '@/lib/api'
import { isRootDomainHost } from '@/lib/country'
import { getRequestCountryAndCity } from '@/lib/serverCountry'

export const dynamic = 'force-dynamic'

function toSpotMerchant(m: ApiMerchant) {
  return {
    ...m,
    category: {
      ...m.category,
      icon: m.category.icon ?? 'UtensilsCrossed',
    },
    sub_category: m.category.name,
    has_reservation: false,
  }
}

function toCategory(c: ApiCategory) {
  return { ...c, icon: c.icon ?? 'UtensilsCrossed' }
}

function HubHomePage() {
  return (
    <div className="bg-[#FAFAFA] selection:bg-brand-200 selection:text-brand-900 overflow-x-hidden">
      <Navbar />
      <HeroSection mode="hub" />
      <HubCountriesSection />
      <B2BSection />
      <AppFooter />
      <CountryHubModal />
    </div>
  )
}

function DesktopHomePage({
  categories,
  featured,
  nearby,
  defaultCity,
}: {
  categories: ReturnType<typeof toCategory>[]
  featured: ReturnType<typeof toSpotMerchant>[]
  nearby: ReturnType<typeof toSpotMerchant>[]
  defaultCity: string
}) {
  return (
    <div className="hidden md:block bg-[#FAFAFA] selection:bg-brand-200 selection:text-brand-900 overflow-x-hidden">
      <Navbar />

      <HeroSection />

      <CategoryPills categories={categories} />

      <section className="py-24 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-6">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
                La Sélection LaPlasse
              </h2>
              <p className="text-slate-500 text-lg">
                Les adresses incontournables de {defaultCity}.
              </p>
            </div>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 font-bold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Voir toutes les adresses <ArrowRight size={16} />
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featured.map((m) => <SpotCard key={m.id} merchant={m} />)}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-16">Aucun établissement disponible pour le moment.</p>
          )}
        </div>
      </section>

      <MarketplaceSection />

      {nearby.length > 0 && (
        <section className="py-24 bg-[#FAFAFA]">
          <div className="max-w-7xl mx-auto px-6">

            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
                  À proximité
                </h2>
                <p className="text-base text-slate-500">
                  Les meilleurs commerces autour de vous, ouverts maintenant.
                </p>
              </div>
              <Link
                href="/search?filter=nearby"
                className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
              >
                Voir tout <ArrowRight size={14} />
              </Link>
            </div>

            <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2 lg:grid lg:grid-cols-3">
              {nearby.map((m) => <NearbyCard key={m.id} merchant={m} />)}
            </div>
          </div>
        </section>
      )}

      <B2BSection />

      <AppFooter />
    </div>
  )
}

export default async function HomePage() {
  const headerStore = await headers()
  if (isRootDomainHost(headerStore.get('host') ?? '')) {
    return <HubHomePage />
  }

  const { country, city: defaultCity } = await getRequestCountryAndCity()

  const [categoriesRaw, merchantsRaw, mobileData] = await Promise.allSettled([
    api.categories.list(),
    api.merchants.featured(defaultCity, 6, country),
    fetchHomeMobileData(defaultCity, country),
  ])

  const categories =
    categoriesRaw.status === 'fulfilled' ? categoriesRaw.value.map(toCategory) : []
  const merchants =
    merchantsRaw.status === 'fulfilled' ? merchantsRaw.value.map(toSpotMerchant) : []
  const featured = merchants.slice(0, 3)
  const nearby = merchants.slice(0, 3)
  const mobile =
    mobileData.status === 'fulfilled'
      ? mobileData.value
      : { categories: [], merchants: [], products: [], shops: [] }

  return (
    <>
      <div className="md:hidden">
        <HomeMobilePage
          {...mobile}
          defaultCity={defaultCity}
        />
      </div>

      <DesktopHomePage
        categories={categories}
        featured={featured}
        nearby={nearby}
        defaultCity={defaultCity}
      />
    </>
  )
}
