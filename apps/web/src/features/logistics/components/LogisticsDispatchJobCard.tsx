'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Package,
  Phone,
  Sparkles,
  Store,
  User,
} from 'lucide-react'
import type { PartnerDeliveryJob, PartnerFleetCourier } from '@/lib/deliveryStakeholdersApi'
import { formatFcfa, JOB_STATUS_LABELS, JOB_STATUS_STYLES } from '@/lib/courierJobLabels'
import type { DeliveryJobStatus } from '@/lib/courierJobsApi'

interface LogisticsDispatchJobCardProps {
  job: PartnerDeliveryJob & {
    is_urgent?: boolean
    pending_minutes?: number
    suggested_courier_id?: string | null
    suggested_courier_name?: string | null
    suggested_couriers?: Array<{
      courier_profile_id: string
      label: string
      dispatch_score: number
    }>
  }
  fleet: PartnerFleetCourier[]
  assigning: boolean
  selectedCourierId: string
  onSelectCourier: (courierId: string) => void
  onAssign: () => void
  onAssignNearest?: () => void
  onRelease?: () => void
  releasing?: boolean
  isNew?: boolean
  isHighlighted?: boolean
}

export function LogisticsDispatchJobCard({
  job,
  fleet,
  assigning,
  selectedCourierId,
  onSelectCourier,
  onAssign,
  onAssignNearest,
  onRelease,
  releasing,
  isNew,
  isHighlighted,
}: LogisticsDispatchJobCardProps) {
  const statusLabel = JOB_STATUS_LABELS[job.status as DeliveryJobStatus] ?? job.status
  const statusStyle = JOB_STATUS_STYLES[job.status as DeliveryJobStatus] ?? 'bg-slate-100 text-slate-600'
  const address = job.dropoff_address ?? job.order.delivery_address ?? '—'
  const isPending = job.status === 'PENDING' && !job.courier_profile
  const canRelease = job.status === 'ASSIGNED' && !!job.courier_profile

  return (
    <article
      className={`bg-white rounded-[24px] border p-5 sm:p-6 shadow-sm transition-all ${
        isHighlighted
          ? 'border-indigo-400 ring-2 ring-indigo-100'
          : isNew
            ? 'border-indigo-300 ring-2 ring-indigo-100'
            : job.is_urgent && isPending
              ? 'border-red-300 ring-2 ring-red-100'
              : isPending
                ? 'border-amber-200 shadow-amber-100/50'
                : 'border-slate-100'
      }`}
    >
      {isNew && (
        <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 mb-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          Nouvelle course
        </p>
      )}

      {job.is_urgent && isPending && (
        <p className="text-[10px] font-black uppercase tracking-wider text-red-600 mb-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          Urgent · en attente {job.pending_minutes != null ? `${job.pending_minutes} min` : '>5 min'}
        </p>
      )}

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
              <Store size={18} className="text-indigo-600 shrink-0" />
              {job.order.shop?.name ?? 'Commerce'}
            </h3>
            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg ${statusStyle}`}>
              {statusLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <p className="text-slate-600 flex items-start gap-2">
              <MapPin size={15} className="text-emerald-600 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{address}</span>
            </p>
            {job.pickup_address && (
              <p className="text-slate-500 flex items-start gap-2 text-xs">
                <Package size={14} className="shrink-0 mt-0.5" />
                <span className="line-clamp-2">Retrait : {job.pickup_address}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            {job.created_at && (
              <span className="inline-flex items-center gap-1">
                <Clock size={12} />
                {new Date(job.created_at).toLocaleString('fr-FR')}
              </span>
            )}
            {job.eta_minutes != null && (
              <span className="font-bold text-indigo-700">ETA ~{job.eta_minutes} min</span>
            )}
            {job.order.customer_phone && (
              <a href={`tel:${job.order.customer_phone}`} className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <Phone size={12} /> {job.order.customer_phone}
              </a>
            )}
          </div>

          {job.courier_profile && (
            <p className="text-sm text-slate-600 flex items-center gap-2">
              <User size={15} className="text-slate-400" />
              Livreur :{' '}
              <Link
                href={`/logistics/fleet/${job.courier_profile.id}`}
                className="font-bold text-indigo-600 hover:text-indigo-700"
                style={{ textDecoration: 'none' }}
              >
                {job.courier_profile.user.full_name ?? 'Assigné'}
              </Link>
            </p>
          )}

          {isPending && job.suggested_couriers && job.suggested_couriers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {job.suggested_couriers.map(c => (
                <button
                  key={c.courier_profile_id}
                  type="button"
                  onClick={() => onSelectCourier(c.courier_profile_id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                    selectedCourierId === c.courier_profile_id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {isPending && job.suggested_courier_name && (
            <p className="text-xs text-indigo-700 font-semibold flex items-center gap-1.5">
              <Sparkles size={13} />
              Suggestion : {job.suggested_courier_name}
            </p>
          )}
        </div>

        <div className="lg:w-52 shrink-0 flex flex-col items-start lg:items-end gap-2">
          <p className="text-xl font-extrabold text-slate-900">{formatFcfa(job.order.total)}</p>
          {(job.order.delivery_fee ?? 0) > 0 && (
            <p className="text-xs font-bold text-emerald-700">+{formatFcfa(job.order.delivery_fee!)} livraison</p>
          )}
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Link
              href={`/logistics/orders/${job.id}`}
              className="text-xs font-bold px-3 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50"
              style={{ textDecoration: 'none' }}
            >
              Détail
            </Link>
            {job.tracking_token && (
              <Link
                href={`/delivery/track/${job.tracking_token}`}
                target="_blank"
                className="text-xs font-bold px-3 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center gap-1"
                style={{ textDecoration: 'none' }}
              >
                Suivi <ExternalLink size={12} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {isPending && (
        <div className="mt-5 pt-5 border-t border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Assigner à la flotte</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedCourierId}
              onChange={e => onSelectCourier(e.target.value)}
              className="flex-1 min-h-[44px] border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
            >
              <option value="">Choisir un livreur</option>
              {fleet.map(c => (
                <option key={c.id} value={c.id}>
                  {c.user.full_name ?? c.user.email}
                  {c.is_online ? ' · en ligne' : ''}
                  {c.stats_90d?.active_jobs ? ` · ${c.stats_90d.active_jobs} course(s)` : ''}
                </option>
              ))}
            </select>
            {onAssignNearest && job.suggested_courier_id && (
              <button
                type="button"
                disabled={assigning}
                onClick={onAssignNearest}
                className="min-h-[44px] px-4 py-2.5 rounded-full text-sm font-bold border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 inline-flex items-center justify-center gap-2 shrink-0"
              >
                {assigning ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Plus proche
              </button>
            )}
            <button
              type="button"
              disabled={assigning || !selectedCourierId}
              onClick={onAssign}
              className="min-h-[44px] px-5 py-2.5 rounded-full text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 inline-flex items-center justify-center gap-2 shrink-0"
            >
              {assigning ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {assigning ? 'Assignation…' : 'Assigner'}
            </button>
          </div>
          {fleet.length === 0 && (
            <p className="text-xs text-amber-700 mt-2">
              Aucun livreur actif —{' '}
              <Link href="/logistics/fleet" className="font-bold underline" style={{ textDecoration: 'none' }}>
                gérer la flotte
              </Link>
            </p>
          )}
        </div>
      )}

      {canRelease && onRelease && (
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Livreur indisponible ? Libérez la course pour la réassigner.
          </p>
          <button
            type="button"
            disabled={releasing}
            onClick={onRelease}
            className="min-h-[40px] px-4 py-2 rounded-full text-sm font-bold border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {releasing ? <Loader2 size={16} className="animate-spin" /> : null}
            Libérer & réassigner
          </button>
        </div>
      )}
    </article>
  )
}
