'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Heart, Star, Trophy, Gift, Bell, Hand, Calendar, Users,
  Loader2, MapPin, ArrowRight, Award,
} from 'lucide-react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useQuery } from '@tanstack/react-query'
import { authApiFetch } from '@/lib/authFetch'
import { ProfileShell } from '@/features/profile/components/ProfileShell'
import { BOOKING_TYPE_LABELS, type BookingType } from '@/lib/bookingConfig'

interface UserReview {
  id: string
  rating: number
  title: string | null
  content: string | null
  status: string
  created_at: string
  merchant: { business_name: string; slug: string; cover_image?: string | null }
}

interface FavMerchant {
  id: string
  business_name: string
  slug: string
  cover_image: string | null
  trust_score: number
  avg_rating: number | null
  category: { name: string; slug: string }
  location?: { city: string; district: string | null } | null
}

function formatMerchantRating(m: FavMerchant) {
  if (m.avg_rating != null) return m.avg_rating.toFixed(1)
  if (m.trust_score > 0) return (m.trust_score / 20).toFixed(1)
  return null
}

interface BookingRow {
  id: string
  booking_type: BookingType
  booked_at: string
  party_size: number
  status: string
  merchant: { business_name: string; slug: string; cover_image?: string | null }
}

interface LoyaltyData {
  account: { points: number; tier: string }
  pointsToNext: number | null
  tiers: { key: string; label: string; min: number; active: boolean }[]
}

const TIER_LABELS: Record<string, string> = {
  EXPLORER: 'Explorateur',
  LOCAL: 'Local',
  INSIDER: 'Insider',
  AMBASSADOR: 'Ambassadeur',
}

export default function ProfilePage() {
  const { ready: authReady, hydrated, isAuthenticated, user } = useRequireAuth('/profile')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const { data: reviews = [], isLoading: loadingReviews } = useQuery<UserReview[]>({
    queryKey: ['my-reviews', user?.id],
    queryFn: async () => {
      const res = await authApiFetch('/reviews/mine')
      if (!res.ok) return []
      return res.json()
    },
    enabled: authReady,
  })

  const { data: favorites = [], isLoading: loadingFavorites } = useQuery<FavMerchant[]>({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      const res = await authApiFetch('/favorites')
      if (!res.ok) return []
      const data = await res.json()
      return Array.isArray(data) ? data : []
    },
    enabled: authReady,
  })

  const { data: bookings = [] } = useQuery<BookingRow[]>({
    queryKey: ['my-bookings-dashboard'],
    queryFn: async () => {
      const res = await authApiFetch('/bookings/mine?tab=upcoming&limit=20')
      if (!res.ok) return []
      const data = await res.json()
      return Array.isArray(data) ? data : (data.items ?? [])
    },
    enabled: authReady,
  })

  const { data: loyalty } = useQuery<LoyaltyData>({
    queryKey: ['loyalty-account'],
    queryFn: async () => {
      const res = await authApiFetch('/loyalty/my')
      if (!res.ok) return null
      return res.json()
    },
    enabled: authReady,
  })

  if (!mounted || !hydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated || !user) return null

  const firstName = user.full_name?.split(' ')[0] ?? 'toi'
  const nextBooking = bookings.find(
    b => ['PENDING', 'CONFIRMED'].includes(b.status) && new Date(b.booked_at) >= new Date(),
  )
  const points = loyalty?.account.points ?? 0
  const tierLabel = TIER_LABELS[loyalty?.account.tier ?? 'EXPLORER'] ?? 'Explorateur'
  const nextTier = loyalty?.tiers?.find(t => !t.active && t.min > points)
  const ptsToNext = loyalty?.pointsToNext

  const formatBookingWhen = (iso: string) => {
    const d = new Date(iso)
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const isTomorrow = d.toDateString() === tomorrow.toDateString()
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    if (isToday) return `Aujourd'hui, à ${time}`
    if (isTomorrow) return `Demain, à ${time}`
    return `${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}, à ${time}`
  }

  return (
    <ProfileShell>
      <div className="w-full min-w-0">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Bonjour, {firstName} !{' '}
            <Hand size={24} className="inline text-slate-400 -mt-1" strokeWidth={1.75} />
          </h1>
          <p className="text-slate-500 mt-2 text-base">
            Ravi de vous revoir. Voici un résumé de vos activités récentes.
          </p>
        </div>

        {/* Row 1 — Réservation + Fidélité */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
          <div className="lg:col-span-2 bg-slate-900 text-white rounded-[32px] p-1 relative overflow-hidden shadow-xl shadow-slate-900/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="bg-slate-900 rounded-[28px] p-6 lg:p-8 h-full relative z-10 flex flex-col sm:flex-row gap-6 items-center">
              {nextBooking ? (
                <>
                  <div className="w-full sm:w-1/3 aspect-[4/3] sm:aspect-square rounded-2xl overflow-hidden shrink-0 shadow-lg relative bg-slate-800">
                    {nextBooking.merchant.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={nextBooking.merchant.cover_image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin size={32} className="text-slate-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 w-full">
                    <span className="inline-flex items-center gap-1.5 bg-amber-500 text-slate-900 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
                      <span className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
                      Prochaine réservation
                    </span>
                    <h3 className="text-2xl font-extrabold text-white mb-2 leading-tight">
                      {nextBooking.merchant.business_name}
                    </h3>
                    <div className="space-y-2 mb-6">
                      <p className="text-slate-300 flex items-center gap-2 text-sm font-medium">
                        <Calendar size={16} className="text-amber-400 shrink-0" />
                        {formatBookingWhen(nextBooking.booked_at)}
                      </p>
                      <p className="text-slate-300 flex items-center gap-2 text-sm font-medium">
                        <Users size={16} className="text-amber-400 shrink-0" />
                        {nextBooking.party_size} personne{nextBooking.party_size > 1 ? 's' : ''} ·{' '}
                        {BOOKING_TYPE_LABELS[nextBooking.booking_type]}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/m/${nextBooking.merchant.slug}`}
                        className="bg-white text-slate-900 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors"
                        style={{ textDecoration: 'none' }}
                      >
                        Voir l&apos;établissement
                      </Link>
                      <Link
                        href="/profile/bookings"
                        className="bg-white/10 text-white border border-white/20 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-white/20 transition-colors"
                        style={{ textDecoration: 'none' }}
                      >
                        Mes réservations
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full py-4 text-center sm:text-left">
                  <span className="inline-flex items-center gap-1.5 bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
                    <Calendar size={12} /> Réservations
                  </span>
                  <h3 className="text-xl font-extrabold text-white mb-2">Aucune réservation à venir</h3>
                  <p className="text-slate-400 text-sm mb-6">Explorez Abidjan et réservez votre prochaine sortie.</p>
                  <Link
                    href="/search"
                    className="inline-block bg-amber-500 text-slate-900 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-400 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    Explorer
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Fidélité */}
          <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <Award size={24} />
                </div>
                <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold">
                  LaPlasse Club
                </span>
              </div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Points fidélité</p>
              <div className="flex items-baseline gap-2 mb-2">
                <h3 className="text-4xl font-extrabold text-slate-900">{points.toLocaleString('fr-FR')}</h3>
                <span className="text-sm font-bold text-slate-400">pts</span>
              </div>
              <p className="text-sm text-slate-500 font-medium">
                Statut <span className="font-bold text-slate-900">{tierLabel}</span>
                {ptsToNext != null && nextTier && (
                  <> — {ptsToNext} pts avant <span className="font-bold text-slate-900">{nextTier.label}</span></>
                )}
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100">
              <Link
                href="/profile/loyalty"
                className="w-full flex items-center justify-between text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors group"
                style={{ textDecoration: 'none' }}
              >
                Voir mes récompenses
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Row 2 — Avis + Favoris */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-10 min-w-0">
          {/* Derniers avis */}
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Star size={20} className="text-amber-500 fill-amber-100" /> Mes avis récents
              </h3>
              <Link href="/profile/reviews" className="text-sm font-bold text-amber-600 hover:text-amber-700" style={{ textDecoration: 'none' }}>
                Tout voir
              </Link>
            </div>
            <div className="p-4 space-y-3 flex-1">
              {loadingReviews ? (
                <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-slate-300" /></div>
              ) : reviews.length === 0 ? (
                <div className="py-8 text-center">
                  <Star size={28} className="mx-auto mb-2 text-slate-200" />
                  <p className="text-sm text-slate-500">Aucun avis pour le moment</p>
                </div>
              ) : (
                reviews.slice(0, 2).map(r => (
                  <Link
                    key={r.id}
                    href={`/m/${r.merchant.slug}`}
                    className="block bg-slate-50 border border-slate-100 p-4 rounded-2xl hover:border-amber-200 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shrink-0 shadow-sm">
                          {r.merchant.cover_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.merchant.cover_image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100">
                              <MapPin size={14} className="text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{r.merchant.business_name}</h4>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {[1, 2, 3, 4, 5].map(n => (
                              <Star key={n} size={10} className={n <= r.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {r.status === 'APPROVED' ? 'Publié' : 'En modération'}
                      </span>
                    </div>
                    {r.content && <p className="text-xs text-slate-500 line-clamp-2">{r.content}</p>}
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Favoris */}
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col min-w-0">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Heart size={20} className="text-red-500 fill-red-100" /> Lieux favoris
              </h3>
              <Link href="/favoris" className="text-sm font-bold text-amber-600 hover:text-amber-700" style={{ textDecoration: 'none' }}>
                Gérer
              </Link>
            </div>
            <div className="p-6 min-w-0">
              {loadingFavorites ? (
                <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-slate-300" /></div>
              ) : favorites.length === 0 ? (
                <div className="py-6 text-center">
                  <Heart size={28} className="mx-auto mb-2 text-slate-200" />
                  <p className="text-sm text-slate-500 mb-4">Aucun favori enregistré</p>
                  <Link
                    href="/search"
                    className="inline-block w-full py-3 rounded-xl border-2 border-slate-100 text-slate-600 font-bold text-sm hover:border-slate-200 hover:bg-slate-50 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    Découvrir de nouveaux lieux
                  </Link>
                </div>
              ) : (
                <>
                  <div className="-mx-6 px-6 flex gap-4 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
                    {favorites.slice(0, 6).map(m => {
                      const rating = formatMerchantRating(m)
                      return (
                        <Link
                          key={m.id}
                          href={`/m/${m.slug}`}
                          className="w-[160px] shrink-0 snap-start group"
                          style={{ textDecoration: 'none' }}
                        >
                          <div className="aspect-[4/5] rounded-2xl overflow-hidden relative mb-3 shadow-sm border border-slate-100 group-hover:border-amber-300 transition-colors bg-slate-100">
                            {m.cover_image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={m.cover_image}
                                alt={m.business_name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <MapPin size={24} className="text-slate-300" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-red-500">
                              <Heart size={14} className="fill-current" />
                            </div>
                            {m.category?.name && (
                              <div className="absolute bottom-2 left-2 right-2">
                                <span className="bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-lg truncate block">
                                  {m.category.name}
                                </span>
                              </div>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm truncate">{m.business_name}</h4>
                          {(rating || m.location?.district) && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                              {rating && (
                                <>
                                  <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />
                                  <span>{rating}</span>
                                </>
                              )}
                              {rating && m.location?.district && (
                                <span className="text-slate-300">·</span>
                              )}
                              {m.location?.district && (
                                <span className="truncate">{m.location.district}</span>
                              )}
                            </p>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                  <Link
                    href="/search"
                    className="block w-full py-3 rounded-xl border-2 border-slate-100 text-slate-600 font-bold text-sm hover:border-slate-200 hover:bg-slate-50 transition-colors text-center mt-4"
                    style={{ textDecoration: 'none' }}
                  >
                    Découvrir de nouveaux lieux
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions rapides — bas de page */}
        <div className="border-t border-slate-200 pt-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Actions rapides</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { href: '/profile/loyalty', Icon: Trophy, title: 'Mes points', sub: 'Niveaux & récompenses' },
              { href: '/profile/referral', Icon: Gift, title: 'Parrainage', sub: 'Invitez vos amis' },
              { href: '/profile/notifications', Icon: Bell, title: 'Notifications', sub: 'Vos alertes' },
            ].map(f => (
              <Link
                key={f.href}
                href={f.href}
                className="bg-white border border-slate-200 rounded-[20px] p-5 hover:border-amber-200 hover:shadow-md transition-all group"
                style={{ textDecoration: 'none' }}
              >
                <f.Icon size={22} strokeWidth={1.75} className="text-slate-600 group-hover:text-amber-600 mb-2 transition-colors" />
                <p className="font-extrabold text-slate-900 text-sm">{f.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{f.sub}</p>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </ProfileShell>
  )
}
