'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CreditCard,
  Download,
  Headphones,
  Loader2,
  MapPin,
  Package,
  ShoppingCart,
  Truck,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { ProfileShell } from '@/features/profile/components/ProfileShell'
import { OrderTimeline } from '@/features/profile/components/orders/OrderTimeline'
import { OrderStatusBadge } from '@/features/profile/components/orders/OrderStatusBadge'
import {
  formatOrderRef,
  getOrderDisplayStatus,
  ORDER_DETAIL_STATUS_LABELS,
} from '@/features/profile/components/orders/orderUtils'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import {
  fetchOrder,
  formatPrice,
  ORDER_STATUS_LABELS,
  PLACEHOLDER_PRODUCT_IMAGE,
} from '@/lib/marketplaceApi'
import { deliveryTrackingPath } from '@/lib/deliveryApi'
import { OrderAgainButton } from '@/features/profile/components/orders/OrderAgainButton'
import { OrderReturnRequestForm } from '@/features/profile/components/orders/OrderReturnRequestForm'
import { getWhatsAppUrl } from '@/lib/whatsapp'

function whatsAppSupportUrl(phone: string, message: string): string | undefined {
  const base = getWhatsAppUrl(phone)
  if (base === '#') return undefined
  return `${base}?text=${encodeURIComponent(message)}`
}

export default function ProfileOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const { ready, hydrated, isAuthenticated, user } = useRequireAuth('/profile/orders')

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['my-order', user?.id, orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: ready && !!orderId,
  })

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated || !user) return null

  if (isLoading) {
    return (
      <ProfileShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      </ProfileShell>
    )
  }

  if (isError || !order) {
    return (
      <ProfileShell>
        <div className="max-w-lg mx-auto text-center py-16">
          <Package size={32} className="text-slate-200 mx-auto mb-4" />
          <p className="font-semibold text-slate-600 mb-4">Commande introuvable</p>
          <Link
            href="/profile/orders"
            className="inline-flex items-center gap-2 text-sm font-bold text-amber-600 hover:text-amber-700"
            style={{ textDecoration: 'none' }}
          >
            <ArrowLeft size={16} />
            Retour aux commandes
          </Link>
        </div>
      </ProfileShell>
    )
  }

  const dt = new Date(order.created_at)
  const displayStatus = getOrderDisplayStatus(order.status)
  const statusDetail =
    ORDER_DETAIL_STATUS_LABELS[order.status] ?? ORDER_STATUS_LABELS[order.status]
  const merchantName = order.merchant?.business_name ?? 'Boutique'
  const supportPhone = order.merchant?.whatsapp ?? order.merchant?.phone
  const supportHref = supportPhone
    ? whatsAppSupportUrl(
        supportPhone,
        `Bonjour, j'ai une question sur ma commande ${formatOrderRef(order.id)}.`,
      )
    : undefined
  const showTrack =
    displayStatus === 'active' &&
    order.delivery_type === 'DELIVERY' &&
    !!order.delivery_job?.tracking_token
  const trackingHref = order.delivery_job?.tracking_token
    ? deliveryTrackingPath(order.delivery_job.tracking_token)
    : null
  const pendingPayment =
    order.status === 'PENDING' && order.payment?.status === 'PENDING'

  return (
    <ProfileShell>
      <div className="w-full min-w-0 space-y-6">
        {/* Breadcrumb & actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push('/profile/orders')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-amber-600 transition-colors w-fit"
          >
            <ArrowLeft size={18} />
            Retour aux commandes
          </button>
          <div className="flex flex-wrap gap-2">
            {pendingPayment && (
              <Link
                href={`/checkout/payment?orderIds=${order.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors text-sm font-bold shadow-sm"
                style={{ textDecoration: 'none' }}
              >
                <CreditCard size={16} />
                Payer maintenant
              </Link>
            )}
            {!pendingPayment && <OrderAgainButton order={order} variant="detail" />}
            <Link
              href={`/profile/orders/${order.id}/receipt`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700"
              style={{ textDecoration: 'none' }}
            >
              <Download size={16} />
              Facture
            </Link>
            {supportHref ? (
              <a
                href={supportHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700"
                style={{ textDecoration: 'none' }}
              >
                <Headphones size={16} />
                Support
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-400 cursor-not-allowed"
              >
                <Headphones size={16} />
                Support
              </button>
            )}
          </div>
        </div>

        {/* Header card */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
                Commande {formatOrderRef(order.id)}
              </h1>
              <p className="text-sm text-slate-500">
                Placée le{' '}
                {dt.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                , {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-sm font-medium text-slate-400 mt-1">{merchantName}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="px-4 py-2 bg-amber-50 text-amber-900 rounded-full text-sm font-semibold flex items-center gap-2 border border-amber-100">
                {displayStatus === 'active' && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                )}
                {statusDetail}
              </div>
              {pendingPayment && (
                <Link
                  href={`/checkout/payment?orderIds=${order.id}`}
                  className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors shadow-sm flex items-center gap-2"
                  style={{ textDecoration: 'none' }}
                >
                  <CreditCard size={16} />
                  Payer maintenant
                </Link>
              )}
              {showTrack && trackingHref && (
                <Link
                  href={trackingHref}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm"
                  style={{ textDecoration: 'none' }}
                >
                  Suivre la livraison
                </Link>
              )}
              {order.merchant?.slug && (
                <Link
                  href={`/m/${order.merchant.slug}`}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  Voir la boutique
                </Link>
              )}
            </div>
          </div>
        </div>

        <OrderReturnRequestForm order={order} />

        {/* Timeline */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900 mb-6">Suivi de commande</h2>
          <OrderTimeline status={order.status} deliveryType={order.delivery_type} />
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Items */}
          <div className="md:col-span-2 bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2">
              <ShoppingCart size={20} className="text-amber-500" />
              Articles
            </h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={item.id}>
                  {index > 0 && <hr className="border-slate-100 mb-4" />}
                  <div className="flex gap-4 p-3 sm:p-4 rounded-2xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100">
                    <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={order.merchant?.logo ?? PLACEHOLDER_PRODUCT_IMAGE}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900">{item.product_name}</h3>
                          {item.variant_name && (
                            <p className="text-xs text-slate-400 mt-1">{item.variant_name}</p>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-900 shrink-0">
                          {formatPrice(item.line_total)}
                        </p>
                      </div>
                      <p className="text-xs text-slate-400">
                        Qté : {item.quantity}
                        {item.quantity > 1 && (
                          <> ({formatPrice(item.unit_price)}/u)</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Delivery */}
            <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Truck size={16} className="text-amber-500" />
                Livraison
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Méthode</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {order.delivery_type === 'DELIVERY' ? 'Livraison à domicile' : 'Retrait sur place'}
                  </p>
                </div>
                {order.delivery_type === 'DELIVERY' && order.delivery_address && (
                  <>
                    <hr className="border-slate-100" />
                    <div>
                      <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                        <MapPin size={12} />
                        Adresse
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {user.full_name ?? 'Client'}
                      </p>
                      <p className="text-sm text-slate-500 mt-1 whitespace-pre-line">
                        {order.delivery_address}
                      </p>
                      {order.customer_phone && (
                        <p className="text-xs text-amber-700 mt-2 font-medium">
                          Tél. {order.customer_phone}
                        </p>
                      )}
                    </div>
                    {order.delivery_job && (
                      <>
                        <hr className="border-slate-100" />
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Suivi livraison</p>
                          {order.delivery_job.courier && (
                            <p className="text-sm text-slate-700">
                              Coursier : {order.delivery_job.courier.full_name}
                            </p>
                          )}
                          {trackingHref && (
                            <Link
                              href={trackingHref}
                              className="inline-block mt-2 text-sm font-bold text-amber-600 hover:text-amber-700"
                              style={{ textDecoration: 'none' }}
                            >
                              Voir le suivi en direct →
                            </Link>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
                {order.customer_note && (
                  <>
                    <hr className="border-slate-100" />
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Note</p>
                      <p className="text-sm text-slate-600">{order.customer_note}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CreditCard size={16} className="text-amber-500" />
                Paiement
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Sous-total</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <hr className="border-slate-100" />
                <div className="flex justify-between text-lg font-extrabold text-slate-900 pt-1">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
                {order.payment?.reference && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <CreditCard size={14} className="shrink-0" />
                    <span>
                      Réf. {order.payment.reference}
                      {order.payment.paid_at && (
                        <> · Payé le {new Date(order.payment.paid_at).toLocaleDateString('fr-FR')}</>
                      )}
                    </span>
                  </div>
                )}
                <div className="pt-2">
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProfileShell>
  )
}
