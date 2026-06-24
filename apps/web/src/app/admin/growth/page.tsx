'use client'

import { useEffect, useState } from 'react'
import { Users, Store, Search, Star, BadgeCheck, TrendingUp, Loader2, RefreshCw } from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { AdminMiniChart } from '@/features/admin/components/AdminMiniChart'
import { AdminPageContainer } from '@/features/admin/components/AdminPageContainer'

interface GrowthKpis {
  period_days: number
  kpis: {
    new_users: number
    new_merchants: number
    total_searches: number
    new_reviews: number
    active_merchants: number
    verified_merchants: number
  }
  charts: {
    daily_users: Array<{ day: string; count: number }>
    daily_searches: Array<{ day: string; count: number }>
  }
}

const KPI_CARDS = [
  { key: 'new_users', label: 'Nouveaux utilisateurs', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'new_merchants', label: 'Nouveaux établissements', icon: Store, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'total_searches', label: 'Recherches', icon: Search, color: 'text-violet-600', bg: 'bg-violet-50' },
  { key: 'new_reviews', label: 'Avis approuvés', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'active_merchants', label: 'Marchands actifs (total)', icon: TrendingUp, color: 'text-slate-600', bg: 'bg-slate-50' },
  { key: 'verified_merchants', label: 'Marchands vérifiés (total)', icon: BadgeCheck, color: 'text-teal-600', bg: 'bg-teal-50' },
] as const

export default function AdminGrowthPage() {
  const { ready } = useAdminSession()
  const [data, setData] = useState<GrowthKpis | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [recalculating, setRecalculating] = useState(false)

  useEffect(() => {
    if (!ready) return
    fetchGrowth()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, ready])

  const fetchGrowth = async () => {
    if (!ready) return
    setLoading(true)
    const result = await adminFetch<GrowthKpis>(`/admin/growth?days=${days}`)
    if (result) setData(result)
    setLoading(false)
  }

  const handleRecalculateTrust = async () => {
    if (!ready) return
    setRecalculating(true)
    await adminFetch('/admin/trust-score/recalculate-all', { method: 'POST' })
    setRecalculating(false)
  }

  return (
    <AdminPageContainer>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Growth Dashboard</h2>
          <p className="text-slate-400 text-sm mt-0.5">KPIs acquisition, rétention & activité</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                  days === d ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {d}j
              </button>
            ))}
          </div>

          {/* Recalculate trust scores */}
          <button
            onClick={handleRecalculateTrust}
            disabled={recalculating}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 font-semibold text-sm rounded-xl hover:border-slate-300 transition-colors disabled:opacity-50"
            title="Recalculer tous les Trust Scores"
          >
            {recalculating
              ? <Loader2 size={14} className="animate-spin" />
              : <RefreshCw size={14} />
            }
            Trust Scores
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {KPI_CARDS.map(({ key, label, icon: Icon, color, bg }) => (
              <div key={key} className="bg-white border border-slate-100 rounded-2xl p-5">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={18} className={color} />
                </div>
                <p className="text-3xl font-extrabold text-slate-900">
                  {(data.kpis[key] as number).toLocaleString('fr-FR')}
                </p>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  {label}
                  {['new_users', 'new_merchants', 'total_searches', 'new_reviews'].includes(key)
                    ? ` (${days} derniers jours)` : ''}
                </p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inscriptions / jour */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Nouvelles inscriptions</h3>
                  <p className="text-xs text-slate-400">Utilisateurs/jour — {days} derniers jours</p>
                </div>
                <Users size={16} className="text-blue-400" />
              </div>
              <AdminMiniChart data={data.charts.daily_users} color="#3b82f6" />
              {data.charts.daily_users.length > 0 && (
                <div className="flex justify-between text-[10px] text-slate-300 mt-2">
                  <span>{new Date(data.charts.daily_users[0]?.day).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                  <span>{new Date(data.charts.daily_users[data.charts.daily_users.length - 1]?.day).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                </div>
              )}
            </div>

            {/* Recherches / jour */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Recherches</h3>
                  <p className="text-xs text-slate-400">Requêtes/jour — {days} derniers jours</p>
                </div>
                <Search size={16} className="text-violet-400" />
              </div>
              <AdminMiniChart data={data.charts.daily_searches} color="#8b5cf6" />
              {data.charts.daily_searches.length > 0 && (
                <div className="flex justify-between text-[10px] text-slate-300 mt-2">
                  <span>{new Date(data.charts.daily_searches[0]?.day).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                  <span>{new Date(data.charts.daily_searches[data.charts.daily_searches.length - 1]?.day).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Taux vérification */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6">
            <h3 className="font-extrabold text-slate-900 text-sm mb-4">Taux de vérification marchands</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${data.kpis.active_merchants > 0 ? (data.kpis.verified_merchants / data.kpis.active_merchants) * 100 : 0}%` }}
                />
              </div>
              <span className="text-sm font-extrabold text-slate-900 shrink-0">
                {data.kpis.active_merchants > 0
                  ? Math.round((data.kpis.verified_merchants / data.kpis.active_merchants) * 100)
                  : 0}%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {data.kpis.verified_merchants} vérifiés sur {data.kpis.active_merchants} actifs
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-24 text-slate-400">Erreur de chargement</div>
      )}
    </AdminPageContainer>
  )
}
