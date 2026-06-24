'use client'

import Link from 'next/link'
import { ArrowRight, Star } from 'lucide-react'

import { FavoriteButton } from '@/features/discovery/components/FavoriteButton'
import { WhatsAppLink } from '@/features/discovery/components/WhatsAppLink'
import { cn } from '@/lib/utils'
import type { ApiMerchant } from '@/lib/api'

interface SearchMobileMerchantCardProps {
  merchant: ApiMerchant
  active?: boolean
  onFocus?: () => void
}

function ratingLabel(merchant: ApiMerchant): string | null {
  if (merchant.trust_score > 0) {
    return (merchant.trust_score / 20).toFixed(1)
  }
  return null
}

function locationLine(merchant: ApiMerchant): string {
  const parts: string[] = []
  if (merchant.distance_km != null) {
    parts.push(`${merchant.distance_km} km`)
  }
  if (merchant.location?.district) parts.push(merchant.location.district)
  else if (merchant.location?.city) parts.push(merchant.location.city)
  if (parts.length === 0) return merchant.category.name
  return parts.join(' • ')
}

export function SearchMobileMerchantCard({
  merchant,
  active = false,
  onFocus,
}: SearchMobileMerchantCardProps) {
  const rating = ratingLabel(merchant)
  const href = `/m/${merchant.slug}`

  return (
    <article
      onFocus={onFocus}
      className={cn(
        'snap-start shrink-0 w-[85vw] max-w-[320px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08)] border border-slate-100 flex p-3 gap-4 transition-all',
        active ? 'scale-100 opacity-100 ring-2 ring-brand-400/50' : 'scale-[0.97] opacity-85',
      )}
    >
      <div className="flex flex-col w-24 shrink-0 gap-2">
        <Link
          href={href}
          className="w-24 h-24 rounded-2xl overflow-hidden relative bg-slate-100"
          style={{ textDecoration: 'none' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={merchant.cover_image ?? ''}
            alt={merchant.business_name}
            className="w-full h-full object-cover"
          />
          <FavoriteButton
            merchantId={merchant.id}
            merchantSlug={merchant.slug}
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm"
            favoritedClassName="bg-red-50 text-red-500"
            size={14}
          />
        </Link>

        {merchant.whatsapp && (
          <WhatsAppLink
            phone={merchant.whatsapp}
            merchantId={merchant.id}
            label="WhatsApp"
            iconSize={14}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
          />
        )}
      </div>

      <div className="flex flex-col justify-center py-1 flex-1 min-w-0">
        {(rating || merchant.review_count > 0) && (
          <div className="flex items-center gap-1 mb-1">
            {rating && (
              <>
                <Star size={14} className="fill-brand-500 text-brand-500" />
                <span className="text-xs font-semibold text-slate-900">{rating}</span>
              </>
            )}
            {merchant.review_count > 0 && (
              <span className="text-xs font-semibold text-slate-500 ml-0.5">
                ({merchant.review_count} avis)
              </span>
            )}
          </div>
        )}

        <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1 line-clamp-2">
            {merchant.business_name}
          </h3>
        </Link>

        <p className="text-sm text-slate-500 line-clamp-1 mb-2">{locationLine(merchant)}</p>

        <div className="flex items-center justify-between mt-auto gap-2">
          <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">
            {merchant.category.name}
          </span>
          <Link
            href={href}
            className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-brand-500 transition-colors shrink-0 shadow-md shadow-slate-900/15"
            style={{ textDecoration: 'none' }}
            aria-label={`Voir ${merchant.business_name}`}
          >
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  )
}
