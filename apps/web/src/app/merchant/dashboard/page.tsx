'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Eye, MessageCircle, Star, Store, Edit, BadgeCheck,
  TrendingUp, Users, Clock, ChevronRight, Loader2, Smartphone,
  CheckCircle2, AlertCircle, PhoneCall,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useMerchant } from '@/features/discovery/hooks/useDiscovery'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { AnalyticsChart } from '@/features/merchant/components/AnalyticsChart'

type MerchantData = {
  description?: string | null
  cover_image?: string | null
  logo?: string | null
  phone?: string | null
  whatsapp?: string | null
  location?: { district?: string | null; city?: string } | null
  hours?: Array<{ is_closed: boolean }> | null
}

function computeCompleteness(m: MerchantData) {
  const items = [
    { label: 'Nom commercial',        done: true,                                       href: null },
    { label: 'Description',           done: !!m.description,                            href: '/merchant/profile/edit' },
    { label: 'Photo de cover',        done: !!m.cover_image,                            href: '/merchant/media' },
    { label: 'Logo',                  done: !!m.logo,                                   href: '/merchant/media' },
    { label: 'Téléphone / WhatsApp',  done: !!(m.phone || m.whatsapp),                  href: '/merchant/profile/edit' },
    { label: 'Zone / Quartier',       done: !!m.location?.district,                     href: '/merchant/profile/edit' },
    { label: 'Horaires',              done: (m.hours?.filter(h => !h.is_closed).length ?? 0) > 0, href: '/merchant/hours' },
  ]
  const score = Math.round((items.filter(i => i.done).length / items.length) * 100)
  return { items, score }
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNew = searchParams.get('new') === 'true'
  const { isAuthenticated, user, access_token } = useAuthStore()
  const [phoneVerified, setPhoneVerified] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isAuthenticated) router.push('/login?redirect=/merchant/dashboard')
  }, [isAuthenticated, router])

  const { data: myProfile, isLoading: loadingProfile } = useQuery<{
    id: string; slug: string; business_name: string; subscription_plan: string
  } | null>({
    queryKey: ['my-merchant-profile', user?.id],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/me/profile`, {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      if (res.status === 404 || res.status === 403) return null
      return res.ok ? res.json() : null
    },
    enabled: !!(isAuthenticated && access_token),
  })

  const slug = myProfile?.slug ?? user?.merchant?.slug
  const { data: merchant, isLoading: loadingMerchant } = useMerchant(slug ?? '')
  const isLoading = loadingProfile || loadingMerchant

  useEffect(() => {
    if (!access_token) return
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/me/verify-phone/status`, {
      headers: { Authorization: `Bearer ${access_token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPhoneVerified(d.phone_verified) })
      .catch(() => {})
  }, [access_token])

  const { data: analytics } = useQuery<{
    views: number; whatsapp_clicks: number; call_clicks: number;
    favorites: number; reviews: { count: number; avg_rating: number | null }
  }>({
    queryKey: ['merchant-analytics', user?.id],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/me/analytics`, {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      return res.ok ? res.json() : null
    },
    enabled: !!(isAuthenticated && access_token),
  })

  const { data: chartData } = useQuery<{ days: { date: string; count: number }[]; total: number }>({
    queryKey: ['merchant-analytics-chart', user?.id],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/me/analytics/chart?days=30`, {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      return res.ok ? res.json() : null
    },
    enabled: !!(isAuthenticated && access_token),
  })

  if (!isAuthenticated || !user) return null

  const hasNoMerchant = !myProfile && !user?.merchant && !isLoading

  if (hasNoMerchant) {
    return (
      <MerchantShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Store size={36} className="text-amber-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Pas encore inscrit</h1>
          <p className="text-slate-500 mb-8 max-w-sm">
            Inscrivez votre établissement pour accéder au dashboard et gérer votre présence sur LaPlasse.
          </p>
          <Link
            href="/merchant/signup"
            className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-3.5 rounded-2xl hover:bg-slate-800 transition-colors"
            style={{ textDecoration: 'none' }}
          >
            <Store size={18} /> Inscrire mon établissement
          </Link>
        </div>
      </MerchantShell>
    )
  }

  return (
    <MerchantShell
      merchantSlug={slug}
      merchantName={merchant?.business_name ?? myProfile?.business_name}
    >
      {/* Welcome banner */}
      {isNew && (
        <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-[28px] p-6 flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
            <BadgeCheck size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-emerald-900 text-lg">Établissement créé !</h3>
            <p className="text-emerald-700 text-sm mt-0.5">Notre équipe valide votre dossier sous 24–48h. Complétez votre profil pour accélérer.</p>
          </div>
        </div>
      )}

      {/* Phone verification */}
      {phoneVerified === false && (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-[28px] p-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shrink-0">
              <Smartphone size={22} className="text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-amber-900">Vérifiez votre téléphone</h3>
              <p className="text-amber-700 text-sm">Étape obligatoire pour activer votre fiche.</p>
            </div>
          </div>
          <Link
            href="/merchant/verify-phone"
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition-colors shrink-0"
            style={{ textDecoration: 'none' }}
          >
            Vérifier →
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : merchant ? (
        <>
          {/* Header carte établissement */}
          <div className="bg-slate-900 rounded-[28px] p-1 relative overflow-hidden mb-6">
            <div className="absolute top-0 right-0 w-72 h-72 bg-amber-400/15 rounded-full blur-[90px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
            <div className="bg-slate-900 rounded-[24px] p-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center text-2xl overflow-hidden shrink-0">
                  {merchant.cover_image
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={merchant.cover_image} alt="" className="w-full h-full object-cover" />
                    : '🏪'
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-extrabold text-white truncate">{merchant.business_name}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      merchant.verification_status === 'VERIFIED'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : merchant.verification_status === 'PENDING'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-slate-700 text-slate-400 border-slate-600'
                    }`}>
                      {merchant.verification_status === 'VERIFIED' ? '✓ Vérifié' :
                       merchant.verification_status === 'PENDING' ? '⏳ En attente' : 'Non vérifié'}
                    </span>
                    <span className="text-xs text-slate-500">{merchant.category.name}</span>
                  </div>
                </div>
                <Link
                  href="/merchant/profile/edit"
                  className="shrink-0 flex items-center gap-1.5 text-sm font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  <Edit size={14} /> Modifier
                </Link>
              </div>

              {/* Stats rapides */}
              <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-800">
                <Link
                  href="/merchant/analytics"
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl p-4 transition-colors block"
                  style={{ textDecoration: 'none' }}
                >
                  <p className="text-2xl font-extrabold text-white">
                    {analytics ? analytics.views : <span className="text-slate-600">—</span>}
                  </p>
                  <p className="text-slate-400 text-xs font-medium mt-0.5 flex items-center gap-1.5">
                    <Eye size={10} className="text-blue-400" /> Vues totales
                  </p>
                </Link>
                <Link
                  href="/merchant/analytics"
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl p-4 transition-colors block"
                  style={{ textDecoration: 'none' }}
                >
                  <p className="text-2xl font-extrabold text-white">
                    {analytics ? analytics.whatsapp_clicks : <span className="text-slate-600">—</span>}
                  </p>
                  <p className="text-slate-400 text-xs font-medium mt-0.5 flex items-center gap-1.5">
                    <MessageCircle size={10} className="text-emerald-400" /> Clics WhatsApp
                  </p>
                </Link>
              </div>
            </div>
          </div>

          {/* Profile Completeness */}
          {(() => {
            const { items, score } = computeCompleteness(merchant)
            if (score === 100) return null
            const missing = items.filter(i => !i.done)
            return (
              <div className="bg-white border border-slate-100 rounded-[28px] p-6 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={15} className="text-amber-500" />
                    <p className="text-sm font-extrabold text-slate-900">Complétez votre profil</p>
                  </div>
                  <span className="text-sm font-extrabold text-amber-500">{score}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                  <div
                    className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${score}%` }}
                  />
                </div>
                <div className="space-y-1.5">
                  {missing.slice(0, 4).map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-slate-200" />
                        <span className="text-xs text-slate-500">{item.label}</span>
                      </div>
                      {item.href && (
                        <Link
                          href={item.href}
                          className="text-xs font-bold text-amber-600 hover:text-amber-700"
                          style={{ textDecoration: 'none' }}
                        >
                          Ajouter →
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { icon: <Star size={18} />,  label: 'Avis reçus',  value: analytics ? analytics.reviews.count  : merchant.review_count,    color: 'amber' },
              { icon: <Users size={18} />, label: 'Favoris',      value: analytics ? analytics.favorites      : merchant.favorites_count,  color: 'rose' },
              ...(analytics?.call_clicks ? [{ icon: <PhoneCall size={18} />, label: 'Clics tél', value: analytics.call_clicks, color: 'violet' }] : []),
              ...(analytics?.reviews.avg_rating ? [{ icon: <Star size={18} />, label: 'Note moy.', value: analytics.reviews.avg_rating, color: 'orange' }] : []),
            ].map(stat => (
              <div key={stat.label} className="bg-white border border-slate-100 rounded-[28px] p-5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${
                  stat.color === 'amber'  ? 'bg-amber-50 text-amber-600' :
                  stat.color === 'rose'   ? 'bg-rose-50 text-rose-600' :
                  stat.color === 'violet' ? 'bg-violet-50 text-violet-600' :
                  'bg-orange-50 text-orange-600'
                }`}>{stat.icon}</div>
                <p className="text-2xl font-extrabold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          {chartData && chartData.days.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-[28px] p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Vues — 30 derniers jours</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    <span className="font-bold text-slate-700">{chartData.total}</span> visites au total
                  </p>
                </div>
                <Link
                  href="/merchant/analytics"
                  className="flex items-center gap-1.5 text-xs text-amber-600 font-bold bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-full transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  <TrendingUp size={11} /> Détail
                </Link>
              </div>
              <AnalyticsChart data={chartData.days} height={72} color="#f59e0b" />
            </div>
          )}

          {/* Actions rapides */}
          <div className="bg-white border border-slate-100 rounded-[28px] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900">Actions rapides</h3>
            </div>
            {[
              { href: '/merchant/profile/edit', icon: <Edit size={16} className="text-amber-500" />,    label: 'Modifier le profil',      desc: 'Nom, description, contact' },
              { href: '/merchant/hours',        icon: <Clock size={16} className="text-blue-500" />,    label: 'Gérer les horaires',      desc: 'Définir vos heures d\'ouverture' },
              { href: '/merchant/media',        icon: <Store size={16} className="text-emerald-500" />, label: 'Ajouter des photos',      desc: 'Logo, cover, galerie' },
              { href: '/merchant/analytics',    icon: <TrendingUp size={16} className="text-violet-500" />, label: 'Voir les statistiques', desc: 'Vues, clics, avis' },
              { href: '/merchant/plans',        icon: <BadgeCheck size={16} className="text-rose-500" />, label: 'Plans & abonnements',   desc: 'Booster votre visibilité' },
            ].map((action, i, arr) => (
              <Link
                key={action.href}
                href={action.href}
                className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm">{action.label}</p>
                  <p className="text-xs text-slate-400">{action.desc}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 shrink-0" />
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </MerchantShell>
  )
}

export default function MerchantDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
