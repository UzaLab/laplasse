'use client'

import { useQuery } from '@tanstack/react-query'
import { Clock, Loader2 } from 'lucide-react'
import { fetchMerchantOrderEta, fetchOrderEta, type OrderEtaSnapshot } from '@/lib/marketplaceApi'

interface OrderDeliveryEtaBannerProps {
  orderId: string
  enabled: boolean
  variant?: 'client' | 'merchant'
  shopId?: string | null
  showPrepOnly?: boolean
}

export function OrderDeliveryEtaBanner({
  orderId,
  enabled,
  variant = 'client',
  shopId,
  showPrepOnly = false,
}: OrderDeliveryEtaBannerProps) {
  const { data: eta, isLoading } = useQuery({
    queryKey: ['order-eta', variant, orderId, shopId],
    queryFn: () =>
      variant === 'merchant'
        ? fetchMerchantOrderEta(orderId, shopId)
        : fetchOrderEta(orderId),
    enabled,
    refetchInterval: 8_000,
  })

  if (!enabled || isLoading || !eta) return null

  return <EtaContent eta={eta} showPrepOnly={showPrepOnly} variant={variant} />
}

function EtaContent({
  eta,
  showPrepOnly,
  variant,
}: {
  eta: OrderEtaSnapshot
  showPrepOnly?: boolean
  variant: 'client' | 'merchant'
}) {
  const arrivalTime = eta.eta_arrival_at
    ? new Date(eta.eta_arrival_at).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  if (showPrepOnly && eta.prep_remaining_minutes <= 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-bold">Préparation en retard</p>
        <p className="text-amber-800 mt-0.5">Le délai estimé est dépassé — marquez la commande prête dès que possible.</p>
      </div>
    )
  }

  if (showPrepOnly && eta.prep_remaining_minutes > 0) {
    return (
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Préparation</p>
          <p className="text-lg font-black text-indigo-900 tabular-nums">
            ~{eta.prep_remaining_minutes} min restantes
          </p>
        </div>
        <Clock size={28} className="text-indigo-300 shrink-0" />
      </div>
    )
  }

  if (!eta.eta_minutes && !eta.prep_remaining_minutes) return null

  return (
    <div className={`rounded-2xl border px-4 py-3 flex flex-wrap items-center gap-3 ${
      variant === 'merchant' ? 'border-slate-200 bg-slate-50' : 'border-emerald-100 bg-emerald-50'
    }`}>
      <Clock size={20} className={variant === 'merchant' ? 'text-slate-400' : 'text-emerald-600'} />
      <div className="min-w-0">
        {eta.prep_remaining_minutes > 0 && (
          <p className="text-sm font-semibold text-slate-800">
            Préparation · ~{eta.prep_remaining_minutes} min restantes
          </p>
        )}
        {eta.eta_minutes > 0 && (
          <p className={`text-sm ${eta.prep_remaining_minutes > 0 ? 'text-slate-500 mt-0.5' : 'font-semibold text-slate-800'}`}>
            {eta.prep_remaining_minutes > 0 ? 'Arrivée estimée' : 'Livraison estimée'}
            {' '}
            {arrivalTime ? `vers ${arrivalTime}` : `dans ~${eta.eta_minutes} min`}
          </p>
        )}
      </div>
    </div>
  )
}

export function OrderDeliveryEtaBannerSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 flex items-center gap-2 text-slate-400 text-sm">
      <Loader2 size={16} className="animate-spin" />
      Calcul de l&apos;horaire…
    </div>
  )
}
