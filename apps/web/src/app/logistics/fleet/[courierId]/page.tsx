'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  MapPin,
  Star,
  Truck,
  Wallet,
} from 'lucide-react'
import { LogisticsShell } from '@/features/logistics/components/LogisticsShell'
import { useLogisticsSession } from '@/features/logistics/hooks/useLogisticsSession'
import { fetchPartnerCourierDetail } from '@/lib/deliveryStakeholdersApi'
import { formatFcfa, JOB_STATUS_LABELS, JOB_STATUS_STYLES } from '@/lib/courierJobLabels'
import { vehicleLabel } from '@/lib/courierLabels'
import type { DeliveryJobStatus } from '@/lib/courierJobsApi'

export default function LogisticsCourierDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courierId = params.courierId as string
  const { ready, partner } = useLogisticsSession()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['logistics-courier', courierId],
    queryFn: () => fetchPartnerCourierDetail(courierId),
    enabled: ready && !!courierId,
  })

  if (!ready || !partner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-300" size={28} />
      </div>
    )
  }

  if (isLoading) {
    return (
      <LogisticsShell>
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-slate-300" size={28} />
        </div>
      </LogisticsShell>
    )
  }

  if (isError || !data) {
    return (
      <LogisticsShell>
        <div className="text-center py-16">
          <p className="font-bold text-slate-700 mb-4">Livreur introuvable</p>
          <Link href="/logistics/fleet" className="text-sm font-bold text-indigo-600" style={{ textDecoration: 'none' }}>
            ← Retour à la flotte
          </Link>
        </div>
      </LogisticsShell>
    )
  }

  const { profile, user, kpis, job_history, wallet_entries, zones } = data

  return (
    <LogisticsShell>
      <div className="w-full min-w-0 space-y-6">
        <button
          type="button"
          onClick={() => router.push('/logistics/fleet')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft size={16} /> Flotte
        </button>

        <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{user.full_name ?? user.email}</h1>
              <p className="text-sm text-slate-500 mt-1">{user.email}</p>
              <p className="text-sm text-slate-500">{profile.phone}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${profile.is_online ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {profile.is_online ? 'En ligne' : 'Hors ligne'}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-800">
                {profile.status}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600">
            <span className="flex items-center gap-1"><MapPin size={14} /> {profile.city}</span>
            {profile.vehicle && (
              <span className="flex items-center gap-1"><Truck size={14} /> {vehicleLabel(profile.vehicle)}</span>
            )}
            {profile.rating_count > 0 && (
              <span className="flex items-center gap-1 text-amber-600 font-bold">
                <Star size={14} className="fill-amber-400" /> {profile.rating_avg.toFixed(1)} ({profile.rating_count})
              </span>
            )}
          </div>
        </div>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-3">KPIs ({kpis.period_days} jours)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { label: 'Courses', value: kpis.total_jobs },
              { label: 'Livrées', value: kpis.delivered_jobs },
              { label: 'Taux succès', value: `${kpis.success_rate}%` },
              { label: 'À l\'heure', value: `${kpis.on_time_rate}%` },
              { label: 'En cours', value: kpis.active_jobs },
              { label: 'Gains 30j', value: formatFcfa(kpis.earnings_30d) },
              { label: 'Gains 90j', value: formatFcfa(kpis.earnings_90d) },
              { label: 'Solde wallet', value: formatFcfa(kpis.wallet_balance) },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-2xl border border-slate-100 p-4">
                <p className="text-[10px] font-bold uppercase text-slate-400">{item.label}</p>
                <p className="text-lg font-extrabold text-slate-900 mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        {zones.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-3">Zones de service</h2>
            <ul className="space-y-2 text-sm">
              {zones.map((z, i) => (
                <li key={i} className="text-slate-700">
                  <span className="font-bold">{z.city}</span>
                  <span className="text-slate-500"> — {z.communes}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-3 flex items-center gap-2">
            <Wallet size={16} /> Mouvements wallet
          </h2>
          {wallet_entries.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun mouvement enregistré.</p>
          ) : (
            <ul className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
              {wallet_entries.map(entry => (
                <li key={entry.id} className="px-4 py-3 flex justify-between gap-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">{entry.label ?? entry.type}</p>
                    <p className="text-xs text-slate-400">{new Date(entry.created_at).toLocaleString('fr-FR')}</p>
                  </div>
                  <p className={`font-extrabold shrink-0 ${entry.amount >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {entry.amount >= 0 ? '+' : ''}{formatFcfa(entry.amount)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-3">Historique courses</h2>
          {job_history.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune course sur la période.</p>
          ) : (
            <ul className="space-y-2">
              {job_history.map(job => (
                <li key={job.id} className="bg-white rounded-xl border border-slate-100 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm">{job.order.shop.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {job.dropoff_address ?? job.order.delivery_address ?? '—'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(job.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${JOB_STATUS_STYLES[job.status as DeliveryJobStatus] ?? 'bg-slate-100'}`}>
                      {JOB_STATUS_LABELS[job.status as DeliveryJobStatus] ?? job.status}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{formatFcfa(job.order.delivery_fee)}</span>
                    {job.tracking_token && (
                      <Link
                        href={`/delivery/track/${job.tracking_token}`}
                        target="_blank"
                        className="text-indigo-600"
                        aria-label="Suivi"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </LogisticsShell>
  )
}
