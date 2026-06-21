'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Loader2, ShoppingBag } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { matchesSearchQuery } from '@/lib/merchantListFilters'
import { FilterPill, MerchantListToolbar } from '@/features/merchant/components/MerchantListToolbar'
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

const ORDER_STATUS_FILTERS: Array<OrderStatus | 'all'> = [
  'all',
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
]

function orderSearchFields(order: Order) {
  return [
    order.id,
    order.user?.full_name,
    order.user?.email,
    order.user?.phone,
    order.customer_phone,
    order.delivery_address,
    order.delivery_district,
    order.customer_note,
    order.promotion?.code,
    order.promotion?.title,
    ...order.items.map(i => i.product_name),
    ...order.items.map(i => i.variant_name),
  ]
}

export function ShopOrdersPanel() {
  const { activeShopId } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const debouncedSearch = useDebounce(searchQuery, 250)

  const load = useCallback(async () => {
    if (!activeShopId) return
    setLoading(true)
    const list = await fetchMerchantOrders(activeShopId)
    setOrders(list)
    setLoading(false)
  }, [activeShopId])

  useEffect(() => { load() }, [load])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length }
    for (const order of orders) {
      counts[order.status] = (counts[order.status] ?? 0) + 1
    }
    return counts
  }, [orders])

  const visibleStatusFilters = useMemo(() => {
    return ORDER_STATUS_FILTERS.filter(
      s => s === 'all' || (statusCounts[s] ?? 0) > 0 || statusFilter === s,
    )
  }, [statusCounts, statusFilter])

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false
      return matchesSearchQuery(orderSearchFields(order), debouncedSearch)
    })
  }, [orders, statusFilter, debouncedSearch])

  const hasExtraFilters = statusFilter !== 'all' || searchQuery.trim().length > 0

  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
  }

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

      <MerchantListToolbar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Client, téléphone, produit, n° commande…"
        resultCount={filteredOrders.length}
        totalCount={orders.length}
        showReset={hasExtraFilters}
        onReset={resetFilters}
      >
        {visibleStatusFilters.map(status => (
          <FilterPill
            key={status}
            active={statusFilter === status}
            onClick={() => setStatusFilter(status)}
          >
            {status === 'all'
              ? `Toutes (${statusCounts.all})`
              : `${ORDER_STATUS_LABELS[status]} (${statusCounts[status] ?? 0})`}
          </FilterPill>
        ))}
      </MerchantListToolbar>

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
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[28px] border border-slate-100 px-6">
          <ShoppingBag size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">Aucun résultat</p>
          <p className="text-sm text-slate-400 mt-1">
            Modifiez la recherche ou le filtre de statut.
          </p>
          {hasExtraFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 text-sm font-bold text-amber-600 hover:text-amber-700 underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
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
