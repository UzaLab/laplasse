'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  ArrowLeft,
  ChevronDown,
  CreditCard,
  ExternalLink,
  Loader2,
  MapPin,
  Package,
  RotateCcw,
  ShoppingCart,
  Tag,
  Truck,
  User,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { getShopRoutesFromPathname } from '@/lib/shopApi'
import { OrderTimeline } from '@/features/profile/components/orders/OrderTimeline'
import { OrderStatusBadge } from '@/features/profile/components/orders/OrderStatusBadge'
import {
  formatOrderRef,
  getOrderDisplayStatus,
  ORDER_DETAIL_STATUS_LABELS,
} from '@/features/profile/components/orders/orderUtils'
import {
  fetchMerchantOrder,
  formatPrice,
  ORDER_STATUS_LABELS,
  PLACEHOLDER_PRODUCT_IMAGE,
  updateOrderStatus,
  type OrderStatus,
} from '@/lib/marketplaceApi'
import { DeliveryDispatchPanel } from '@/features/merchant/components/shop/DeliveryDispatchPanel'
import { OrderDeliveryEtaBanner } from '@/features/profile/components/orders/OrderDeliveryEtaBanner'
import { notify } from '@/lib/notify'

const MERCHANT_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PENDING', 'PREPARING', 'CANCELLED', 'REFUNDED'],
  PREPARING: ['CONFIRMED', 'READY', 'CANCELLED', 'REFUNDED'],
  READY: ['PREPARING', 'COMPLETED', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['READY', 'DELIVERED', 'COMPLETED'],
  DELIVERED: ['OUT_FOR_DELIVERY', 'COMPLETED'],
  COMPLETED: ['READY', 'REFUNDED'],
  CANCELLED: ['PENDING'],
  REFUNDED: [],
}

const ROLLBACK: Partial<Record<OrderStatus, OrderStatus>> = {
  CONFIRMED: 'PENDING',
  PREPARING: 'CONFIRMED',
  READY: 'PREPARING',
  OUT_FOR_DELIVERY: 'READY',
  DELIVERED: 'OUT_FOR_DELIVERY',
  COMPLETED: 'READY',
}

const FORWARD_LABELS: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: 'Confirmer',
  PREPARING: 'En préparation',
  READY: 'Marquer prête',
  OUT_FOR_DELIVERY: 'Expédier (livraison)',
  DELIVERED: 'Marquer livrée',
  COMPLETED: 'Terminer',
  CANCELLED: 'Annuler',
  REFUNDED: 'Rembourser',
  PENDING: 'Réouvrir',
}

interface ShopOrderDetailPanelProps {
  orderId: string
}

export function ShopOrderDetailPanel({ orderId }: ShopOrderDetailPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const routes = getShopRoutesFromPathname(pathname)
  const { activeShopId } = useAuthStore()
  const [processing, setProcessing] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('')

  const { data: order, isLoading, isError, refetch } = useQuery({
    queryKey: ['merchant-order', activeShopId, orderId],
    queryFn: () => fetchMerchantOrder(orderId, activeShopId),
    enabled: !!activeShopId && !!orderId,
  })

  const allowedTargets = useMemo(() => {
    if (!order) return []
    let targets = MERCHANT_TRANSITIONS[order.status] ?? []
    if (order.delivery_type !== 'DELIVERY') {
      targets = targets.filter(s => s !== 'OUT_FOR_DELIVERY' && s !== 'DELIVERED')
    }
    return targets
  }, [order])

  const rollbackTarget = order ? ROLLBACK[order.status] : null

  const handleStatus = async (status: OrderStatus) => {
    if (!activeShopId) return
    setProcessing(true)
    const { error } = await updateOrderStatus(orderId, status, activeShopId)
    setProcessing(false)
    if (error) {
      notify.error(error)
      return
    }
    notify.success(`Statut : ${ORDER_STATUS_LABELS[status]}`)
    setSelectedStatus('')
    void refetch()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <Package size={32} className="text-slate-200 mx-auto mb-4" />
        <p className="font-semibold text-slate-600 mb-4">Commande introuvable</p>
        <Link
          href={routes.orders}
          className="inline-flex items-center gap-2 text-sm font-bold text-amber-600 hover:text-amber-700"
          style={{ textDecoration: 'none' }}
        >
          <ArrowLeft size={16} />
          Retour aux commandes
        </Link>
      </div>
    )
  }

  const dt = new Date(order.created_at)
  const displayStatus = getOrderDisplayStatus(order.status)
  const statusDetail =
    ORDER_DETAIL_STATUS_LABELS[order.status] ?? ORDER_STATUS_LABELS[order.status]
  const clientName = order.user?.full_name ?? order.user?.email ?? 'Client'
  const merchantSlug = order.merchant?.slug

  return (
    <div className="w-full min-w-0 space-y-6">
      <button
        type="button"
        onClick={() => router.push(routes.orders)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-amber-600 transition-colors"
      >
        <ArrowLeft size={18} />
        Retour aux commandes
      </button>

      <div className="relative overflow-hidden bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1">
              Commande {formatOrderRef(order.id)}
            </h1>
            <p className="text-sm text-slate-500">
              Reçue le{' '}
              {dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              , {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            {order.payment?.reference && (
              <p className="text-xs text-slate-400 mt-1 font-mono">Paiement {order.payment.reference}</p>
            )}
          </div>
          <div className="w-full sm:w-auto px-4 py-2 bg-amber-50 text-amber-900 rounded-full text-sm font-semibold flex items-center justify-center sm:justify-start gap-2 border border-amber-100 shrink-0">
            {displayStatus === 'active' && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            )}
            {statusDetail}
          </div>
        </div>
      </div>

      {(order.status === 'PREPARING' || (
        order.delivery_type === 'DELIVERY'
        && ['CONFIRMED', 'READY', 'OUT_FOR_DELIVERY'].includes(order.status)
      )) && (
        <OrderDeliveryEtaBanner
          orderId={order.id}
          enabled
          variant="merchant"
          shopId={activeShopId}
          showPrepOnly={order.status === 'PREPARING'}
        />
      )}

      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-extrabold text-slate-900 mb-6">Suivi & gestion</h2>
        <OrderTimeline status={order.status} deliveryType={order.delivery_type} />

        {allowedTargets.length === 0 && (
          <p className="mt-4 text-sm text-slate-500 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
            Commande en lecture seule — consultez le détail ci-dessous. Aucune action disponible pour ce statut.
          </p>
        )}

        {order.delivery_type === 'DELIVERY' && activeShopId && (
          <DeliveryDispatchPanel
            orderId={order.id}
            shopId={activeShopId}
            deliveryJob={order.delivery_job}
            onDispatched={() => void refetch()}
          />
        )}

        <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
          {allowedTargets.length > 0 && (
            <div
              className={`grid w-full gap-2 ${
                allowedTargets.length === 1
                  ? 'grid-cols-1'
                  : allowedTargets.length === 2
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {allowedTargets.map(target => (
                <button
                  key={target}
                  type="button"
                  disabled={processing}
                  onClick={() => handleStatus(target)}
                  className={`w-full min-h-[44px] text-sm font-bold px-4 py-3 rounded-xl transition-colors disabled:opacity-50 ${
                    target === 'CANCELLED'
                      ? 'text-red-600 border border-red-100 bg-red-50 hover:bg-red-100'
                      : 'text-white bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  {FORWARD_LABELS[target] ?? ORDER_STATUS_LABELS[target]}
                </button>
              ))}
            </div>
          )}

          {rollbackTarget && (
            <button
              type="button"
              disabled={processing}
              onClick={() => handleStatus(rollbackTarget)}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 text-sm font-bold text-slate-600 border border-slate-200 px-4 py-3 rounded-xl hover:bg-slate-50 disabled:opacity-50"
            >
              <RotateCcw size={16} className="shrink-0" />
              <span className="text-center">Revenir à « {ORDER_STATUS_LABELS[rollbackTarget]} »</span>
            </button>
          )}

          {allowedTargets.length > 1 && (
            <div className="w-full rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Changer le statut
              </p>
              <div className="flex flex-col sm:flex-row sm:items-stretch gap-2 w-full">
                <div className="relative flex-1 min-w-0">
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value as OrderStatus | '')}
                    className="w-full min-h-[44px] appearance-none border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium bg-white"
                  >
                    <option value="">Sélectionner…</option>
                    {allowedTargets.map(s => (
                      <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
                <button
                  type="button"
                  disabled={!selectedStatus || processing}
                  onClick={() => selectedStatus && handleStatus(selectedStatus)}
                  className="w-full sm:w-auto sm:min-w-[8.5rem] shrink-0 min-h-[44px] text-sm font-bold px-5 py-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40"
                >
                  Appliquer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2">
            <ShoppingCart size={20} className="text-amber-500" />
            Articles ({order.items.length})
          </h2>
          <div className="space-y-4">
            {order.items.map((item, index) => {
              const image = item.product?.image_url ?? order.merchant?.logo ?? PLACEHOLDER_PRODUCT_IMAGE
              const productHref =
                merchantSlug && item.product?.slug
                  ? `/m/${merchantSlug}/p/${item.product.slug}`
                  : null

              return (
                <div key={item.id}>
                  {index > 0 && <hr className="border-slate-100 mb-4" />}
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 flex justify-between gap-4">
                      <div>
                        {productHref ? (
                          <Link
                            href={productHref}
                            target="_blank"
                            className="text-sm font-bold text-slate-900 hover:text-amber-600 inline-flex items-center gap-1"
                            style={{ textDecoration: 'none' }}
                          >
                            {item.product_name}
                            <ExternalLink size={12} className="text-slate-400" />
                          </Link>
                        ) : (
                          <h3 className="text-sm font-bold text-slate-900">{item.product_name}</h3>
                        )}
                        {item.variant_name && (
                          <p className="text-xs text-slate-400 mt-1">{item.variant_name}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          Qté {item.quantity} · {formatPrice(item.unit_price)}/u
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-900 shrink-0">
                        {formatPrice(item.line_total)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User size={16} className="text-amber-500" />
              Client
            </h3>
            <p className="text-sm font-semibold text-slate-900">{clientName}</p>
            <p className="text-sm text-slate-500 mt-1">{order.user?.email ?? '—'}</p>
            <p className="text-sm text-slate-500 mt-1">
              {order.user?.phone ?? order.customer_phone ?? '—'}
            </p>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Truck size={16} className="text-amber-500" />
              Livraison
            </h3>
            <p className="text-sm font-semibold text-slate-900">
              {order.delivery_type === 'DELIVERY' ? 'Livraison à domicile' : 'Retrait sur place'}
            </p>
            {order.delivery_type === 'DELIVERY' && (
              <div className="mt-4 space-y-3 text-sm">
                {order.delivery_city && (
                  <div>
                    <p className="text-xs text-slate-400">Ville</p>
                    <p className="font-medium text-slate-800">{order.delivery_city.name}</p>
                  </div>
                )}
                {order.delivery_commune && (
                  <div>
                    <p className="text-xs text-slate-400">Commune</p>
                    <p className="font-medium text-slate-800">{order.delivery_commune.name}</p>
                  </div>
                )}
                {order.delivery_district && (
                  <div>
                    <p className="text-xs text-slate-400">Quartier</p>
                    <p className="font-medium text-slate-800">{order.delivery_district}</p>
                  </div>
                )}
                {order.delivery_address && (
                  <div>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={12} /> Adresse complète
                    </p>
                    <p className="text-slate-600 whitespace-pre-line">{order.delivery_address}</p>
                  </div>
                )}
                {order.customer_phone && (
                  <p className="text-xs text-amber-700 font-medium">Tél. livraison : {order.customer_phone}</p>
                )}
              </div>
            )}
            {order.customer_note && (
              <p className="text-sm text-slate-500 mt-3 pt-3 border-t border-slate-100">
                Note client : {order.customer_note}
              </p>
            )}
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-amber-500" />
              Paiement
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Sous-total</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {(order.discount_amount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span className="flex items-center gap-1">
                    <Tag size={12} /> Remise
                    {order.promotion?.code && (
                      <span className="font-mono text-xs">({order.promotion.code})</span>
                    )}
                  </span>
                  <span>−{formatPrice(order.discount_amount!)}</span>
                </div>
              )}
              {(order.delivery_fee ?? 0) > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Frais livraison</span>
                  <span>{formatPrice(order.delivery_fee!)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              {order.payment?.paid_at && (
                <p className="text-xs text-slate-400 pt-1">
                  Payé le {new Date(order.payment.paid_at).toLocaleString('fr-FR')}
                </p>
              )}
              <div className="pt-2">
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
