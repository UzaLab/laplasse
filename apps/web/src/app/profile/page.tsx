'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Star, Store, BadgeCheck, ChevronRight, Compass, Loader2, MapPin } from 'lucide-react'
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
    { label: 'Mes favoris',    href: '/favoris',          icon: <Heart size={16} className="text-red-500" /> },
    ...(user.merchant
      ? [{ label: 'Dashboard marchand', href: '/merchant/dashboard', icon: <Store size={16} className="text-amber-500" /> }]
      : [{ label: 'Inscrire mon commerce', href: '/merchant/signup', icon: <Store size={16} className="text-slate-400" /> }]
    ),
    ...(isAdmin ? [{ label: 'Administration', href: '/admin', icon: <BadgeCheck size={16} className="text-purple-500" /> }] : []),
  ]

  return (
    <ProfileShell>

      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Bonjour, {user.full_name?.split(' ')[0] ?? 'toi'} ! 👋
        </h1>
        <p className="text-slate-400 mt-1">Bienvenue sur votre espace personnel LaPlasse.</p>
      </div>

      {/* ── Hero card dark ───────────────────────────────────── */}
      <div className="bg-slate-900 rounded-[28px] p-1 relative overflow-hidden mb-6">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-400/15 rounded-full blur-[90px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="bg-slate-900 rounded-[24px] p-6 lg:p-8 relative z-10">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-black text-amber-400 shrink-0 select-none">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-extrabold text-white truncate">{user.full_name || 'Anonyme'}</h2>
              <p className="text-slate-400 text-sm truncate mt-0.5">{user.email}</p>
              <Link
                href="/profile/settings"
                className="inline-block mt-2 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                Modifier le profil →
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-800">
            <Link
              href="/profile/reviews"
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl p-4 text-left transition-colors block"
              style={{ textDecoration: 'none' }}
            >
              <p className="text-2xl font-extrabold text-white">
                {loadingReviews ? <Loader2 size={18} className="animate-spin text-slate-500 inline" /> : reviews.length}
              </p>
              <p className="text-slate-400 text-xs font-medium mt-0.5 flex items-center gap-1.5">
                <Star size={11} className="text-amber-400 fill-amber-400" /> Avis déposés
              </p>
            </Link>
            <Link
              href="/favoris"
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl p-4 text-left transition-colors block"
              style={{ textDecoration: 'none' }}
            >
              <p className="text-2xl font-extrabold text-white">{favoritesData.length}</p>
              <p className="text-slate-400 text-xs font-medium mt-0.5 flex items-center gap-1.5">
                <Heart size={11} className="text-red-400 fill-red-400" /> Favoris
              </p>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Accès rapides ────────────────────────────────────── */}
      <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900">Accès rapides</h3>
        </div>
        {quickLinks.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors ${
              i < quickLinks.length - 1 ? 'border-b border-slate-100' : ''
            }`}
            style={{ textDecoration: 'none' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                {link.icon}
              </div>
              <span className="text-sm font-semibold text-slate-700">{link.label}</span>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </Link>
        ))}
        <Link
          href="/search"
          className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
          style={{ textDecoration: 'none' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
              <Compass size={16} className="text-slate-400" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Explorer Abidjan</span>
          </div>
          <ChevronRight size={16} className="text-slate-300" />
        </Link>
      </div>

      {/* ── Derniers avis (preview) ──────────────────────────── */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
              <Star size={15} className="text-amber-500 fill-amber-100" /> Derniers avis
            </h3>
            <Link
              href="/profile/reviews"
              className="text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors"
              style={{ textDecoration: 'none' }}
            >
              Tout voir
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {reviews.slice(0, 2).map(r => (
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
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={10} className={n <= r.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'} />
                    ))}
                  </div>
                  {r.content && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{r.content}</p>}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                  r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  r.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' :
                  'bg-amber-50 text-amber-700 border-amber-100'
                }`}>
                  {r.status === 'APPROVED' ? 'Publié' : r.status === 'REJECTED' ? 'Rejeté' : 'En attente'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

    </ProfileShell>
  )
}
