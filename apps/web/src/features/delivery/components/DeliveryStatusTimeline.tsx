'use client'

import { CheckCircle2, Circle, Package, Truck } from 'lucide-react'

const STEPS = [
  { key: 'PENDING', label: 'Commande confirmée', icon: Package },
  { key: 'ASSIGNED', label: 'Livreur assigné', icon: Truck },
  { key: 'PICKED_UP', label: 'Colis récupéré', icon: Package },
  { key: 'IN_TRANSIT', label: 'En route', icon: Truck },
  { key: 'DELIVERED', label: 'Livré', icon: CheckCircle2 },
] as const

const ORDER: Record<string, number> = {
  PENDING: 0,
  ASSIGNED: 1,
  PICKED_UP: 2,
  IN_TRANSIT: 3,
  DELIVERED: 4,
  FAILED: -1,
  CANCELLED: -1,
}

interface Props {
  status: string
}

export function DeliveryStatusTimeline({ status }: Props) {
  const current = ORDER[status] ?? 0
  const terminal = status === 'FAILED' || status === 'CANCELLED'

  if (terminal) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
        {status === 'FAILED' ? 'Livraison échouée' : 'Livraison annulée'}
      </div>
    )
  }

  return (
    <ol className="space-y-0">
      {STEPS.map((step, index) => {
        const done = current > index || (status === 'DELIVERED' && index <= 4)
        const active = current === index || (status === step.key)
        const Icon = step.icon

        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                done
                  ? 'bg-emerald-500 text-white'
                  : active
                    ? 'bg-slate-900 text-emerald-400 ring-4 ring-emerald-100'
                    : 'bg-slate-100 text-slate-400'
              }`}>
                {done ? <CheckCircle2 size={18} /> : <Icon size={16} />}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-0.5 flex-1 min-h-[24px] my-1 ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
            </div>
            <div className={`pb-5 pt-1.5 ${active ? 'font-bold text-slate-900' : done ? 'text-slate-700' : 'text-slate-400'}`}>
              {step.label}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
