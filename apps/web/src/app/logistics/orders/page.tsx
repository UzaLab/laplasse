'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Loader2, Package, Search } from 'lucide-react'
import { LogisticsShell } from '@/features/logistics/components/LogisticsShell'
import { useLogisticsSession } from '@/features/logistics/hooks/useLogisticsSession'
import { fetchPartnerJobsList, type PartnerDeliveryJob } from '@/lib/deliveryStakeholdersApi'
import { formatFcfa, JOB_STATUS_LABELS, JOB_STATUS_STYLES } from '@/lib/courierJobLabels'
import type { DeliveryJobStatus } from '@/lib/courierJobsApi'

const FILTERS = [
  { id: 'all', label: 'Toutes' },
  { id: 'active', label: 'En cours' },
  { id: 'DELIVERED', label: 'Livrées' },
  { id: 'FAILED', label: 'Échouées' },
  { id: 'CANCELLED', label: 'Annulées' },
] as const

function jobStatusLabel(status: string) {
  return JOB_STATUS_LABELS[status as DeliveryJobStatus] ?? status
}

function jobStatusStyle(status: string) {
  return JOB_STATUS_STYLES[status as DeliveryJobStatus] ?? 'bg-slate-100 text-slate-600'
}

function JobRow({ job }: { job: PartnerDeliveryJob }) {
  const address = job.dropoff_address ?? job.order.delivery_address ?? '—'
  const dt = job.created_at ? new Date(job.created_at).toLocaleString('fr-FR') : '—'

  return (
    <li className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 hover:border-indigo-100 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-bold text-slate-900">{job.order.shop?.name ?? 'Commerce'}</p>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${jobStatusStyle(job.status)}`}>
              {jobStatusLabel(job.status)}
            </span>
          </div>
          <p className="text-sm text-slate-600 truncate">{address}</p>
          <p className="text-xs text-slate-400 mt-1">{dt}</p>
          {job.courier_profile && (
            <p className="text-xs text-indigo-700 font-medium mt-1">
              Livreur : {job.courier_profile.user.full_name ?? 'Assigné'}
            </p>
          )}
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
          <p className="font-extrabold text-slate-900">{formatFcfa(job.order.total)}</p>
          {(job.order.delivery_fee ?? 0) > 0 && (
            <p className="text-xs text-emerald-700 font-bold">+{formatFcfa(job.order.delivery_fee!)} livr.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/logistics/orders/${job.id}`}
              className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800"
              style={{ textDecoration: 'none' }}
            >
              Détail
            </Link>
            {job.tracking_token && (
              <Link
                href={`/delivery/track/${job.tracking_token}`}
                target="_blank"
                className="text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1"
                style={{ textDecoration: 'none' }}
              >
                Suivi <ExternalLink size={12} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

export default function LogisticsOrdersPage() {
  const { ready, partner } = useLogisticsSession()
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['logistics-jobs-list', filter],
    queryFn: () => fetchPartnerJobsList({
      status: filter === 'all' ? undefined : filter,
      days: 90,
      take: 200,
    }),
    enabled: ready && partner?.verification === 'VERIFIED',
    refetchInterval: 20_000,
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return jobs
    return jobs.filter(j =>
      j.order.shop?.name?.toLowerCase().includes(q)
      || j.order.delivery_address?.toLowerCase().includes(q)
      || j.courier_profile?.user.full_name?.toLowerCase().includes(q)
      || j.id.toLowerCase().includes(q),
    )
  }, [jobs, search])

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
          Structure non vérifiée — les commandes seront visibles après validation admin.
        </div>
      </LogisticsShell>
    )
  }

  return (
    <LogisticsShell>
      <div className="w-full min-w-0 space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Commandes</h1>
          <p className="text-slate-500 mt-1">Historique et suivi des livraisons reçues (90 jours).</p>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Commerce, adresse, livreur…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-full text-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                filter === f.id ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-slate-300" size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
            <Package className="mx-auto text-slate-300 mb-3" size={32} />
            <p className="font-bold text-slate-900">Aucune commande</p>
            <p className="text-sm text-slate-500 mt-1">Les courses de vos commerces partenaires apparaîtront ici.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map(job => (
              <JobRow key={job.id} job={job} />
            ))}
          </ul>
        )}
      </div>
    </LogisticsShell>
  )
}
