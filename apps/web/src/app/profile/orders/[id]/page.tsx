'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  Download,
  Headphones,
  Loader2,
  MapPin,
  Package,
  PackageX,
  Shield,
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
  resolveOrderStatus,
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
import { OrderReturnRequestForm, isOrderReturnEligible } from '@/features/profile/components/orders/OrderReturnRequestForm'
import { CourierReviewPrompt } from '@/features/profile/components/orders/CourierReviewPrompt'
import { DeliveryDisputeForm, isDeliveryDisputeEligible } from '@/features/profile/components/orders/DeliveryDisputeForm'
import { OrderDeliveryEtaBanner } from '@/features/profile/components/orders/OrderDeliveryEtaBanner'
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
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['my-order', user?.id, orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: ready && !!orderId,
    refetchInterval: (query) => {
      const o = query.state.data
      if (!o) return false
      const status = resolveOrderStatus(o)
      if (o.delivery_type !== 'DELIVERY') return false
      if (['DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'].includes(status)) return false
      if (o.delivery_job?.status === 'DELIVERED') return false
      return 12_000
    },
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
  const effectiveStatus = resolveOrderStatus(order)
  const displayStatus = getOrderDisplayStatus(effectiveStatus)
  const statusDetail =
    ORDER_DETAIL_STATUS_LABELS[effectiveStatus] ?? ORDER_STATUS_LABELS[effectiveStatus]
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
    !!order.delivery_job?.tracking_token &&
    order.delivery_job.status !== 'DELIVERED'
  const trackingHref = order.delivery_job?.tracking_token
    ? deliveryTrackingPath(order.delivery_job.tracking_token)
    : null
  const pendingPayment =
    order.status === 'PENDING' && order.payment?.status === 'PENDING'

  const subtleActionBtn =
    'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-full hover:bg-slate-50 hover:text-slate-700 transition-colors whitespace-nowrap'

  const canDispute = isDeliveryDisputeEligible(order, effectiveStatus)
  const canReturn = isOrderReturnEligible({ ...order, status: effectiveStatus })
  const showEta =
    order.delivery_type === 'DELIVERY'
    && displayStatus === 'active'
    && order.delivery_job?.status !== 'DELIVERED'

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
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {pendingPayment && (
              <Link
                href={`/checkout/payment?orderIds=${order.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors text-xs font-bold shadow-sm"
                style={{ textDecoration: 'none' }}
              >
                <CreditCard size={14} />
                Payer
              </Link>
            )}
            {!pendingPayment && <OrderAgainButton order={order} variant="detail" />}
            <Link
              href={`/profile/orders/${order.id}/receipt`}
              target="_blank"
              className={subtleActionBtn}
              style={{ textDecoration: 'none' }}
            >
              <Download size={14} />
              Facture
            </Link>
            {supportHref ? (
              <a
                href={supportHref}
                target="_blank"
                rel="noopener noreferrer"
                className={subtleActionBtn}
                style={{ textDecoration: 'none' }}
              >
                <Headphones size={14} />
                Support
              </a>
            ) : (
              <button type="button" disabled className={`${subtleActionBtn} opacity-50 cursor-not-allowed`}>
                <Headphones size={14} />
                Support
              </button>
            )}
            {canDispute && (
              <button type="button" onClick={() => setDisputeOpen(true)} className={subtleActionBtn}>
                <AlertTriangle size={14} />
                Litige
              </button>
            )}
            {canReturn && (
              <button type="button" onClick={() => setReturnOpen(true)} className={subtleActionBtn}>
                <PackageX size={14} />
                SAV
              </button>
            )}
          </div>
        </div>

        {/* Header card */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-5">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 mb-1">
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

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-900 rounded-full text-xs sm:text-sm font-semibold border border-amber-100 w-fit max-w-full">
                {displayStatus === 'active' && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                )}
                <span className="truncate">{statusDetail}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {pendingPayment && (
                  <Link
                    href={`/checkout/payment?orderIds=${order.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-amber-600 transition-colors shadow-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    <CreditCard size={15} />
                    Payer
                  </Link>
                )}
                {showTrack && trackingHref && (
                  <Link
                    href={trackingHref}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    Suivre
                  </Link>
                )}
                {order.merchant?.slug && (
                  <Link
                    href={`/m/${order.merchant.slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-50 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    Voir la boutique
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {showEta && (
          <OrderDeliveryEtaBanner orderId={order.id} enabled={showEta} />
        )}

        {(order.delivery_dispute || order.return_request) && (
          <div className="flex flex-col sm:flex-row gap-2">
            {order.delivery_dispute && (
              <DeliveryDisputeForm order={order} effectiveStatus={effectiveStatus} />
            )}
            {order.return_request && (
              <OrderReturnRequestForm order={{ ...order, status: effectiveStatus }} />
            )}
          </div>
        )}

        <CourierReviewPrompt order={order} effectiveStatus={effectiveStatus} />

        {canDispute && (
          <DeliveryDisputeForm
            order={order}
            effectiveStatus={effectiveStatus}
            dialogOnly
            open={disputeOpen}
            onOpenChange={setDisputeOpen}
          />
        )}
        {canReturn && (
          <OrderReturnRequestForm
            order={{ ...order, status: effectiveStatus }}
            dialogOnly
            open={returnOpen}
            onOpenChange={setReturnOpen}
          />
        )}

        {order.delivery_job?.delivery_code && order.delivery_job.status === 'IN_TRANSIT' && (
          <div className="rounded-3xl border border-slate-900 bg-slate-900 text-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-300 flex items-center gap-2">
                  <Shield size={14} />
                  Code de livraison
                </p>
                <p className="text-sm text-slate-300 mt-2">
                  Donnez ce code au livreur à son arrivée pour confirmer la réception.
                </p>
              </div>
              <p className="text-4xl font-black tracking-[0.35em] tabular-nums shrink-0">
                {order.delivery_job.delivery_code}
              </p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900 mb-6">Suivi de commande</h2>
          <OrderTimeline status={effectiveStatus} deliveryType={order.delivery_type} />
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
                          {!order.delivery_job.courier && order.delivery_job.courier_profile && (
                            <p className="text-sm text-slate-700">
                              Livreur : {order.delivery_job.courier_profile.user.full_name ?? 'Livreur LaPlasse'}
                              {order.delivery_job.courier_profile.rating_avg > 0 && (
                                <span className="text-amber-600 font-semibold ml-1">
                                  · {order.delivery_job.courier_profile.rating_avg.toFixed(1)}/5
                                </span>
                              )}
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
                  <OrderStatusBadge status={effectiveStatus} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProfileShell>
  )
}
