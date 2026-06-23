'use client'

import { useQuery } from '@tanstack/react-query'
import { BarChart3, Loader2, Star, Truck, Users, Wallet } from 'lucide-react'
import { LogisticsShell } from '@/features/logistics/components/LogisticsShell'
import { useLogisticsSession } from '@/features/logistics/hooks/useLogisticsSession'
import { fetchPartnerStats } from '@/lib/deliveryStakeholdersApi'
import { formatFcfa } from '@/lib/courierJobLabels'

const GRADE_STYLES: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  B: 'bg-sky-100 text-sky-800 border-sky-200',
  C: 'bg-amber-100 text-amber-800 border-amber-200',
  D: 'bg-slate-100 text-slate-600 border-slate-200',
}

export default function LogisticsStatsPage() {
  const { ready, partner } = useLogisticsSession()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['logistics-partner-stats'],
    queryFn: fetchPartnerStats,
    enabled: ready && partner?.verification === 'VERIFIED',
    refetchInterval: 60_000,
  })

  if (!ready || !partner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-300" size={28} />
      </div>
    )
  }

  if (partner.verification !== 'VERIFIED') {
    return (
      <LogisticsShell>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm text-amber-800">
          Statistiques disponibles après validation de votre structure.
        </div>
      </LogisticsShell>
    )
  }

  return (
    <LogisticsShell>
      <div className="w-full min-w-0 space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Statistiques</h1>
          <p className="text-slate-500 mt-1">Performance globale, flotte et finances (30 jours).</p>
        </div>

        {isLoading || !stats ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-slate-300" size={28} />
          </div>
        ) : (
          <>
            <div className="bg-slate-900 text-white rounded-[28px] p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-300">Score LaPlasse</p>
                <p className="text-4xl font-black mt-1">{stats.score}<span className="text-lg text-slate-400">/100</span></p>
                <p className="text-sm text-slate-400 mt-1">Basé sur les 90 derniers jours</p>
              </div>
              <span className={`text-2xl font-black px-4 py-2 rounded-2xl border ${GRADE_STYLES[stats.grade] ?? GRADE_STYLES.C}`}>
                {stats.grade}
              </span>
            </div>

            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-3 flex items-center gap-2">
                <Truck size={16} /> Opérations
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'En cours', value: stats.jobs.active },
                  { label: 'En attente', value: stats.jobs.pending },
                  { label: 'Livrées (30j)', value: stats.jobs.delivered_30d },
                  { label: 'Échecs (30j)', value: stats.jobs.failed_30d },
                ].map(item => (
                  <div key={item.label} className="bg-white rounded-2xl border border-slate-100 p-4">
                    <p className="text-[10px] font-bold uppercase text-slate-400">{item.label}</p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-3 flex items-center gap-2">
                <Users size={16} /> Flotte
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Livreurs', value: stats.fleet.total },
                  { label: 'En ligne', value: stats.fleet.online },
                  { label: 'Contrats actifs', value: stats.fleet.active_contracts },
                ].map(item => (
                  <div key={item.label} className="bg-white rounded-2xl border border-slate-100 p-4">
                    <p className="text-[10px] font-bold uppercase text-slate-400">{item.label}</p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-3 flex items-center gap-2">
                <BarChart3 size={16} /> KPIs performance (90j)
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Livraisons OK', value: `${stats.kpis.success_rate}%` },
                  { label: 'Acceptation', value: `${stats.kpis.acceptance_rate}%` },
                  { label: 'À l\'heure', value: `${stats.kpis.on_time_rate}%` },
                  { label: 'Communes couvertes', value: String(stats.kpis.communes_covered) },
                  { label: 'Flotte en ligne', value: `${stats.kpis.fleet_availability_rate}%` },
                  { label: 'Note clients', value: stats.kpis.rating_count ? `${stats.kpis.rating_avg.toFixed(1)}/5` : '—' },
                ].map(item => (
                  <div key={item.label} className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
                    <p className="text-lg font-extrabold text-slate-900">{item.value}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-3 flex items-center gap-2">
                <Wallet size={16} /> Finances ({stats.finances.period_days} jours)
              </h2>
              <div className="bg-white rounded-[28px] border border-slate-100 p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Frais livraison collectés', value: stats.finances.delivery_fees_total, highlight: false },
                    { label: 'Versements livreurs (75 %)', value: stats.finances.courier_payouts, highlight: false },
                    { label: `Commission partenaire (${Math.round(stats.finances.commission_rate * 100)} %)`, value: stats.finances.partner_commission, highlight: true },
                    { label: 'Part plateforme', value: stats.finances.platform_share, highlight: false },
                  ].map(item => (
                    <div key={item.label} className={`rounded-2xl p-4 ${item.highlight ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50'}`}>
                      <p className="text-xs font-bold text-slate-500">{item.label}</p>
                      <p className={`text-xl font-extrabold mt-1 ${item.highlight ? 'text-indigo-700' : 'text-slate-900'}`}>
                        {formatFcfa(item.value)}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 flex items-start gap-2">
                  <Star size={14} className="shrink-0 mt-0.5" />
                  Estimations basées sur les livraisons terminées. Les versements réels peuvent varier selon les promotions.
                </p>
              </div>
            </section>
          </>
        )}
      </div>
    </LogisticsShell>
  )
}
