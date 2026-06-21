import { Check, Circle, Truck, X } from 'lucide-react'
import type { OrderStatus } from '@/lib/marketplaceApi'

const BASE_FLOW: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING', label: 'Commande reçue' },
  { status: 'CONFIRMED', label: 'Confirmée par la boutique' },
  { status: 'PREPARING', label: 'En préparation' },
  { status: 'READY', label: 'Prête (retrait / livraison)' },
]

const DELIVERY_EXTRA: { status: OrderStatus; label: string }[] = [
  { status: 'OUT_FOR_DELIVERY', label: 'En route vers vous' },
  { status: 'DELIVERED', label: 'Livrée' },
]

const PICKUP_END = { status: 'COMPLETED' as OrderStatus, label: 'Terminée' }

const STATUS_INDEX = (flow: { status: OrderStatus }[]) =>
  Object.fromEntries(flow.map((s, i) => [s.status, i])) as Record<OrderStatus, number>

interface Props {
  status: OrderStatus
  deliveryType?: 'PICKUP' | 'DELIVERY'
}

export function OrderTimeline({ status, deliveryType = 'PICKUP' }: Props) {
  if (status === 'CANCELLED' || status === 'REFUNDED') {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 flex items-center gap-3">
        <X size={18} className="text-red-600 shrink-0" />
        <p className="text-sm font-semibold text-red-800">
          {status === 'REFUNDED' ? 'Commande remboursée' : 'Commande annulée'}
        </p>
      </div>
    )
  }

  const isDelivery = deliveryType === 'DELIVERY'
  const flow = isDelivery
    ? [...BASE_FLOW, ...DELIVERY_EXTRA, PICKUP_END]
    : [...BASE_FLOW, PICKUP_END]

  const indexMap = STATUS_INDEX(flow)
  const currentIndex = indexMap[status] ?? 0

  return (
    <ol className="space-y-0">
      {flow.map((step, index) => {
        const done = index < currentIndex
        const active = index === currentIndex
        const upcoming = index > currentIndex
        const isDeliveryStep = step.status === 'OUT_FOR_DELIVERY' || step.status === 'DELIVERED'

        return (
          <li key={step.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
                  done
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : active
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : 'bg-white border-slate-200 text-slate-300'
                }`}
              >
                {done ? (
                  <Check size={14} strokeWidth={3} />
                ) : active && isDeliveryStep ? (
                  <Truck size={14} />
                ) : active ? (
                  <Circle size={10} fill="currentColor" />
                ) : (
                  <Circle size={8} />
                )}
              </div>
              {index < flow.length - 1 && (
                <div
                  className={`w-0.5 flex-1 min-h-[24px] my-1 ${
                    done ? 'bg-emerald-400' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
            <div className={`pb-6 ${upcoming ? 'opacity-50' : ''}`}>
              <p className={`text-sm font-bold ${active ? 'text-amber-900' : 'text-slate-900'}`}>
                {step.label}
              </p>
              {active && (
                <p className="text-xs text-amber-700 mt-0.5 font-medium">Étape en cours</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
