'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { fetchOrder, formatPrice } from '@/lib/marketplaceApi'
import { formatOrderRef } from '@/features/profile/components/orders/orderUtils'

export default function OrderReceiptPage() {
  const params = useParams()
  const orderId = params.id as string
  const { ready } = useRequireAuth(`/profile/orders/${orderId}/receipt`)

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-receipt', orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: ready && !!orderId,
  })

  if (isLoading || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-300" size={28} />
      </div>
    )
  }

  const shopName =
    (order as { shop?: { name?: string } }).shop?.name
    ?? order.merchant?.business_name
    ?? 'Boutique'
  const currency = 'XOF'

  return (
    <div className="min-h-screen bg-white text-slate-900 p-8 max-w-2xl mx-auto print:p-4">
      <div className="flex justify-between items-start mb-8 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">LaPlasse</p>
          <h1 className="text-2xl font-extrabold">Reçu de commande</h1>
          <p className="text-sm text-slate-500 mt-1">{formatOrderRef(order.id)}</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="print:hidden px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold"
        >
          Imprimer / PDF
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-8">
        <div>
          <p className="text-slate-400 font-bold uppercase text-xs mb-1">Vendeur</p>
          <p className="font-bold">{shopName}</p>
        </div>
        <div>
          <p className="text-slate-400 font-bold uppercase text-xs mb-1">Date</p>
          <p>{new Date(order.created_at).toLocaleString('fr-FR')}</p>
        </div>
        <div>
          <p className="text-slate-400 font-bold uppercase text-xs mb-1">Statut</p>
          <p>{order.status}</p>
        </div>
        {order.payment?.reference && (
          <div>
            <p className="text-slate-400 font-bold uppercase text-xs mb-1">Réf. paiement</p>
            <p className="font-mono text-xs">{order.payment.reference}</p>
          </div>
        )}
      </div>

      <table className="w-full text-sm mb-8">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="py-2 font-bold">Article</th>
            <th className="py-2 font-bold text-center">Qté</th>
            <th className="py-2 font-bold text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map(item => (
            <tr key={item.id} className="border-b border-slate-100">
              <td className="py-3">
                {item.product_name}
                {item.variant_name && (
                  <span className="text-slate-400"> — {item.variant_name}</span>
                )}
              </td>
              <td className="py-3 text-center">{item.quantity}</td>
              <td className="py-3 text-right font-medium">
                {formatPrice(item.line_total, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-2 text-sm ml-auto max-w-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Sous-total</span>
          <span>{formatPrice(order.subtotal, currency)}</span>
        </div>
        {(order.discount_amount ?? 0) > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>Remise</span>
            <span>-{formatPrice(order.discount_amount ?? 0, currency)}</span>
          </div>
        )}
        {(order.delivery_fee ?? 0) > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-500">Livraison</span>
            <span>{formatPrice(order.delivery_fee ?? 0, currency)}</span>
          </div>
        )}
        <div className="flex justify-between font-extrabold text-lg pt-2 border-t border-slate-200">
          <span>Total</span>
          <span>{formatPrice(order.total, currency)}</span>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-12 text-center">
        Document généré par LaPlasse — {new Date().toLocaleDateString('fr-FR')}
      </p>
    </div>
  )
}
