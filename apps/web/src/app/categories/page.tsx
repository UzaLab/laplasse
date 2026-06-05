import Link from 'next/link'
import { ArrowRight, Search } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { api, ApiCategory } from '@/lib/api'

export const metadata = {
  title: 'Explorer les univers — LaPlasse',
  description: 'Gastronomie, lounges, spas, boutiques... Découvrez tous les établissements d\'Abidjan par catégorie.',
}

// Cover image par catégorie — éditoriale Unsplash
const CATEGORY_COVERS: Record<string, string> = {
  restaurants:  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=900',
  'bars-lounges':'https://images.unsplash.com/photo-1570554520913-ce219f885e35?auto=format&fit=crop&q=80&w=900',
  boutiques:    'https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&q=80&w=900',
  beaute:       'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=900',
  cafes:        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=900',
  hotels:       'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=900',
  pharmacies:   'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&q=80&w=900',
  fitness:      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=900',
  'fast-food':  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=900',
}

// Couleur accent par catégorie pour le gradient overlay
const CATEGORY_ACCENT: Record<string, string> = {
  restaurants:   'from-orange-950/80',
  'bars-lounges':'from-violet-950/80',
  boutiques:     'from-rose-950/80',
  beaute:        'from-pink-950/80',
  cafes:         'from-amber-950/80',
  hotels:        'from-slate-950/80',
  pharmacies:    'from-emerald-950/80',
  fitness:       'from-blue-950/80',
  'fast-food':   'from-red-950/80',
}

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=900'

export default async function CategoriesPage() {
  let categories: ApiCategory[] = []
  try {
    categories = await api.categories.list()
  } catch {
    categories = []
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]" style={{ fontFamily: '"Outfit", system-ui, sans-serif' }}>
      <Navbar />

      <main className="pt-24 pb-24">

        {/* ── Hero section ─────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6 mb-14 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold text-amber-500 uppercase tracking-[0.2em] mb-3">
                Abidjan · Tous quartiers
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-none mb-4">
                Explorer par<br className="hidden sm:block" />{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
                  univers
                </span>
              </h1>
              <p className="text-slate-500 text-lg max-w-xl leading-relaxed">
                Gastronomie, lounges, spas, boutiques…
                Tout ce qu&apos;Abidjan offre, organisé pour vous.
              </p>
            </div>
            <Link
              href="/search"
              className="inline-flex items-center gap-2.5 bg-slate-900 text-white font-bold px-6 py-3.5 rounded-2xl hover:bg-slate-800 transition-colors text-sm shrink-0"
              style={{ textDecoration: 'none' }}
            >
              <Search size={16} /> Recherche libre
            </Link>
          </div>
        </section>

        {/* ── Grid categories ──────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6">
          {categories.length === 0 ? (
            <div className="text-center py-32">
              <p className="text-slate-400 font-medium">Chargement des catégories…</p>
            </div>
          ) : (
            <>
              {/* Feature row: 2 grandes cartes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                {categories.slice(0, 2).map(cat => (
                  <CategoryCard key={cat.id} cat={cat} large />
                ))}
              </div>

              {/* Grid 3 colonnes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
                {categories.slice(2).map(cat => (
                  <CategoryCard key={cat.id} cat={cat} />
                ))}
              </div>

              {/* CTA bottom */}
              <div className="mt-10 text-center">
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2.5 border-2 border-slate-200 text-slate-700 font-bold px-8 py-4 rounded-2xl hover:border-amber-400 hover:text-amber-600 transition-all text-sm"
                  style={{ textDecoration: 'none' }}
                >
                  Voir tous les établissements <ArrowRight size={16} />
                </Link>
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}

// ── CategoryCard component ─────────────────────────────────────────────────────
function CategoryCard({ cat, large = false }: { cat: ApiCategory; large?: boolean }) {
  const cover = CATEGORY_COVERS[cat.slug] ?? FALLBACK_COVER
  const accent = CATEGORY_ACCENT[cat.slug] ?? 'from-slate-950/80'
  const count = cat._count?.merchants

  return (
    <Link
      href={`/categories/${cat.slug}`}
      className="group block bg-white rounded-[28px] p-3 border border-slate-100 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-500 overflow-hidden"
      style={{ textDecoration: 'none' }}
    >
      {/* Image container */}
      <div className={`relative overflow-hidden rounded-[20px] ${large ? 'h-72 sm:h-80' : 'h-56'}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt={cat.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t ${accent} via-black/10 to-transparent`} />

        {/* Top badge */}
        {count !== undefined && count > 0 && (
          <div className="absolute top-4 right-4">
            <span className="bg-white/15 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full">
              {count} lieu{count > 1 ? 'x' : ''}
            </span>
          </div>
        )}

        {/* Bottom text */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h2 className={`font-extrabold text-white leading-tight mb-1 ${large ? 'text-3xl' : 'text-2xl'}`}>
            {cat.name}
          </h2>
          {cat.icon && (
            <p className="text-white/70 text-sm font-medium">Découvrir</p>
          )}
        </div>
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between px-3 pt-3.5 pb-1">
        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
          Découvrir
        </span>
        <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-amber-500 group-hover:border-amber-500 group-hover:text-white text-slate-600 transition-all duration-300">
          <ArrowRight size={16} />
        </div>
      </div>
    </Link>
  )
}
