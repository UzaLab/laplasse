import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Search } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { AppFooter } from '@/components/layout/AppFooter'
import { api, ApiCategory, ApiMerchant } from '@/lib/api'
import { getDefaultCity, getServerCountryCode } from '@/lib/country'
import {
  BRAND_OG_LOCALE,
  categoryPageDescription,
  categoryPageTitle,
} from '@/lib/brandCopy'
import { CategoryIcon } from '@/lib/icons'
import { CategoryMerchantsGrid } from '@/features/discovery/components/CategoryMerchantsGrid'
import { NAVBAR_TOP_PAD } from '@/lib/mobilePublicChrome'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const defaultCity = getDefaultCity(getServerCountryCode())

  let category: ApiCategory
  let merchants: { data: ApiMerchant[]; meta: { total: number } }

  try {
    [category, merchants] = await Promise.all([
      api.categories.bySlug(slug),
      api.merchants.list({ category: slug, city: defaultCity, limit: 24, sort: 'trust_score' }),
    ])
  } catch {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />

      <div className={`${NAVBAR_TOP_PAD} bg-gradient-to-br from-slate-900 to-slate-800 text-white`}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium mb-6"
            style={{ textDecoration: 'none' }}
          >
            <ArrowLeft size={16} /> Retour
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
              <CategoryIcon name={category.icon} slug={category.slug} size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {category.name}
              </h1>
              <p className="text-slate-400 mt-1">
                <span className="font-bold text-brand-400">{category._count.merchants}</span>
                {` établissement${category._count.merchants > 1 ? 's' : ''} à ${defaultCity}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-brand-600 transition-colors" style={{ textDecoration: 'none' }}>Accueil</Link>
          <span>/</span>
          <span className="font-semibold text-slate-900">{category.name}</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 md:py-12 pb-24 md:pb-12">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <p className="text-slate-500 text-sm md:text-base">
            <span className="font-bold text-slate-900">{merchants.meta.total}</span> établissements
          </p>
          <Link
            href={`/search?category=${slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors"
            style={{ textDecoration: 'none' }}
          >
            Recherche avancée <ArrowRight size={14} />
          </Link>
        </div>

        {merchants.data.length > 0 ? (
          <CategoryMerchantsGrid merchants={merchants.data} />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
              <Search size={28} className="text-slate-400" strokeWidth={1.75} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun établissement</h3>
            <p className="text-slate-500 mb-6">Aucun établissement dans cette catégorie pour le moment.</p>
            <Link
              href="/"
              className="px-6 py-3 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition-colors"
              style={{ textDecoration: 'none' }}
            >
              Explorer d&apos;autres catégories
            </Link>
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://laplasse.ci'
  const defaultCity = getDefaultCity(getServerCountryCode())
  try {
    const cat = await api.categories.bySlug(slug)
    const title = categoryPageTitle(cat.name, defaultCity)
    const description = categoryPageDescription(cat.name, defaultCity)
    const url = `${BASE_URL}/categories/${slug}`

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title, description, url, type: 'website',
        siteName: 'LaPlasse', locale: BRAND_OG_LOCALE,
      },
      twitter: { card: 'summary', title, description },
    }
  } catch {
    return { title: 'Catégorie — LaPlasse' }
  }
}
