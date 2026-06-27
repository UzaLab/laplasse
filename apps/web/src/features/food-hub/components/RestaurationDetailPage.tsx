'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Star,
  Clock,
  Bike,
  Share2,
  MapPin,
  UtensilsCrossed,
} from 'lucide-react'
import type { ApiMerchantDetail } from '@/lib/api'
import { FoodMenuOrderPanel } from '@/features/merchant/components/profile/FoodMenuOrderPanel'
import { RESTAURATION_MENU_ITEM_PARAM } from '@/lib/restaurationLinks'
import {
  computeFoodStatusClient,
  FOOD_HUB_DELIVERY_FEE_ESTIMATE,
  foodPauseUntilLabel,
  foodStatusLabel,
  formatFoodEtaFromDistance,
  formatFoodMinOrderLabel,
  merchantCuisineLabel,
  merchantDisplayRating,
} from '@/lib/foodHub'
import { FavoriteButton } from '@/features/discovery/components/FavoriteButton'
import { cn } from '@/lib/utils'
import { MOBILE_BOTTOM_NAV_PAD } from '@/lib/mobilePublicChrome'

function isCurrentlyOpen(merchant: ApiMerchantDetail): boolean {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const hour = now.getHours() * 100 + now.getMinutes()
  const todayHours = merchant.hours.find(h => h.day === dayOfWeek)
  if (!todayHours || todayHours.is_closed) return false
  if (!todayHours.open_time || !todayHours.close_time) return true
  const [oh, om] = todayHours.open_time.split(':').map(Number)
  const [ch, cm] = todayHours.close_time.split(':').map(Number)
  return hour >= oh * 100 + om && hour < ch * 100 + cm
}

interface Props {
  merchant: ApiMerchantDetail
}

export function RestaurationDetailPage({ merchant }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const focusItemId = searchParams.get(RESTAURATION_MENU_ITEM_PARAM)?.trim() || undefined
  const [scrolled, setScrolled] = useState(false)
  const open = isCurrentlyOpen(merchant)
  const foodStatus = computeFoodStatusClient(merchant.food_is_paused, merchant.food_pause_until)
  const isAvailable = foodStatus === 'open' && open
  const rating = merchantDisplayRating(merchant)
  const prep = merchant.food_prep_minutes ?? 25
  const minOrder = merchant.food_min_order_amount
  const cover = merchant.cover_image || merchant.logo

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={cn('min-h-dvh bg-[#FAFAFA]', MOBILE_BOTTOM_NAV_PAD)}>
      {/* Header flottant mobile — maquette vue_restaurant_2 */}
      <header
        className={cn(
          'md:hidden fixed top-0 w-full z-50 flex items-center justify-between px-4 h-16 transition-all duration-300 pt-[env(safe-area-inset-top,0px)]',
          scrolled ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-100/80' : 'bg-transparent',
        )}
      >
        <button
          type="button"
          onClick={() => router.back()}
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-full shadow-sm active:scale-95 transition-transform',
            scrolled ? 'bg-slate-100' : 'bg-white/95',
          )}
          aria-label="Retour"
        >
          <ArrowLeft size={20} className="text-amber-800" />
        </button>

        {/* Logo LaPlasse affiché uniquement quand scrollé */}
        <div
          className={cn(
            'absolute left-1/2 -translate-x-1/2 flex items-center gap-2 transition-all duration-300',
            scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none',
          )}
        >
          <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
            <UtensilsCrossed size={15} className="text-amber-400" />
          </div>
          <span className="text-base font-extrabold tracking-tight text-slate-900">LaPlasse</span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-full shadow-sm',
              scrolled ? 'bg-slate-100' : 'bg-white/95',
            )}
            aria-label="Partager"
          >
            <Share2 size={18} className="text-amber-800" />
          </button>
          <FavoriteButton
            merchantId={merchant.id}
            merchantSlug={merchant.slug}
            className={cn(
              'w-10 h-10 rounded-full shadow-sm flex items-center justify-center',
              scrolled ? 'bg-slate-100' : 'bg-white/95',
            )}
            iconClassName="text-amber-800"
          />
        </div>
      </header>

      {/* Hero — maquette vue_restaurant_2 */}
      <div className="relative w-full h-[320px] md:h-[380px] md:rounded-3xl md:mx-auto md:max-w-3xl md:mt-4 overflow-hidden bg-amber-100">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={merchant.business_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-200 via-orange-100 to-amber-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-6 text-white">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className={cn(
                'px-3 py-1 rounded-full text-xs font-bold',
                isAvailable ? 'bg-emerald-500 text-white'
                : foodStatus === 'paused' ? 'bg-amber-500 text-white'
                : 'bg-slate-600 text-white',
              )}
            >
              {foodStatus === 'paused'
                ? `En pause jusqu'à ${foodPauseUntilLabel(merchant.food_pause_until)}`
                : foodStatus === 'closed'
                  ? 'Fermé temporairement'
                  : open ? 'Ouvert' : 'Fermé'}
            </span>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold">
              {merchant.category.name}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{merchant.business_name}</h1>
          <p className="text-sm text-white/80 mb-3 line-clamp-1">{merchantCuisineLabel(merchant)}</p>
          <div className="flex items-center gap-4 text-sm flex-wrap opacity-95">
            {rating && (
              <span className="inline-flex items-center gap-1 font-bold">
                <Star size={18} className="text-amber-400 fill-amber-400" />
                {rating.score}
                <span className="font-normal opacity-80">({rating.count})</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock size={18} />
              {formatFoodEtaFromDistance(prep)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Bike size={18} />
              {FOOD_HUB_DELIVERY_FEE_ESTIMATE.toLocaleString('fr-FR')} FCFA
            </span>
            {minOrder != null && minOrder > 0 && (
              <span className="inline-flex items-center gap-1 text-white/90">
                {formatFoodMinOrderLabel(minOrder)}
              </span>
            )}
            {merchant.food_accepts_cash && (
              <span className="inline-flex items-center gap-1 text-white/90 bg-white/15 px-2 py-0.5 rounded-full">
                💵 Cash accepté
              </span>
            )}
          </div>
          {merchant.location?.district && (
            <p className="mt-2 text-xs text-white/75 inline-flex items-center gap-1">
              <MapPin size={14} />
              {[merchant.location.district, merchant.location.city].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Menu — focus commande */}
      <div className="max-w-3xl mx-auto px-4 md:px-0 -mt-4 relative z-10 pb-4">
        <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.06)] border border-amber-100/50 p-4 md:p-6">
          <FoodMenuOrderPanel
            merchantSlug={merchant.slug}
            merchantName={merchant.business_name}
            variant="restauration"
            focusItemId={focusItemId}
          />
        </div>
      </div>
    </div>
  )
}
