'use client'

import Link from 'next/link'
import { MapPin, Star } from 'lucide-react'

import { FavoriteButton } from '@/features/discovery/components/FavoriteButton'
import { WhatsAppLink } from '@/features/discovery/components/WhatsAppLink'
import { CategoryIcon } from '@/lib/icons'
import type { SearchHit } from '@/features/discovery/components/SearchResultCard'
import { cn } from '@/lib/utils'

function getCategoryName(m: SearchHit): string {
  if (m.category?.name) return m.category.name
  return m.category_name ?? ''
}

function getLocationLine(m: SearchHit): string {
  const district = m.location?.district ?? m.district
  const city = m.location?.city ?? m.city
  const parts = [district, city].filter(Boolean)
  const base = parts.join(', ') || city || ''
  if (m.distance_km != null && m.distance_km > 0) {
    return base ? `${base} • ${m.distance_km.toFixed(1)} km` : `${m.distance_km.toFixed(1)} km`
  }
  return base
}

function displayRating(m: SearchHit): string | null {
  if (m.trust_score > 0) return (m.trust_score / 20).toFixed(1)
  return null
}

export function SearchResultsMobileMerchantCard({
  merchant: m,
  compact = false,
}: {
  merchant: SearchHit
  compact?: boolean
}) {
  const profileHref = `/m/${m.slug}`
  const formattedName = m._formatted?.business_name
  const categoryName = getCategoryName(m)
  const location = getLocationLine(m)
  const rating = displayRating(m)
  const iconName = m.category?.icon ?? m.category_icon ?? ''
  const categorySlug = m.category?.slug ?? m.category_slug

  return (
    <article
      className={cn(
        'bg-white overflow-hidden border border-slate-200/80 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow duration-300 group',
        compact ? 'rounded-2xl' : 'rounded-3xl',
      )}
    >
      <Link href={profileHref} className="block" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className={cn('relative w-full overflow-hidden', compact ? 'h-36' : 'h-64')}>
          {m.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={m.cover_image}
              alt={m.business_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
              <CategoryIcon
                name={iconName}
                slug={categorySlug}
                size={compact ? 32 : 48}
                className="text-slate-300"
              />
            </div>
          )}

          <FavoriteButton
            merchantId={m.id}
            merchantSlug={m.slug}
            className={cn(
              'absolute bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center z-10 hover:text-brand-600 transition-colors',
              compact ? 'top-2 right-2 w-7 h-7' : 'top-4 right-4 w-9 h-9',
            )}
            size={compact ? 12 : 15}
          />

          <div className={cn('absolute flex flex-wrap gap-1', compact ? 'bottom-2 left-2' : 'bottom-4 left-4 gap-2')}>
            {categoryName && (
              <span className={cn(
                'bg-white/80 backdrop-blur-md text-slate-900 font-bold rounded-full truncate max-w-[5.5rem]',
                compact ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1',
              )}
              >
                {categoryName}
              </span>
            )}
            {rating && (
              <span className={cn(
                'bg-white/80 backdrop-blur-md text-slate-900 font-bold rounded-full flex items-center gap-0.5',
                compact ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1 gap-1',
              )}
              >
                <Star size={compact ? 10 : 14} className="fill-brand-500 text-brand-500 shrink-0" />
                {rating}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className={cn(compact ? 'p-2.5' : 'p-5')}>
        <Link href={profileHref} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 className={cn(
            'font-bold text-slate-900 truncate',
            compact ? 'text-sm mb-1' : 'text-xl mb-2',
          )}
          >
            {formattedName
              ? <span dangerouslySetInnerHTML={{ __html: formattedName }} />
              : m.business_name}
          </h3>
        </Link>

        {!compact && m.description && (
          <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">
            {m.description}
          </p>
        )}

        {location && (
          <div className={cn(
            'flex items-center justify-between gap-1',
            compact ? 'text-[10px]' : 'text-xs',
          )}
          >
            <div className="flex items-center text-slate-500 font-semibold min-w-0">
              <MapPin size={compact ? 12 : 16} className="mr-0.5 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
            {m.whatsapp && (
              <WhatsAppLink
                phone={m.whatsapp}
                merchantId={m.id}
                iconOnly
                iconSize={compact ? 16 : 18}
                className={cn(
                  'shrink-0 flex items-center justify-center rounded-full text-emerald-600',
                  'bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors',
                  compact ? 'w-7 h-7' : 'w-8 h-8',
                )}
              />
            )}
          </div>
        )}

        {!location && m.whatsapp && (
          <div className="flex justify-end">
            <WhatsAppLink
              phone={m.whatsapp}
              merchantId={m.id}
              iconOnly
              iconSize={compact ? 16 : 18}
              className={cn(
                'shrink-0 flex items-center justify-center rounded-full text-emerald-600',
                'bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors',
                compact ? 'w-7 h-7' : 'w-8 h-8',
              )}
            />
          </div>
        )}
      </div>
    </article>
  )
}
