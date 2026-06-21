import Link from 'next/link'
import type { Order } from '@/lib/marketplaceApi'
import { formatPrice, PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/marketplaceApi'
import { OrderStatusBadge } from '@/features/profile/components/orders/OrderStatusBadge'
import { OrderAgainButton } from '@/features/profile/components/orders/OrderAgainButton'
import {
  formatOrderRef,
  formatOrderTitle,
  getOrderDisplayStatus,
  orderThumbnail,
} from '@/features/profile/components/orders/orderUtils'

export function OrderListCard({ order }: { order: Order }) {
  const dt = new Date(order.created_at)
  const cancelled = getOrderDisplayStatus(order.status) === 'cancelled'
  const pendingPayment =
    order.status === 'PENDING' && order.payment?.status === 'PENDING'
  const thumb = orderThumbnail(order, PLACEHOLDER_PRODUCT_IMAGE)

  return (
    <article className="bg-white rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center gap-4 border border-slate-100 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-200/80 hover:shadow-md duration-300 group">
      <div
        className={`w-full md:w-24 h-32 md:h-24 rounded-xl bg-slate-100 overflow-hidden shrink-0 ${cancelled ? 'grayscale opacity-70' : ''}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      </div>

      <div className="flex-1 w-full min-w-0 px-0.5 md:px-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
          <span className="text-xs font-bold text-slate-400">{formatOrderRef(order.id)}</span>
          <span className="text-sm text-slate-400">
            {dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-2 line-clamp-1">
          {formatOrderTitle(order)}
        </h3>
        <p className="text-xs text-slate-400 mb-2 line-clamp-1">
          {order.merchant?.business_name ?? 'Boutique'}
        </p>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <div
          className={`text-sm font-extrabold ${cancelled ? 'text-slate-400 line-through' : 'text-slate-900'}`}
        >
          {formatPrice(order.total)}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
          href={
            pendingPayment
              ? `/checkout/payment?orderIds=${order.id}`
              : `/profile/orders/${order.id}`
          }
          className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
            pendingPayment
              ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
              : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
          }`}
          style={{ textDecoration: 'none' }}
        >
          {pendingPayment ? 'Payer' : 'Détails'}
        </Link>
        {!pendingPayment && <OrderAgainButton order={order} />}
        </div>
      </div>
    </article>
  )
}
