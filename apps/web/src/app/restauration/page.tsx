import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { AppFooter } from '@/components/layout/AppFooter'
import { api } from '@/lib/api'
import { getRequestCountryAndCity } from '@/lib/serverCountry'
import { RestaurationHubPage } from '@/features/food-hub/components/RestaurationHubPage'
import { RestaurationDesktopRedirect } from '@/features/food-hub/components/RestaurationDesktopRedirect'
import {
  RESTAURATION_DESKTOP_ONLY_CLASS,
  RESTAURATION_MOBILE_ONLY_CLASS,
  restaurationHubDesktopFallback,
} from '@/lib/restaurationViewport'
import { NAVBAR_TOP_PAD_LOOSE } from '@/lib/mobilePublicChrome'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Restauration — Commander en ligne',
  description:
    'Restaurants, fast-food, cafés et bars : commandez vos plats en livraison ou à emporter sur LaPlasse.',
}

interface Props {
  searchParams: Promise<{ cat?: string; q?: string }>
}

export default async function RestaurationPage({ searchParams }: Props) {
  const { cat, q } = await searchParams
  const { country, city: defaultCity } = await getRequestCountryAndCity()
  const desktopFallback = restaurationHubDesktopFallback(cat)

  let merchants: Awaited<ReturnType<typeof api.merchants.list>>['data'] = []
  try {
    const res = await api.merchants.list({
      vertical: 'food',
      city: defaultCity,
      country,
      limit: 50,
      sort: 'trust_score',
    })
    merchants = res.data
  } catch {
    merchants = []
  }

  return (
    <>
      <RestaurationDesktopRedirect href={desktopFallback} />

      <div className={RESTAURATION_MOBILE_ONLY_CLASS}>
        <RestaurationHubPage merchants={merchants} initialCategory={cat ?? ''} initialQuery={q ?? ''} />
      </div>

      <div className={`${RESTAURATION_DESKTOP_ONLY_CLASS} min-h-screen bg-[#FAFAFA]`}>
        <Navbar />
        <main className={`${NAVBAR_TOP_PAD_LOOSE} max-w-2xl mx-auto px-6 py-12 text-center`}>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-3">Restauration</h1>
          <p className="text-slate-500 mb-6">
            Le hub Restauration est disponible sur mobile et tablette. Sur ordinateur, parcourez les
            établissements par catégorie ou commandez depuis la fiche établissement.
          </p>
          <Link
            href={desktopFallback}
            className="inline-flex items-center justify-center h-12 px-8 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors"
            style={{ textDecoration: 'none' }}
          >
            Voir les établissements
          </Link>
        </main>
        <AppFooter />
      </div>
    </>
  )
}
