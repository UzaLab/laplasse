'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Copy, ExternalLink, Loader2, Truck, User } from 'lucide-react'
import {
  deliveryTrackingPath,
  dispatchDeliveryOrder,
  fetchDeliveryCouriers,
  type DeliveryJobSummary,
} from '@/lib/deliveryApi'
import { notify } from '@/lib/notify'

const JOB_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente de coursier',
  ASSIGNED: 'Coursier assigné',
  PICKED_UP: 'Colis récupéré',
  IN_TRANSIT: 'En route',
  DELIVERED: 'Livré',
  FAILED: 'Échec',
  CANCELLED: 'Annulée',
}

interface DeliveryDispatchPanelProps {
  orderId: string
  deliveryJob?: DeliveryJobSummary | null
  country?: string | null
  city?: string | null
  onDispatched: () => void
}

export function DeliveryDispatchPanel({
  orderId,
  deliveryJob,
  country,
  city,
  onDispatched,
}: DeliveryDispatchPanelProps) {
  const [couriers, setCouriers] = useState<{ id: string; full_name: string; phone: string | null; vehicle: string | null }[]>([])
  const [loadingCouriers, setLoadingCouriers] = useState(true)
  const [selectedCourier, setSelectedCourier] = useState('')
  const [dispatching, setDispatching] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoadingCouriers(true)
    fetchDeliveryCouriers(country ?? undefined, city ?? undefined)
      .then(list => {
        if (!cancelled) setCouriers(list)
      })
      .catch(() => {
        if (!cancelled) setCouriers([])
      })
      .finally(() => {
        if (!cancelled) setLoadingCouriers(false)
      })
    return () => { cancelled = true }
  }, [country, city])

  const handleDispatch = async () => {
    setDispatching(true)
    const { job, error } = await dispatchDeliveryOrder(
      orderId,
      selectedCourier || undefined,
    )
    setDispatching(false)
    if (error) {
      notify.error(error)
      return
    }
    notify.success(job?.courier ? 'Coursier assigné — livraison en cours' : 'Course créée')
    onDispatched()
  }

  const copyTrackingLink = async () => {
    if (!deliveryJob?.tracking_token) return
    const url = `${window.location.origin}${deliveryTrackingPath(deliveryJob.tracking_token)}`
    try {
      await navigator.clipboard.writeText(url)
      notify.success('Lien de suivi copié')
    } catch {
      notify.error('Impossible de copier le lien')
    }
  }

  const trackingHref = deliveryJob?.tracking_token
    ? deliveryTrackingPath(deliveryJob.tracking_token)
    : null

  return (
    <div className="mt-6 pt-6 border-t border-slate-100">
      <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
        <Truck size={16} className="text-amber-500" />
        Dispatch livraison
      </h3>

      {deliveryJob ? (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-3 text-sm">
          <p className="font-semibold text-slate-800">
            {JOB_STATUS_LABELS[deliveryJob.status] ?? deliveryJob.status}
            {deliveryJob.eta_minutes != null && (
              <span className="text-slate-500 font-normal"> · ETA ~{deliveryJob.eta_minutes} min</span>
            )}
          </p>
          {deliveryJob.courier && (
            <p className="text-slate-600 flex items-center gap-2">
              <User size={14} className="shrink-0 text-slate-400" />
              {deliveryJob.courier.full_name}
              {deliveryJob.courier.phone && ` · ${deliveryJob.courier.phone}`}
              {deliveryJob.courier.vehicle && ` · ${deliveryJob.courier.vehicle}`}
            </p>
          )}
          {trackingHref && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={trackingHref}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800"
                style={{ textDecoration: 'none' }}
              >
                <ExternalLink size={14} />
                Page de suivi client
              </Link>
              <button
                type="button"
                onClick={() => void copyTrackingLink()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-800"
              >
                <Copy size={14} />
                Copier le lien
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 p-4 space-y-3">
          {loadingCouriers ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              Chargement des coursiers…
            </div>
          ) : (
            <>
              <select
                value={selectedCourier}
                onChange={e => setSelectedCourier(e.target.value)}
                className="w-full min-h-[44px] border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white"
              >
                <option value="">Coursier (optionnel)</option>
                {couriers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                    {c.vehicle ? ` · ${c.vehicle}` : ''}
                  </option>
                ))}
              </select>
              {couriers.length === 0 && (
                <p className="text-xs text-slate-500">
                  Aucun coursier actif pour cette zone — la course sera créée sans assignation.
                </p>
              )}
              <button
                type="button"
                disabled={dispatching}
                onClick={() => void handleDispatch()}
                className="w-full min-h-[44px] text-sm font-bold px-4 py-3 rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {dispatching ? 'Envoi…' : selectedCourier ? 'Assigner et expédier' : 'Créer la course'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
