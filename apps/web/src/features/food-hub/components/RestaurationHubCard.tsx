'use client'

import Link from 'next/link'
import { Clock, Star, Bike, Tag, ChefHat } from 'lucide-react'
import type { ApiMerchant } from '@/lib/api'
import { FavoriteButton } from '@/features/discovery/components/FavoriteButton'
import {
  resolveMerchantFoodStatus,
  FOOD_HUB_DELIVERY_FEE_ESTIMATE,
  foodStatusLabel,
  formatFoodEtaFromDistance,
  merchantCuisineLabel,
  merchantDisplayRating,
  nextOpeningTime,
  nextOpeningLabel,
  type OpeningHours,
} from '@/lib/foodHub'
import { cn } from '@/lib/utils'

interface Props {
  merchant: ApiMerchant
  variant?: 'featured' | 'compact'
  className?: string
}

export function RestaurationHubCard({ merchant, variant = 'featured', className }: Props) {
  const cover = merchant.cover_image || merchant.featured_vertical?.image || merchant.logo
  const prep = merchant.food_prep_minutes ?? 25
  const rating = merchantDisplayRating(merchant)
  const eta = formatFoodEtaFromDistance(prep, merchant.distance_km)
  const foodStatus = resolveMerchantFoodStatus(merchant)
  const unavailable = foodStatus !== 'open'
  const showPromo = merchant.has_active_promo && !unavailable
  const nextOpen = foodStatus === 'closed'
    ? nextOpeningTime(merchant.food_opening_hours as OpeningHours | null)
    : null
  const nextOpenLabel = nextOpen ? nextOpeningLabel(nextOpen) : null

  if (variant === 'compact') {
    return (
      <Link
        href={`/restauration/${merchant.slug}`}
        className={cn(
          'bg-white rounded-xl p-3 flex gap-4 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] border border-amber-100/60 active:scale-[0.98] transition-transform',
          className,
        )}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden relative bg-amber-50">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={merchant.business_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100" />
          )}
          {showPromo && (
            <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
              <Tag size={9} />
              Offre
            </div>
          )}
          {unavailable && (
            <div className={`absolute inset-0 z-10 flex items-center justify-center rounded-lg ${foodStatus === 'closed' ? 'bg-slate-900/60 backdrop-grayscale' : 'bg-black/30'}`}>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${foodStatus === 'closed' ? 'text-white bg-slate-900/90' : 'text-white bg-amber-700/90'}`}>
                {foodStatusLabel(foodStatus)}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center flex-grow min-w-0">
          <h2 className="text-lg font-bold text-slate-900 line-clamp-1">{merchant.business_name}</h2>
          <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{merchantCuisineLabel(merchant)}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-amber-800 text-xs font-semibold">
              <Clock size={14} />
              {eta}
            </span>
            <span className="inline-flex items-center gap-1 text-slate-500 text-xs font-medium">
              <ChefHat size={13} />
              Prépa {prep} min
            </span>
            {rating && (
              <span className="inline-flex items-center gap-1 text-slate-600 text-xs font-semibold">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                {rating.score}
                <span className="text-slate-400 font-normal">({rating.count})</span>
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <article
      className={cn(
        'bg-white rounded-3xl overflow-hidden shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] border border-amber-100/50 flex flex-col',
        className,
      )}
    >
      <Link href={`/restauration/${merchant.slug}`} className="block" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="relative h-48 w-full bg-amber-50">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={merchant.business_name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-orange-50 to-amber-50" />
          )}
          <FavoriteButton
            merchantId={merchant.id}
            merchantSlug={merchant.slug}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-md shadow-sm"
          />
          {showPromo && (
            <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Tag size={12} />
              Offre en cours
            </div>
          )}
          {unavailable && (
            <div className={`absolute inset-0 z-10 flex items-center justify-center ${foodStatus === 'closed' ? 'bg-slate-900/60 backdrop-grayscale' : 'bg-black/30'}`}>
              <span className={`px-4 py-2 rounded-2xl text-sm font-bold ${foodStatus === 'closed' ? 'text-white bg-slate-900/90 border border-white/10' : 'text-white bg-amber-700/90'}`}>
                {foodStatusLabel(foodStatus)}
              </span>
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Clock size={16} className="text-amber-600" />
            <span className="text-sm font-semibold text-slate-800">{eta}</span>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-2">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-slate-900 leading-tight truncate">{merchant.business_name}</h3>
              <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{merchantCuisineLabel(merchant)}</p>
            </div>
            {rating && (
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-slate-800">{rating.score}</span>
                </div>
                <span className="text-[10px] text-slate-400">{rating.count} avis</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-slate-500 text-xs font-medium flex-wrap">
            <span className="inline-flex items-center gap-1">
              <ChefHat size={14} />
              Prépa {prep} min
            </span>
            <span className="inline-flex items-center gap-1">
              <Bike size={14} />
              Livraison dès {FOOD_HUB_DELIVERY_FEE_ESTIMATE.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
          {nextOpenLabel && (
            <p className="text-xs font-semibold text-slate-400 mt-0.5">{nextOpenLabel}</p>
          )}
        </div>
      </Link>
    </article>
  )
}
