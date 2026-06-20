import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, BadgeCheck, MapPin, MessageCircle, Search } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { api, ApiCategory, ApiMerchant } from '@/lib/api'
import { CategoryIcon } from '@/lib/icons'

interface Props {
  params: Promise<{ slug: string }>
}

function MerchantCard({ merchant }: { merchant: ApiMerchant }) {
  return (
    <Link href={`/m/${merchant.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article className="bg-white rounded-[24px] border border-slate-100 hover:border-brand-200 hover:shadow-lg transition-all duration-200 overflow-hidden group">
        <div className="h-48 overflow-hidden bg-slate-100">
          {merchant.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={merchant.cover_image}
              alt={merchant.business_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CategoryIcon name={merchant.category.icon} slug={merchant.category.slug} size={40} className="text-slate-300" />
            </div>
          )}
          {merchant.verification_status === 'VERIFIED' && (
            <div className="absolute top-3 left-3 bg-blue-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <BadgeCheck size={11} /> Vérifié
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="font-bold text-slate-900 text-lg mb-1 flex items-center gap-1.5">
            {merchant.business_name}
            {merchant.verification_status === 'VERIFIED' && (
              <BadgeCheck size={14} className="text-slate-600 shrink-0" />
            )}
          </h3>

          {merchant.location && (
            <p className="text-sm text-slate-500 flex items-center gap-1 mb-3">
              <MapPin size={12} />
              {merchant.location.district ?? merchant.location.city}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {merchant.whatsapp && (
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <MessageCircle size={10} /> WhatsApp
              </span>
            )}
            {merchant.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-100 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </article>
    </Link>
  )
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params

  let category: ApiCategory
  let merchants: { data: ApiMerchant[]; meta: { total: number } }

  try {
    [category, merchants] = await Promise.all([
      api.categories.bySlug(slug),
      api.merchants.list({ category: slug, city: 'Abidjan', limit: 24, sort: 'trust_score' }),
    ])
  } catch {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="pt-20 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
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
                <span className="font-bold text-brand-400">{category._count.merchants}</span> établissement{category._count.merchants > 1 ? 's' : ''} à Abidjan
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── BREADCRUMB + FILTER ───────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-brand-600 transition-colors" style={{ textDecoration: 'none' }}>Accueil</Link>
          <span>/</span>
          <span className="font-semibold text-slate-900">{category.name}</span>
        </div>
      </div>

      {/* ── RESULTS ───────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <p className="text-slate-500">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {merchants.data.map(m => <MerchantCard key={m.id} merchant={m} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
              <Search size={28} className="text-slate-400" strokeWidth={1.75} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun établissement</h3>
            <p className="text-slate-500 mb-6">Aucun établissement dans cette catégorie pour le moment.</p>
            <Link
              href="/"
              className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors"
              style={{ textDecoration: 'none' }}
            >
              Explorer d&apos;autres catégories
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://laplasse.ci'
  try {
    const cat = await api.categories.bySlug(slug)
    const title = `${cat.name} à Abidjan — LaPlasse`
    const description = `Découvrez les meilleurs établissements ${cat.name.toLowerCase()} à Abidjan, Cocody et partout en Côte d'Ivoire sur LaPlasse.`
    const url = `${BASE_URL}/categories/${slug}`

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title, description, url, type: 'website',
        siteName: 'LaPlasse', locale: 'fr_CI',
      },
      twitter: { card: 'summary', title, description },
    }
  } catch {
    return { title: 'Catégorie — LaPlasse' }
  }
}
