'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Store, Users, Star, AlertTriangle, TrendingUp,
  Check, Eye, Loader2, MessageSquare,
} from 'lucide-react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'

interface AdminStats {
  merchants: { total: number; pending: number; verified: number }
  users: number
  reviews: { total: number; pending: number }
  complaints?: { open: number }
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

export default function AdminDashboard() {
  const { ready, access_token } = useAdminSession()
  const [stats, setStats]                     = useState<AdminStats | null>(null)
  const [pendingMerchants, setPendingMerchants] = useState<PendingMerchant[]>([])
  const [recentReviews, setRecentReviews]       = useState<PendingReview[]>([])
  const [loading, setLoading]                   = useState(true)
  const [processing, setProcessing]             = useState<string | null>(null)

  const load = async () => {
    if (!access_token) return
    setLoading(true)
    const [statsData, merchantsData, reviewsData] = await Promise.all([
      adminFetch<AdminStats>('/admin/stats', access_token),
      adminFetch<PendingMerchant[]>('/admin/merchants?filter=pending&limit=5', access_token),
      adminFetch<PendingReview[]>('/admin/reviews?filter=pending', access_token),
    ])
    if (statsData)    setStats(statsData)
    if (merchantsData) setPendingMerchants(merchantsData)
    if (reviewsData)   setRecentReviews(reviewsData.slice(0, 6))
    setLoading(false)
  }

  useEffect(() => {
    if (!ready || !access_token) return
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, access_token])

  const verifyMerchant = async (id: string) => {
    if (!access_token) return
    setProcessing(id)
    await adminFetch(`/admin/merchants/${id}/verify`, access_token, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'VERIFIED', trust_score: 70 }),
    })
    await load()
    setProcessing(null)
  }

  const chartHeights = [30, 45, 35, 70, 50, 65, 85]
  const chartLabels  = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  const kpis = [
    {
      label: 'Lieux actifs',
      value: stats?.merchants.verified ?? 0,
      sub: stats?.merchants.pending ? `+${stats.merchants.pending} en attente` : null,
      subCls: 'text-amber-600',
      icon: <Store size={18} />,
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Utilisateurs',
      value: stats?.users ?? 0,
      sub: null,
      icon: <Users size={18} />,
      iconBg: 'bg-violet-50 text-violet-600',
      badge: { label: '+0 ce mois', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
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
      label: 'Signalements',
      value: stats?.complaints?.open ?? 0,
      sub: null,
      icon: <AlertTriangle size={18} />,
      iconBg: 'bg-red-50 text-red-600',
    },
  ]

  return (
    <AdminShell pageTitle="Vue d'ensemble">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-7 gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Tableau de bord</h2>
          <p className="text-slate-400 text-sm mt-0.5">Activité et modération — LaPlasse Cocody</p>
        </div>
        <select className="bg-white border border-slate-200 text-sm font-semibold text-slate-700 rounded-lg px-3 py-2 outline-none cursor-pointer">
          <option>7 derniers jours</option>
          <option>Ce mois-ci</option>
          <option>Cette année</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={24} className="animate-spin text-slate-300" />
        </div>
      ) : (
        <>
          {/* ── KPI cards ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
            {kpis.map(k => (
              <div key={k.label} className="bg-white border border-slate-100 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.iconBg}`}>
                    {k.icon}
                  </div>
                  {k.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${k.badge.cls}`}>
                      <TrendingUp size={10} />{k.badge.label}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{k.label}</p>
                <p className="text-2xl font-extrabold text-slate-900">{k.value}</p>
                {k.sub && <p className={`text-xs font-semibold mt-1 ${k.subCls}`}>{k.sub}</p>}
              </div>
            ))}
          </div>

          {/* ── Chart + Validations ───────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-7">

            {/* Bar chart */}
            <div className="xl:col-span-2 bg-white border border-slate-100 rounded-2xl p-5">
              <div className="mb-5">
                <h3 className="text-sm font-extrabold text-slate-900">Activité plateforme</h3>
                <p className="text-xs text-slate-400 mt-0.5">Marchands, avis et recherches (aperçu)</p>
              </div>
              <div className="flex items-end gap-1.5 h-32 border-b border-slate-100 pb-0.5">
                {chartHeights.map((h, i) => (
                  <div
                    key={chartLabels[i]}
                    className={`flex-1 rounded-t-sm transition-colors ${
                      i === 3 ? 'bg-brand-400' : 'bg-slate-100 hover:bg-brand-100'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {chartLabels.map(d => (
                  <span key={d} className="text-[10px] font-bold text-slate-400 flex-1 text-center">{d}</span>
                ))}
              </div>
            </div>

            {/* Pending merchants */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Validations B2B</h3>
                  {(stats?.merchants.pending ?? 0) > 0 ? (
                    <p className="text-xs text-amber-600 font-semibold mt-0.5">
                      {stats?.merchants.pending} en attente
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-0.5">Tout est à jour</p>
                  )}
                </div>
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
                        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0 text-brand-600 font-bold text-xs">
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
                className="block text-center text-xs font-bold text-brand-600 mt-3 hover:text-brand-700 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                Voir toutes les demandes →
              </Link>
            </div>
          </div>

          {/* ── Activity table ────────────────────────────────── */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">Activité récente — Modération</h3>
              <Link
                href="/admin/reviews"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                Voir tout →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <th className="px-5 py-3 border-b border-slate-100">ID / Type</th>
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
                        Aucune activité en attente
                      </td>
                    </tr>
                  ) : (
                    recentReviews.map(r => {
                      const s = STATUS_LABEL[r.status] ?? STATUS_LABEL.PENDING
                      return (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-slate-900 text-xs">#AVS-{r.id.slice(-4).toUpperCase()}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Avis · {r.rating}★</p>
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
                              className="text-slate-400 hover:text-brand-600 transition-colors inline-flex"
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

          <p className="mt-8 text-center text-xs text-slate-300">
            © 2026 LaPlasse Admin — MVP Cocody v0.5
          </p>
        </>
      )}
    </AdminShell>
  )
}
