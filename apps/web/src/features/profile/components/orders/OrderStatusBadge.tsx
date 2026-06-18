import { CheckCircle2, XCircle } from 'lucide-react'
import type { OrderStatus } from '@/lib/marketplaceApi'
import {
  getOrderDisplayStatus,
  ORDER_DISPLAY_LABELS,
} from '@/features/profile/components/orders/orderUtils'

const BADGE_STYLES: Record<string, string> = {
  active: 'bg-amber-50 text-amber-800 border-amber-100',
  delivered: 'bg-sky-50 text-sky-800 border-sky-100',
  cancelled: 'bg-red-50 text-red-700 border-red-100',
  other: 'bg-slate-50 text-slate-600 border-slate-200',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const display = getOrderDisplayStatus(status)
  const label = ORDER_DISPLAY_LABELS[display]

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${BADGE_STYLES[display]}`}
    >
      {display === 'active' && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
      )}
      {display === 'delivered' && <CheckCircle2 size={13} className="shrink-0" />}
      {display === 'cancelled' && <XCircle size={13} className="shrink-0" />}
      {label}
    </span>
  )
}
