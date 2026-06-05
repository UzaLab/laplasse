'use client'

import Link from 'next/link'
import { BadgeCheck, Heart, MapPin, MessageCircle, Star, Store } from 'lucide-react'
import { useState } from 'react'
import type { ApiMerchant } from '@/lib/api'

// Les résultats Meilisearch sont plats — on normalise les deux formats ici
interface MeiliFlat {
  category_name?: string
  category_slug?: string
  category_icon?: string
  city?: string
  district?: string
  _formatted?: Record<string, string>
}

export type SearchHit = Partial<ApiMerchant> & MeiliFlat & {
  id: string
  business_name: string
  slug: string
  verification_status: ApiMerchant['verification_status']
  trust_score: number
  review_count: number
  cover_image?: string | null
  whatsapp?: string | null
  tags?: string[]
}

function getCategoryName(m: SearchHit): string {
  if (m.category?.name) return m.category.name
  return m.category_name ?? ''
}

function getLocation(m: SearchHit): string {
  const district = m.location?.district ?? m.district
  const city = m.location?.city ?? m.city
  return district ?? city ?? ''
}

function getCategoryIcon(m: SearchHit): string {
  return m.category?.icon ?? m.category_icon ?? ''
}

const ICON_EMOJI: Record<string, string> = {
  UtensilsCrossed: '🍽️',
  Wine: '🍷',
  Gem: '💎',
  Scissors: '✂️',
  Dumbbell: '💪',
}

export function SearchResultCard({ merchant: m }: { merchant: SearchHit }) {
  const [isFav, setIsFav] = useState(false)

  const formattedName = m._formatted?.business_name
  const categoryName = getCategoryName(m)
  const location = getLocation(m)
  const icon = getCategoryIcon(m)

  return (
    <article className="bg-white rounded-3xl p-3 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">

      {/* Image */}
      <div className="h-48 rounded-2xl overflow-hidden relative mb-4">
        {m.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.cover_image}
            alt={m.business_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-5xl">
            {ICON_EMOJI[icon] ?? '🏪'}
          </div>
        )}

        {/* Rating badge */}
        {m.review_count > 0 && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-900 flex items-center gap-1">
            <Star size={11} className="fill-brand-500 text-brand-500" />
            {m.review_count}
          </div>
        )}

        {/* Favorite */}
        <button
          onClick={(e) => { e.preventDefault(); setIsFav(!isFav) }}
          className={`absolute top-3 left-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors ${
            isFav ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
          }`}
        >
          <Heart size={15} className={isFav ? 'fill-red-500' : ''} />
        </button>

        {/* Verified */}
        {m.verification_status === 'VERIFIED' && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-blue-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <BadgeCheck size={11} /> Vérifié
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-2 flex-1 flex flex-col">
        <div className="mb-3">
          {categoryName && (
            <span className="text-brand-600 text-[10px] font-bold uppercase tracking-widest mb-1 block">
              {categoryName}
            </span>
          )}
          <h3 className="text-lg font-extrabold text-slate-900 leading-tight flex items-center gap-1.5">
            <span>
              {formattedName
                ? <span dangerouslySetInnerHTML={{ __html: formattedName }} />
                : m.business_name}
            </span>
            {m.verification_status === 'VERIFIED' && (
              <BadgeCheck size={14} className="text-blue-500 shrink-0" />
            )}
          </h3>
          {location && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <MapPin size={11} /> {location}
            </p>
          )}
        </div>

        {/* Tags / badges */}
        {(m.tags?.length ?? 0) > 0 || m.whatsapp ? (
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {m.whatsapp && (
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <MessageCircle size={10} /> WhatsApp
              </span>
            )}
            {m.trust_score >= 80 && (
              <span className="text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-full">
                ★ Top
              </span>
            )}
            {m.tags?.slice(0, 1).map(tag => (
              <span key={tag} className="text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-100 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {/* "En vitrine" placeholder — activé quand marketplace disponible */}
        <div className="mt-auto bg-slate-50 p-2.5 rounded-xl border border-slate-100 group-hover:border-brand-200 transition-colors mb-3">
          <div className="flex items-center gap-1 mb-1">
            <Store size={11} className="text-brand-500" />
            <span className="text-[9px] font-bold text-slate-400 uppercase">En vitrine</span>
          </div>
          <p className="text-xs text-slate-400 italic">Marketplace bientôt disponible</p>
        </div>

        {/* CTA */}
        <Link
          href={`/m/${m.slug}`}
          className="block text-center py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-brand-500 transition-colors"
          style={{ textDecoration: 'none' }}
        >
          Voir le lieu
        </Link>
      </div>
    </article>
  )
}
