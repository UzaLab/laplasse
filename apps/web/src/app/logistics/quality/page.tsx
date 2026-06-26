'use client'

import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle, CheckCircle2, Clock, Loader2, ShieldAlert, Star, UserX,
} from 'lucide-react'
import { LogisticsShell } from '@/features/logistics/components/LogisticsShell'
import { useLogisticsSession } from '@/features/logistics/hooks/useLogisticsSession'
import {
  fetchPartnerQuality,
  updateFleetCourierStatus,
  type PartnerQuality,
} from '@/lib/deliveryStakeholdersApi'
import { notify } from '@/lib/notify'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function LogisticsQualityPage() {
  const { ready, partner } = useLogisticsSession()
  const queryClient = useQueryClient()

  const { data: quality, isLoading } = useQuery({
    queryKey: ['logistics-partner-quality'],
    queryFn: fetchPartnerQuality,
    enabled: ready && partner?.verification === 'VERIFIED',
    refetchInterval: 60_000,
  })

  const suspendMutation = useMutation({
    mutationFn: (courierId: string) => updateFleetCourierStatus(courierId, 'SUSPENDED'),
    onSuccess: (result) => {
      if (result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Livreur suspendu')
      void queryClient.invalidateQueries({ queryKey: ['logistics-partner-quality'] })
      void queryClient.invalidateQueries({ queryKey: ['logistics-partner-fleet'] })
    },
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
          Qualité & incidents disponibles après validation de votre structure.
        </div>
      </LogisticsShell>
    )
  }

  return (
    <LogisticsShell>
      <div className="w-full min-w-0 space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Qualité & incidents
          </h1>
          <p className="text-slate-500 mt-1">
            Litiges clients, respect des SLA et performance de votre flotte (30 jours).
          </p>
        </div>

        {isLoading || !quality ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-slate-300" size={28} />
          </div>
        ) : (
          <>
            <SummaryCards quality={quality} />

            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400 flex items-center gap-2">
                <AlertTriangle size={16} /> Litiges actifs
              </h2>
              {quality.disputes.open.length === 0 ? (
                <EmptyCard message="Aucun litige ouvert — bravo !" />
              ) : (
                <div className="space-y-3">
                  {quality.disputes.open.map(d => (
                    <div key={d.id} className="bg-white rounded-2xl border border-red-100 p-4 lg:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900">{d.reason}</p>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {d.shop_name ?? 'Commerce'} · {d.client_name}
                            {d.courier_name ? ` · ${d.courier_name}` : ''}
                          </p>
                          {d.description && (
                            <p className="text-sm text-slate-600 mt-2">{d.description}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-2">{formatDate(d.created_at)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                          {d.job_id && (
                            <Link
                              href={`/logistics/orders/${d.job_id}`}
                              className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                              style={{ textDecoration: 'none' }}
                            >
                              Voir la course
                            </Link>
                          )}
                          {d.courier_id && d.courier_id && (
                            <Link
                              href={`/logistics/fleet/${d.courier_id}`}
                              className="text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                              style={{ textDecoration: 'none' }}
                            >
                              Fiche livreur
                            </Link>
                          )}
                        </div>
                      </div>
                      {d.proof_photo_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={d.proof_photo_url}
                          alt="Preuve livraison"
                          className="mt-3 max-h-40 rounded-xl border border-slate-100 object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400 flex items-center gap-2">
                <Clock size={16} /> Dépassements SLA livraison
              </h2>
              <div className={`rounded-2xl border p-4 lg:p-5 ${
                quality.sla.threshold_exceeded
                  ? 'bg-red-50 border-red-200'
                  : 'bg-white border-slate-100'
              }`}>
                <p className="text-sm text-slate-600">
                  Taux de dépassement sur {quality.sla.delivered_count_30d} livraisons :
                  {' '}
                  <span className={`font-black ${quality.sla.threshold_exceeded ? 'text-red-700' : 'text-slate-900'}`}>
                    {quality.sla.breach_rate_30d} %
                  </span>
                  {quality.sla.threshold_exceeded && (
                    <span className="ml-2 text-xs font-bold text-red-600 uppercase">
                      Seuil 15 % dépassé
                    </span>
                  )}
                </p>
              </div>
              {quality.sla.breaches.length === 0 ? (
                <EmptyCard message="Toutes les livraisons respectent le SLA négocié." />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase">
                          <th className="px-4 py-3 font-bold">Commerce</th>
                          <th className="px-4 py-3 font-bold">Livreur</th>
                          <th className="px-4 py-3 font-bold">SLA</th>
                          <th className="px-4 py-3 font-bold">Retard</th>
                          <th className="px-4 py-3 font-bold">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quality.sla.breaches.map(b => (
                          <tr key={b.job_id} className="border-b border-slate-50 last:border-0">
                            <td className="px-4 py-3 font-medium text-slate-900">{b.shop_name}</td>
                            <td className="px-4 py-3 text-slate-600">{b.courier_name ?? '—'}</td>
                            <td className="px-4 py-3 text-slate-600">{b.sla_minutes} min</td>
                            <td className="px-4 py-3 font-bold text-red-600">+{b.delay_minutes} min</td>
                            <td className="px-4 py-3 text-slate-500">{formatDate(b.delivered_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400 flex items-center gap-2">
                <ShieldAlert size={16} /> Livreurs à surveiller
              </h2>
              {quality.underperforming_couriers.length === 0 ? (
                <EmptyCard message="Aucun livreur sous les seuils de qualité." />
              ) : (
                <div className="space-y-3">
                  {quality.underperforming_couriers.map(c => (
                    <div
                      key={c.id}
                      className={`bg-white rounded-2xl border p-4 lg:p-5 flex flex-wrap items-center justify-between gap-3 ${
                        c.severity === 'alert' ? 'border-red-200' : 'border-amber-100'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            c.severity === 'alert'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {c.severity === 'alert' ? 'Alerte' : 'Incident'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <Star size={14} className="text-amber-400" />
                            {c.rating_avg.toFixed(1)} ({c.rating_count} avis)
                          </span>
                          <span>Annulations {c.cancellation_rate} %</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{c.issues.join(' · ')}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Link
                          href={`/logistics/fleet/${c.id}`}
                          className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                          style={{ textDecoration: 'none' }}
                        >
                          Détails
                        </Link>
                        {c.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!confirm(`Suspendre ${c.name} ?`)) return
                              suspendMutation.mutate(c.id)
                            }}
                            disabled={suspendMutation.isPending}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 inline-flex items-center gap-1"
                          >
                            <UserX size={14} /> Suspendre
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {quality.disputes.resolved.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Historique résolutions
                </h2>
                <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
                  {quality.disputes.resolved.map(d => (
                    <div key={d.id} className="px-4 py-3 lg:px-5 lg:py-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-800">{d.reason}</p>
                          <p className="text-sm text-slate-500">
                            {d.shop_name ?? 'Commerce'}
                            {d.courier_name ? ` · ${d.courier_name}` : ''}
                          </p>
                          {d.admin_note && (
                            <p className="text-xs text-slate-500 mt-1 italic">Note admin : {d.admin_note}</p>
                          )}
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                          {d.status === 'RESOLVED' ? 'Résolu' : 'Classé'}
                        </span>
                      </div>
                      {d.resolved_at && (
                        <p className="text-xs text-slate-400 mt-2">{formatDate(d.resolved_at)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </LogisticsShell>
  )
}

function SummaryCards({ quality }: { quality: PartnerQuality }) {
  const cards = [
    {
      label: 'Litiges ouverts',
      value: quality.summary.open_disputes,
      alert: quality.summary.open_disputes > 0,
      icon: AlertTriangle,
    },
    {
      label: 'SLA dépassés (30j)',
      value: `${quality.summary.sla_breach_rate_30d} %`,
      alert: quality.summary.sla_breach_alert,
      icon: Clock,
    },
    {
      label: 'Livreurs alerte',
      value: quality.summary.underperforming_couriers,
      alert: quality.summary.underperforming_couriers > 0,
      icon: ShieldAlert,
    },
    {
      label: 'Litiges résolus (30j)',
      value: quality.summary.resolved_disputes_30d,
      alert: false,
      icon: CheckCircle2,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ label, value, alert, icon: Icon }) => (
        <div
          key={label}
          className={`rounded-2xl border p-4 ${
            alert ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'
          }`}
        >
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Icon size={16} className={alert ? 'text-red-500' : ''} />
            <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
          </div>
          <p className={`text-2xl font-black ${alert ? 'text-red-700' : 'text-slate-900'}`}>
            {value}
          </p>
        </div>
      ))}
    </div>
  )
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center text-sm text-slate-500">
      {message}
    </div>
  )
}
