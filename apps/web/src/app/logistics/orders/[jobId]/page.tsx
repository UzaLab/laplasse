'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  MapPin,
  Package,
  Phone,
  Store,
  Truck,
} from 'lucide-react'
import { LogisticsShell } from '@/features/logistics/components/LogisticsShell'
import { useLogisticsSession } from '@/features/logistics/hooks/useLogisticsSession'
import { DeliveryStatusTimeline } from '@/features/delivery/components/DeliveryStatusTimeline'
import { fetchPartnerJob } from '@/lib/deliveryStakeholdersApi'
import { formatFcfa, JOB_STATUS_LABELS, JOB_STATUS_STYLES } from '@/lib/courierJobLabels'
import type { DeliveryJobStatus } from '@/lib/courierJobsApi'
import { vehicleLabel } from '@/lib/courierLabels'

export default function LogisticsOrderDetailPage() {
  const params = useParams()
  const jobId = params.jobId as string
  const { ready, partner } = useLogisticsSession()

  const { data: job, isLoading, isError } = useQuery({
    queryKey: ['logistics-job', jobId],
    queryFn: () => fetchPartnerJob(jobId),
    enabled: ready && !!jobId,
    refetchInterval: 15_000,
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

  if (isError || !job) {
    return (
      <LogisticsShell>
        <div className="text-center py-16">
          <p className="font-bold text-slate-700 mb-4">Commande introuvable</p>
          <Link href="/logistics/orders" className="text-sm font-bold text-indigo-600" style={{ textDecoration: 'none' }}>
            ← Retour aux commandes
          </Link>
        </div>
      </LogisticsShell>
    )
  }

  const statusLabel = JOB_STATUS_LABELS[job.status as DeliveryJobStatus] ?? job.status
  const statusStyle = JOB_STATUS_STYLES[job.status as DeliveryJobStatus] ?? 'bg-slate-100 text-slate-600'

  return (
    <LogisticsShell>
      <div className="w-full min-w-0 max-w-3xl mx-auto space-y-6">
        <Link
          href="/logistics/orders"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600"
          style={{ textDecoration: 'none' }}
        >
          <ArrowLeft size={16} /> Commandes
        </Link>

        <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Store size={20} className="text-indigo-600" />
                {job.order.shop?.name ?? 'Commerce'}
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-mono">#{job.id.slice(-8)}</p>
            </div>
            <span className={`text-xs font-bold uppercase px-3 py-1 rounded-lg ${statusStyle}`}>
              {statusLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Total commande</p>
              <p className="font-extrabold text-slate-900">{formatFcfa(job.order.total)}</p>
            </div>
            {(job.order.delivery_fee ?? 0) > 0 && (
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Frais livraison</p>
                <p className="font-extrabold text-emerald-700">{formatFcfa(job.order.delivery_fee!)}</p>
              </div>
            )}
          </div>

          {job.tracking_token && (
            <Link
              href={`/delivery/track/${job.tracking_token}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 mb-6"
              style={{ textDecoration: 'none' }}
            >
              <Truck size={16} /> Ouvrir le suivi en direct
              <ExternalLink size={14} />
            </Link>
          )}

          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Progression</h2>
          <DeliveryStatusTimeline status={job.status} />
        </div>

        <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Adresses</h2>
          {job.pickup_address && (
            <div className="flex gap-3">
              <Package size={18} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Retrait</p>
                <p className="text-sm text-slate-700">{job.pickup_address}</p>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <MapPin size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Livraison</p>
              <p className="text-sm text-slate-700">
                {job.dropoff_address ?? job.order.delivery_address ?? '—'}
              </p>
            </div>
          </div>
          {job.order.customer_phone && (
            <a
              href={`tel:${job.order.customer_phone}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700"
            >
              <Phone size={16} /> {job.order.customer_phone}
            </a>
          )}
        </div>

        {job.courier_profile && (
          <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Livreur assigné</h2>
            <p className="font-bold text-slate-900">{job.courier_profile.user.full_name ?? '—'}</p>
            {job.courier_profile.phone && (
              <p className="text-sm text-slate-500 mt-1">{job.courier_profile.phone}</p>
            )}
            {job.courier_profile.vehicle && (
              <p className="text-sm text-slate-500">{vehicleLabel(job.courier_profile.vehicle)}</p>
            )}
            <Link
              href={`/logistics/fleet/${job.courier_profile.id}`}
              className="inline-block mt-3 text-sm font-bold text-indigo-600"
              style={{ textDecoration: 'none' }}
            >
              Voir la fiche livreur →
            </Link>
          </div>
        )}

        {job.created_at && (
          <p className="text-xs text-slate-400 text-center">
            Créée le {new Date(job.created_at).toLocaleString('fr-FR')}
            {job.delivered_at && ` · Livrée le ${new Date(job.delivered_at).toLocaleString('fr-FR')}`}
          </p>
        )}
      </div>
    </LogisticsShell>
  )
}
