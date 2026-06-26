import Link from 'next/link'
import type { Order } from '@/lib/marketplaceApi'
import { formatPrice, PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/marketplaceApi'
import { OrderStatusBadge } from '@/features/profile/components/orders/OrderStatusBadge'
import { OrderAgainButton } from '@/features/profile/components/orders/OrderAgainButton'
import {
  formatOrderRef,
  formatOrderTitle,
  getOrderDisplayStatus,
  resolveOrderStatus,
} from '@/features/profile/components/orders/orderUtils'
import {
  getOrderSellerHref,
  getOrderSellerName,
  orderDisplayThumbnail,
} from '@/features/profile/components/orders/orderSellerUtils'

export function OrderListCard({ order }: { order: Order }) {
  const dt = new Date(order.created_at)
  const effectiveStatus = resolveOrderStatus(order)
  const cancelled = getOrderDisplayStatus(effectiveStatus) === 'cancelled'
  const pendingPayment =
    order.status === 'PENDING' && order.payment?.status === 'PENDING'
  const thumb = orderDisplayThumbnail(order, PLACEHOLDER_PRODUCT_IMAGE)
  const sellerName = getOrderSellerName(order)
  const sellerHref = getOrderSellerHref(order)

  return (
    <article className="bg-white rounded-2xl p-4 flex flex-col gap-3 border border-slate-100 shadow-sm transition-all hover:border-amber-200/80 hover:shadow-md duration-300 group sm:flex-row sm:items-center sm:gap-4">
      <div className="flex gap-3 sm:contents min-w-0">
        <div
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-100 overflow-hidden shrink-0 ${cancelled ? 'grayscale opacity-70' : ''}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
            <span className="text-xs font-bold text-slate-400">{formatOrderRef(order.id)}</span>
            <span className="text-xs text-slate-400">
              {dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-2">
            {formatOrderTitle(order)}
          </h3>
          {sellerHref ? (
            <Link
              href={sellerHref}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 line-clamp-1 block mb-2"
              style={{ textDecoration: 'none' }}
            >
              {sellerName}
            </Link>
          ) : (
            <p className="text-xs text-slate-500 mb-2 line-clamp-1">{sellerName}</p>
          )}
          <OrderStatusBadge status={effectiveStatus} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:shrink-0 border-t border-slate-50 pt-3 sm:border-0 sm:pt-0">
        <div
          className={`text-base font-extrabold ${cancelled ? 'text-slate-400 line-through' : 'text-slate-900'}`}
        >
          {formatPrice(order.total)}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={
              pendingPayment
                ? `/checkout/payment?orderIds=${order.id}`
                : `/profile/orders/${order.id}`
            }
            className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${
              pendingPayment
                ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
            }`}
            style={{ textDecoration: 'none' }}
          >
            {pendingPayment ? 'Payer' : 'Détails'}
          </Link>
          {!pendingPayment && effectiveStatus === 'COMPLETED' && (
            <OrderAgainButton order={{ ...order, status: effectiveStatus }} />
          )}
        </div>
      </div>
    </article>
  )
}
