'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Star, Store, BadgeCheck, ChevronRight, Compass, Loader2, MapPin, Trophy, Gift, Bell } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useQuery } from '@tanstack/react-query'
import { ProfileShell } from '@/features/profile/components/ProfileShell'

interface UserReview {
  id: string
  rating: number
  title: string | null
  content: string | null
  status: string
  created_at: string
  merchant: { business_name: string; slug: string; cover_image?: string }
}

export default function ProfilePage() {
  const router = useRouter()
  const { isAuthenticated, user, access_token } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  // ── Hooks toujours en premier ──────────────────────────────────────────────
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (mounted && !isAuthenticated) router.push('/login?redirect=/profile')
  }, [mounted, isAuthenticated, router])

  const { data: reviews = [], isLoading: loadingReviews } = useQuery<UserReview[]>({
    queryKey: ['my-reviews', user?.id],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/mine`, {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      if (!res.ok) return []
      return res.json()
    },
    enabled: !!(isAuthenticated && mounted && access_token),
  })

  const { data: favoritesData = [] } = useQuery<{ id: string }[]>({
    queryKey: ['favorites-count', user?.id],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites`, {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      if (!res.ok) return []
      return res.json()
    },
    enabled: !!(isAuthenticated && mounted && access_token),
  })

  // ── Returns conditionnels après tous les hooks ─────────────────────────────
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated || !user) return null

  // ── Helpers ────────────────────────────────────────────────────────────────
  const initials = (user.full_name ?? user.email ?? '?')
    .split(/[\s@]/).filter(Boolean).slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase()).join('')

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'

  const quickLinks = [
    { label: 'Mes favoris',       href: '/favoris',                  icon: <Heart size={16} className="text-red-500" /> },
    { label: 'Mes points fidélité',href: '/profile/loyalty',         icon: <Trophy size={16} className="text-amber-500" /> },
    { label: 'Parrainage',        href: '/profile/referral',         icon: <Gift size={16} className="text-emerald-500" /> },
    { label: 'Notifications',     href: '/profile/notifications',    icon: <Bell size={16} className="text-slate-500" /> },
    ...(user.merchant
      ? [{ label: 'Dashboard marchand', href: '/merchant/dashboard', icon: <Store size={16} className="text-amber-500" /> }]
      : [{ label: 'Inscrire mon commerce', href: '/merchant/signup', icon: <Store size={16} className="text-slate-400" /> }]
    ),
    ...(isAdmin ? [{ label: 'Administration', href: '/admin', icon: <BadgeCheck size={16} className="text-purple-500" /> }] : []),
  ]

  return (
    <ProfileShell>

      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Bonjour, {user.full_name?.split(' ')[0] ?? 'toi'} ! 👋
        </h1>
        <p className="text-slate-400 mt-1">Bienvenue sur votre espace personnel LaPlasse.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Colonne gauche ──────────────────────────────────── */}
        <div className="xl:col-span-1 space-y-6">

          {/* Hero card dark */}
          <div className="bg-slate-900 rounded-[28px] p-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/15 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
            <div className="bg-slate-900 rounded-[24px] p-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-black text-amber-400 shrink-0 select-none">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-extrabold text-white truncate">{user.full_name || 'Anonyme'}</h2>
                  <p className="text-slate-400 text-xs truncate mt-0.5">{user.email}</p>
                  <Link
                    href="/profile/settings"
                    className="inline-block mt-2 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    Modifier le profil →
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-5 pt-5 border-t border-slate-800">
                <Link href="/profile/reviews" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-3 text-left transition-colors block" style={{ textDecoration: 'none' }}>
                  <p className="text-xl font-extrabold text-white">
                    {loadingReviews ? <Loader2 size={16} className="animate-spin text-slate-500 inline" /> : reviews.length}
                  </p>
                  <p className="text-slate-400 text-[11px] font-medium mt-0.5 flex items-center gap-1">
                    <Star size={10} className="text-amber-400 fill-amber-400" /> Avis
                  </p>
                </Link>
                <Link href="/favoris" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-3 text-left transition-colors block" style={{ textDecoration: 'none' }}>
                  <p className="text-xl font-extrabold text-white">{favoritesData.length}</p>
                  <p className="text-slate-400 text-[11px] font-medium mt-0.5 flex items-center gap-1">
                    <Heart size={10} className="text-red-400 fill-red-400" /> Favoris
                  </p>
                </Link>
              </div>
            </div>
          </div>

          {/* Accès rapides */}
          <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">Accès rapides</h3>
            </div>
            {[...quickLinks, { label: 'Explorer Abidjan', href: '/search', icon: <Compass size={15} className="text-slate-400" /> }].map((link, i, arr) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">{link.icon}</div>
                  <span className="text-sm font-semibold text-slate-700">{link.label}</span>
                </div>
                <ChevronRight size={14} className="text-slate-300" />
              </Link>
            ))}
          </div>
        </div>

        {/* ── Colonne droite ──────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">

          {/* Derniers avis */}
          {reviews.length > 0 ? (
            <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
                  <Star size={15} className="text-amber-500 fill-amber-100" /> Derniers avis
                </h3>
                <Link href="/profile/reviews" className="text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors" style={{ textDecoration: 'none' }}>
                  Tout voir
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {reviews.slice(0, 3).map(r => (
                  <Link
                    key={r.id}
                    href={`/m/${r.merchant.slug}`}
                    className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      {r.merchant.cover_image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={r.merchant.cover_image} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><MapPin size={12} className="text-slate-400" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">{r.merchant.business_name}</p>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={10} className={n <= r.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'} />
                        ))}
                      </div>
                      {r.content && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{r.content}</p>}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                      r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      r.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' :
                      'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {r.status === 'APPROVED' ? 'Publié' : r.status === 'REJECTED' ? 'Rejeté' : 'Pending'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[28px] border border-slate-100 p-10 text-center">
              <Star size={32} className="mx-auto mb-3 text-slate-200" />
              <p className="font-semibold text-slate-500">Aucun avis déposé</p>
              <p className="text-sm text-slate-400 mt-1">Explorez des établissements et partagez votre expérience.</p>
              <Link href="/search" className="inline-block mt-4 px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors" style={{ textDecoration: 'none' }}>
                Explorer
              </Link>
            </div>
          )}

          {/* Grille features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { href: '/profile/loyalty',  emoji: '🏆', title: 'Mes points', sub: 'Niveaux & récompenses', color: 'from-amber-50 to-orange-50 border-amber-100' },
              { href: '/profile/referral', emoji: '🎁', title: 'Parrainage',  sub: 'Invitez vos amis',      color: 'from-emerald-50 to-teal-50 border-emerald-100' },
              { href: '/profile/notifications', emoji: '🔔', title: 'Notifications', sub: 'Vos alertes', color: 'from-slate-50 to-slate-100 border-slate-200' },
            ].map(f => (
              <Link key={f.href} href={f.href} className={`bg-gradient-to-br ${f.color} border rounded-[20px] p-5 hover:scale-[1.02] transition-transform`} style={{ textDecoration: 'none' }}>
                <div className="text-2xl mb-2">{f.emoji}</div>
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
