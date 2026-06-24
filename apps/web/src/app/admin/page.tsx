'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Store, Users, Star, AlertTriangle,
  Check, Eye, Loader2, MessageSquare,
} from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import {
  AdminBarChart,
  formatChartDayLabels,
} from '@/features/admin/components/AdminMiniChart'
import { AdminModerationQueue } from '@/features/admin/components/AdminModerationQueue'
import { AdminPageContainer } from '@/features/admin/components/AdminPageContainer'

interface AdminStats {
  merchants: { total: number; pending: number; verified: number }
  users: number
  reviews: { total: number; pending: number }
  product_reviews?: { pending: number }
  courier_reviews?: { pending: number }
  couriers?: { pending_kyc: number }
  complaints?: { open: number }
}

interface GrowthSnippet {
  charts: {
    daily_users: Array<{ day: string; count: number }>
    daily_searches: Array<{ day: string; count: number }>
  }
  kpis: { new_users: number }
}

interface PendingMerchant {
  id: string
  business_name: string
  slug: string
  verification_status: string
  category: { name: string }
  location: { city: string; district: string | null } | null
}

interface PendingReview {
  id: string
  rating: number
  status: string
  created_at: string
  merchant: { business_name: string; slug: string }
  user: { full_name: string | null; email: string }
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  APPROVED: { label: 'Approuvé',   cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  REJECTED: { label: 'Rejeté',     cls: 'bg-red-50 text-red-700 border border-red-200' },
}

interface MerchantsPageResult {
  merchants: PendingMerchant[]
  total: number
  page: number
  limit: number
}

export default function AdminDashboard() {
  const { ready } = useAdminSession()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [growth, setGrowth] = useState<GrowthSnippet | null>(null)
  const [chartDays, setChartDays] = useState(7)
  const [pendingMerchants, setPendingMerchants] = useState<PendingMerchant[]>([])
  const [recentReviews, setRecentReviews] = useState<PendingReview[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const load = async () => {
    if (!ready) return
    setLoading(true)
    const [statsData, growthData, merchantsData, reviewsData] = await Promise.all([
      adminFetch<AdminStats>('/admin/stats'),
      adminFetch<GrowthSnippet>(`/admin/growth?days=${chartDays}`),
      adminFetch<MerchantsPageResult>('/admin/merchants?filter=pending&limit=5'),
      adminFetch<PendingReview[]>('/admin/reviews?filter=pending'),
    ])
    if (statsData) setStats(statsData)
    if (growthData) setGrowth(growthData)
    if (merchantsData) setPendingMerchants(merchantsData.merchants ?? [])
    if (reviewsData) setRecentReviews(Array.isArray(reviewsData) ? reviewsData.slice(0, 6) : [])
    setLoading(false)
  }

  useEffect(() => {
    if (!ready) return
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, chartDays])

  const verifyMerchant = async (id: string) => {
    if (!ready) return
    setProcessing(id)
    await adminFetch(`/admin/merchants/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'VERIFIED', trust_score: 70 }),
    })
    await load()
    setProcessing(null)
  }

  const moderationItems = useMemo(
    () => [
      {
        href: '/admin/merchants?filter=pending',
        label: 'Établissements à valider',
        count: stats?.merchants.pending ?? 0,
        icon: 'merchant' as const,
        accent: 'bg-amber-50 text-amber-600',
      },
      {
        href: '/admin/reviews',
        label: 'Avis établissements',
        count: stats?.reviews.pending ?? 0,
        icon: 'review' as const,
        accent: 'bg-blue-50 text-blue-600',
      },
      {
        href: '/admin/product-reviews',
        label: 'Avis produits',
        count: stats?.product_reviews?.pending ?? 0,
        icon: 'product' as const,
        accent: 'bg-violet-50 text-violet-600',
      },
      {
        href: '/admin/courier-reviews',
        label: 'Avis livreurs',
        count: stats?.courier_reviews?.pending ?? 0,
        icon: 'courier' as const,
        accent: 'bg-emerald-50 text-emerald-600',
      },
      {
        href: '/admin/delivery/couriers',
        label: 'KYC livreurs',
        count: stats?.couriers?.pending_kyc ?? 0,
        icon: 'kyc' as const,
        accent: 'bg-teal-50 text-teal-600',
      },
      {
        href: '/admin/complaints',
        label: 'Signalements',
        count: stats?.complaints?.open ?? 0,
        icon: 'complaint' as const,
        accent: 'bg-red-50 text-red-600',
      },
    ],
    [stats],
  )

  const chartData = formatChartDayLabels(growth?.charts.daily_searches ?? [])
  const chartLabels = chartData.map(d => d.label)

  const kpis = [
    {
      label: 'Lieux vérifiés',
      value: stats?.merchants.verified ?? 0,
      sub: stats?.merchants.pending ? `+${stats.merchants.pending} en attente` : null,
      subCls: 'text-amber-600',
      icon: <Store size={18} />,
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Utilisateurs actifs',
      value: stats?.users ?? 0,
      sub: growth ? `+${growth.kpis.new_users} sur ${chartDays}j` : null,
      subCls: 'text-violet-600',
      icon: <Users size={18} />,
      iconBg: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Avis publiés',
      value: stats?.reviews.total ?? 0,
      sub: stats?.reviews.pending ? `${stats.reviews.pending} à modérer` : null,
      subCls: 'text-amber-600',
      icon: <Star size={18} />,
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Signalements ouverts',
      value: stats?.complaints?.open ?? 0,
      sub: null,
      icon: <AlertTriangle size={18} />,
      iconBg: 'bg-red-50 text-red-600',
    },
  ]

  return (
    <AdminPageContainer>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Tableau de bord</h2>
          <p className="text-slate-400 text-sm mt-0.5">Pilotage plateforme et file de modération</p>
        </div>
        <select
          value={chartDays}
          onChange={e => setChartDays(Number(e.target.value))}
          className="bg-white border border-slate-200 text-sm font-semibold text-slate-700 rounded-xl px-3 py-2 outline-none cursor-pointer"
        >
          <option value={7}>7 derniers jours</option>
          <option value={30}>30 derniers jours</option>
          <option value={90}>90 derniers jours</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={24} className="animate-spin text-slate-300" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
            {kpis.map(k => (
              <div key={k.label} className="bg-white border border-slate-100 rounded-2xl p-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${k.iconBg}`}>
                  {k.icon}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{k.label}</p>
                <p className="text-2xl font-extrabold text-slate-900">{k.value}</p>
                {k.sub && <p className={`text-xs font-semibold mt-1 ${k.subCls}`}>{k.sub}</p>}
              </div>
            ))}
          </div>

          <div className="mb-7">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">File de modération</h3>
            <AdminModerationQueue items={moderationItems} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-7">
            <div className="xl:col-span-2 bg-white border border-slate-100 rounded-2xl p-5">
              <div className="mb-5">
                <h3 className="text-sm font-extrabold text-slate-900">Recherches plateforme</h3>
                <p className="text-xs text-slate-400 mt-0.5">{chartDays} derniers jours (données réelles)</p>
              </div>
              <AdminBarChart data={chartData} color="#7c3aed" />
              {chartLabels.length > 0 && (
                <div className="flex justify-between mt-2">
                  {chartLabels.map(d => (
                    <span key={d} className="text-[10px] font-bold text-slate-400 flex-1 text-center truncate">
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm font-extrabold text-slate-900">Validations B2B</h3>
                {(stats?.merchants.pending ?? 0) > 0 ? (
                  <p className="text-xs text-amber-600 font-semibold mt-0.5">
                    {stats?.merchants.pending} en attente
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 mt-0.5">Tout est à jour</p>
                )}
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto">
                {pendingMerchants.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">Aucune demande</p>
                ) : (
                  pendingMerchants.map(m => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0 text-violet-600 font-bold text-xs">
                          {m.business_name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{m.business_name}</p>
                          <p className="text-[10px] text-slate-400 uppercase truncate">
                            {m.category.name}{m.location?.district ? ` · ${m.location.district}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={processing === m.id}
                          onClick={() => verifyMerchant(m.id)}
                          className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors disabled:opacity-40"
                          title="Approuver"
                        >
                          {processing === m.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        </button>
                        <Link
                          href={`/m/${m.slug}`}
                          target="_blank"
                          className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
                          title="Voir fiche"
                          style={{ textDecoration: 'none' }}
                        >
                          <Eye size={12} />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Link
                href="/admin/merchants?filter=pending"
                className="block text-center text-xs font-bold text-violet-600 mt-3 hover:text-violet-700 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                Voir toutes les demandes →
              </Link>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">Avis en attente</h3>
              <Link
                href="/admin/reviews"
                className="text-xs font-bold text-violet-600 hover:text-violet-700 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                Voir tout →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <th className="px-5 py-3 border-b border-slate-100">Réf.</th>
                    <th className="px-5 py-3 border-b border-slate-100">Utilisateur</th>
                    <th className="px-5 py-3 border-b border-slate-100">Établissement</th>
                    <th className="px-5 py-3 border-b border-slate-100">Statut</th>
                    <th className="px-5 py-3 border-b border-slate-100 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-50">
                  {recentReviews.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-xs text-slate-400">
                        Aucun avis en attente
                      </td>
                    </tr>
                  ) : (
                    recentReviews.map(r => {
                      const s = STATUS_LABEL[r.status] ?? STATUS_LABEL.PENDING
                      return (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-slate-900 text-xs">#{r.id.slice(-6).toUpperCase()}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{r.rating}★</p>
                          </td>
                          <td className="px-5 py-3.5 text-xs font-medium text-slate-700">
                            {r.user.full_name ?? r.user.email.split('@')[0]}
                          </td>
                          <td className="px-5 py-3.5 text-xs font-medium text-slate-700">
                            {r.merchant.business_name}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${s.cls}`}>
                              {s.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Link
                              href="/admin/reviews"
                              className="text-slate-400 hover:text-violet-600 transition-colors inline-flex"
                              style={{ textDecoration: 'none' }}
                            >
                              <MessageSquare size={16} />
                            </Link>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminPageContainer>
  )
}
