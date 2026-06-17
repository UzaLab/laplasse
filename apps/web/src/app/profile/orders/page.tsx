'use client'

import Link from 'next/link'
import { Loader2, Package, ShoppingBag } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { ProfileShell } from '@/features/profile/components/ProfileShell'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import {
  fetchMyOrders,
  formatPrice,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  type Order,
} from '@/lib/marketplaceApi'

export default function ProfileOrdersPage() {
  const { ready, hydrated, isAuthenticated, user } = useRequireAuth('/profile/orders')

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders', user?.id],
    queryFn: fetchMyOrders,
    enabled: ready,
  })

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated || !user) return null

  return (
    <ProfileShell>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <ShoppingBag size={24} className="text-slate-700" strokeWidth={2} />
          Mes commandes
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          {isLoading
            ? 'Chargement…'
            : orders.length === 0
              ? 'Aucune commande pour le moment.'
              : `${orders.length} commande${orders.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-[28px] border border-slate-100 p-12 text-center">
          <Package size={32} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium mb-2">Aucune commande</p>
          <p className="text-sm text-slate-400 mb-6">
            Parcourez les boutiques et passez votre première commande.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors text-sm"
            style={{ textDecoration: 'none' }}
          >
            Découvrir la marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </ProfileShell>
  )
}

function OrderCard({ order }: { order: Order }) {
  const dt = new Date(order.created_at)

  return (
    <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm hover:border-amber-200 transition-colors">
      <div className="flex justify-between items-start gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">
            {order.merchant?.business_name ?? 'Commerce'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {dt.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
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

      <ul className="space-y-2 mb-4">
        {order.items.map(item => (
          <li key={item.id} className="flex justify-between text-sm text-slate-600">
            <span>
              {item.quantity}× {item.product_name}
            </span>
            <span className="font-semibold">{formatPrice(item.line_total)}</span>
          </li>
        ))}
      </ul>

      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
        <span className="text-sm text-slate-500">
          {order.delivery_type === 'DELIVERY' ? 'Livraison' : 'Retrait sur place'}
        </span>
        <span className="text-lg font-extrabold text-slate-900">
          {formatPrice(order.total)}
        </span>
      </div>

      {order.merchant?.slug && (
        <Link
          href={`/m/${order.merchant.slug}`}
          className="inline-block mt-4 text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors"
          style={{ textDecoration: 'none' }}
        >
          Voir le commerce →
        </Link>
      )}
    </div>
  )
}
