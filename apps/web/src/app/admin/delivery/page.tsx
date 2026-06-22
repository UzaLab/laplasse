'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, Truck, MapPin, AlertCircle } from 'lucide-react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { SUPPORTED_COUNTRIES, getCountryLabel } from '@/lib/country'
import { SearchParamsWrapper } from '@/components/SearchParamsWrapper'

interface DeliveryStats {
  country: string
  period_days: number
  jobs_by_status: Array<{ status: string; count: number }>
  couriers_active: number
  zones_active: number
  deliveries_last_30d: number
  uncovered_communes: Array<{ city: string; commune: string; commune_id: string }>
  uncovered_total: number
  communes_total: number
  communes_covered: number
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  ASSIGNED: 'Assignée',
  PICKED_UP: 'Récupérée',
  IN_TRANSIT: 'En route',
  DELIVERED: 'Livrée',
  FAILED: 'Échec',
  CANCELLED: 'Annulée',
}

function AdminDeliveryPageContent() {
  const { ready } = useAdminSession()
  const searchParams = useSearchParams()
  const [country, setCountry] = useState(() => searchParams.get('country')?.toUpperCase() ?? 'CI')
  const [data, setData] = useState<DeliveryStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return
    setLoading(true)
    adminFetch<DeliveryStats>(`/admin/delivery/stats?country=${country}`).then(res => {
      if (res) setData(res)
      setLoading(false)
    })
  }, [ready, country])

  const coveragePct = data && data.communes_total > 0
    ? Math.round((data.communes_covered / data.communes_total) * 100)
    : 0

  return (
    <AdminShell pageTitle="Livraison">
      <div className="max-w-5xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Truck className="text-brand-500" /> Ops livraison
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Statistiques zones, coursiers et communes non couvertes (30 derniers jours).
            </p>
          </div>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium bg-white"
          >
            {SUPPORTED_COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{getCountryLabel(c.code)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-slate-300" size={28} />
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Livraisons (30j)', value: data.deliveries_last_30d },
                { label: 'Coursiers actifs', value: data.couriers_active },
                { label: 'Zones actives', value: data.zones_active },
                { label: 'Couverture communes', value: `${coveragePct}%` },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-2xl border border-slate-100 p-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{card.label}</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">{card.value}</p>
                </div>
              ))}
            </div>

            <section className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="font-bold text-slate-900 mb-4">Courses par statut</h2>
              {data.jobs_by_status.length === 0 ? (
                <p className="text-sm text-slate-400">Aucune course sur la période.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {data.jobs_by_status.map(row => (
                    <div key={row.status} className="bg-slate-50 rounded-xl px-4 py-3">
                      <p className="text-xs text-slate-500">{STATUS_LABELS[row.status] ?? row.status}</p>
                      <p className="text-lg font-bold text-slate-900">{row.count}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={18} className="text-amber-500" />
                <h2 className="font-bold text-slate-900">
                  Communes non couvertes
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    ({data.uncovered_total} / {data.communes_total})
                  </span>
                </h2>
              </div>
              {data.uncovered_total === 0 ? (
                <p className="text-sm text-emerald-600 font-medium">Toutes les communes actives sont couvertes par au moins une zone.</p>
              ) : (
                <>
                  <div className="flex items-start gap-2 mb-4 p-3 bg-amber-50 rounded-xl text-sm text-amber-800">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p>
                      Ces communes n&apos;apparaissent dans aucune zone de livraison active.
                      Les clients ne pourront pas choisir la livraison vers ces quartiers.
                    </p>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                    {data.uncovered_communes.map(c => (
                      <li key={c.commune_id} className="text-sm px-3 py-2 rounded-lg bg-slate-50">
                        <span className="font-medium text-slate-800">{c.commune}</span>
                        <span className="text-slate-400"> — {c.city}</span>
                      </li>
                    ))}
                  </ul>
                  {data.uncovered_total > data.uncovered_communes.length && (
                    <p className="text-xs text-slate-400 mt-3">
                      Affichage limité à {data.uncovered_communes.length} sur {data.uncovered_total}.
                    </p>
                  )}
                </>
              )}
            </section>
          </>
        ) : (
          <p className="text-sm text-slate-400">Impossible de charger les statistiques.</p>
        )}
      </div>
    </AdminShell>
  )
}

export default function AdminDeliveryPage() {
  return (
    <SearchParamsWrapper fallback={<div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>}>
      <AdminDeliveryPageContent />
    </SearchParamsWrapper>
  )
}
