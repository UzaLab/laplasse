'use client'

import Link from 'next/link'
import { MapPin, Star, BadgeCheck, Zap } from 'lucide-react'
import { ApiMerchant } from '@/lib/api'

interface Props {
  merchants: ApiMerchant[]
}

export function SimilarMerchants({ merchants }: Props) {
  if (merchants.length === 0) return null

  return (
    <section>
      <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Vous aimerez aussi</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {merchants.map(m => (
          <Link
            key={m.id}
            href={`/m/${m.slug}`}
            className="group bg-white border border-slate-100 rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-200"
          >
            <div className="h-36 relative overflow-hidden bg-slate-100">
              {m.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.cover_image}
                  alt={m.business_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <span className="text-4xl">{m.category.icon ?? '🏪'}</span>
                </div>
              )}

              {/* Sponsored badge */}
              {m.is_sponsored && (
                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-white">
                  <Zap size={9} /> Sponsorisé
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-extrabold text-slate-900 text-sm leading-tight line-clamp-1">
                  {m.business_name}
                </h3>
                {m.verification_status === 'VERIFIED' && (
                  <BadgeCheck size={14} className="text-blue-500 shrink-0 mt-0.5" />
                )}
              </div>

              <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
                <MapPin size={10} />
                {m.location?.district ?? m.location?.city ?? '—'}
              </p>

              {m.review_count > 0 && (
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                  {m.review_count} avis
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
