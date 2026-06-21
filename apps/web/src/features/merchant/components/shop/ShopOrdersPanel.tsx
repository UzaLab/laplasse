'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Loader2, ShoppingBag } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import {
  fetchMerchantOrders,
  formatPrice,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  updateOrderStatus,
  type Order,
  type OrderStatus,
} from '@/lib/marketplaceApi'

const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }[]>> = {
  PENDING: [{ status: 'CONFIRMED', label: 'Confirmer' }, { status: 'CANCELLED', label: 'Annuler' }],
  CONFIRMED: [{ status: 'PREPARING', label: 'En préparation' }, { status: 'CANCELLED', label: 'Annuler' }],
  PREPARING: [{ status: 'READY', label: 'Prête' }, { status: 'CANCELLED', label: 'Annuler' }],
  READY: [{ status: 'COMPLETED', label: 'Terminer' }],
}

export function ShopOrdersPanel() {
  const { activeShopId } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!activeShopId) return
    setLoading(true)
    const list = await fetchMerchantOrders(activeShopId)
    setOrders(list)
    setLoading(false)
  }, [activeShopId])

  useEffect(() => { load() }, [load])

  const handleStatus = async (orderId: string, status: OrderStatus) => {
    setProcessingId(orderId)
    await updateOrderStatus(orderId, status, activeShopId)
    await load()
    setProcessingId(null)
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-extrabold text-slate-900">Commandes</h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Suivez et mettez à jour les commandes de votre boutique.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[28px] border border-slate-100">
          <ShoppingBag size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">Aucune commande</p>
          <p className="text-sm text-slate-400 mt-1">
            Les commandes clients apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white border border-slate-100 rounded-[28px] p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/merchant/shop/orders/${order.id}`}
                    className="font-extrabold text-slate-900 hover:text-amber-600 transition-colors inline-flex items-center gap-1"
                    style={{ textDecoration: 'none' }}
                  >
                    {order.user?.full_name ?? order.user?.email ?? 'Client'}
                    <ChevronRight size={16} className="text-slate-300" />
                  </Link>
                  <p className="text-sm text-slate-500">
                    {order.user?.phone ?? order.customer_phone ?? '—'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(order.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-lg border shrink-0 ${
                    ORDER_STATUS_STYLES[order.status] ?? 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>

              <ul className="space-y-1 mb-4 text-sm text-slate-600">
                {order.items.map(item => (
                  <li key={item.id} className="flex justify-between">
                    <span>{item.quantity}× {item.product_name}</span>
                    <span className="font-semibold">{formatPrice(item.line_total)}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-3">
                <div className="text-sm text-slate-500">
                  {order.delivery_type === 'DELIVERY' ? (
                    <span>Livraison : {order.delivery_address ?? '—'}</span>
                  ) : (
                    <span>Retrait sur place</span>
                  )}
                </div>
                <span className="font-extrabold text-slate-900">
                  {formatPrice(order.total)}
                </span>
              </div>

              {NEXT_STATUS[order.status] && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <Link
                    href={`/merchant/shop/orders/${order.id}`}
                    className="text-sm font-bold px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                    style={{ textDecoration: 'none' }}
                  >
                    Voir le détail
                  </Link>
                  {NEXT_STATUS[order.status]!.map(action => (
                    <button
                      key={action.status}
                      type="button"
                      disabled={processingId === order.id}
                      onClick={() => handleStatus(order.id, action.status)}
                      className={`text-sm font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50 ${
                        action.status === 'CANCELLED'
                          ? 'text-red-600 border border-red-100 bg-red-50 hover:bg-red-100'
                          : 'text-white bg-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      {processingId === order.id ? '…' : action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
