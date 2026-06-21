import { Lock } from 'lucide-react'
import {
  formatPrice,
  PLACEHOLDER_PRODUCT_IMAGE,
  type Cart,
} from '@/lib/marketplaceApi'
import type { DeliveryQuoteItem } from '@/lib/geoApi'
import { formatDeliveryVehicleDisplay } from '@/lib/deliveryVehicles'

interface CheckoutOrderSummaryProps {
  cart: Pick<Cart, 'items' | 'subtotal' | 'currency' | 'item_count'>
  total: number
  deliveryType: 'PICKUP' | 'DELIVERY'
  deliveryAddress?: string
  customerPhone?: string
  customerNote?: string
  discountAmount?: number
  deliveryFee?: number
  deliveryQuotes?: DeliveryQuoteItem[]
  freeDeliveryShopIds?: string[]
  references?: string[]
  className?: string
}

export function CheckoutOrderSummary({
  cart,
  total,
  deliveryType,
  deliveryAddress,
  customerPhone,
  customerNote,
  discountAmount = 0,
  deliveryFee = 0,
  deliveryQuotes,
  freeDeliveryShopIds = [],
  references,
  className = '',
}: CheckoutOrderSummaryProps) {
  const itemLabel =
    cart.item_count <= 1 ? `${cart.item_count} article` : `${cart.item_count} articles`

  return (
    <div
      className={`bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-200/40 ${className}`}
    >
      <h3 className="text-xl font-extrabold text-slate-900 mb-6">Résumé de la commande</h3>

      <ul className="space-y-3 mb-6 max-h-56 overflow-y-auto">
        {cart.items.map(item => (
          <li key={item.id} className="flex gap-3 items-center">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.product.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{item.product.name}</p>
              {item.variant && <p className="text-xs text-slate-400">{item.variant.name}</p>}
              <p className="text-xs text-slate-500">× {item.quantity}</p>
            </div>
            <span className="text-sm font-bold text-slate-900 shrink-0">
              {formatPrice(item.line_total, cart.currency)}
            </span>
          </li>
        ))}
      </ul>

      <div className="space-y-3 mb-6 pt-4 border-t border-slate-100">
        <div className="flex justify-between text-sm text-slate-600 font-medium">
          <span>Sous-total ({itemLabel})</span>
          <span className="font-bold text-slate-900">{formatPrice(cart.subtotal, cart.currency)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-emerald-700 font-medium">
            <span>Remise promo</span>
            <span className="font-bold">− {formatPrice(discountAmount, cart.currency)}</span>
          </div>
        )}
        {deliveryType === 'DELIVERY' && (
          <div className="flex justify-between text-sm text-slate-600 font-medium">
            <span>Livraison</span>
            <span className="font-bold text-slate-900">
              {deliveryFee > 0 ? formatPrice(deliveryFee, cart.currency) : 'Gratuite'}
            </span>
          </div>
        )}
        {deliveryType === 'DELIVERY' && deliveryQuotes && deliveryQuotes.length > 0 && (
          <ul className="space-y-2 text-xs text-slate-500">
            {deliveryQuotes.map(q => {
              const promoFree = freeDeliveryShopIds.includes(q.shop_id)
              return (
                <li key={q.shop_id} className="bg-slate-50 rounded-lg px-3 py-2">
                  <span className="font-bold text-slate-700">{q.shop_name}</span>
                  {q.available ? (
                    <>
                      {' '}— {q.zone_name && `${q.zone_name} · `}
                      {formatDeliveryVehicleDisplay(q.vehicle ?? 'MOTO', q.eta_min_minutes, q.eta_max_minutes)}
                      {' '}·{' '}
                      {promoFree ? (
                        <>
                          <span className="line-through text-slate-400">{formatPrice(q.fee, cart.currency)}</span>
                          {' '}
                          <span className="text-emerald-700 font-bold">Offerte</span>
                        </>
                      ) : (
                        formatPrice(q.fee, cart.currency)
                      )}
                    </>
                  ) : (
                    <span className="text-red-600"> — {q.message ?? 'Indisponible'}</span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        <div className="flex justify-between text-sm text-slate-600 font-medium">
          <span>Mode de retrait</span>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold">
            {deliveryType === 'PICKUP' ? 'Retrait sur place' : 'Livraison'}
          </span>
        </div>
        {deliveryType === 'DELIVERY' && deliveryAddress && (
          <div className="text-sm text-slate-600">
            <span className="font-bold text-slate-900 block mb-1">Adresse</span>
            <p className="text-slate-500 leading-relaxed">{deliveryAddress}</p>
          </div>
        )}
        {customerPhone && (
          <div className="flex justify-between text-sm text-slate-600 font-medium gap-4">
            <span>Téléphone</span>
            <span className="font-bold text-slate-900 text-right">{customerPhone}</span>
          </div>
        )}
        {customerNote && (
          <div className="text-sm text-slate-600">
            <span className="font-bold text-slate-900 block mb-1">Note</span>
            <p className="text-slate-500 leading-relaxed">{customerNote}</p>
          </div>
        )}
        {references && references.length > 0 && (
          <div className="text-sm text-slate-600">
            <span className="font-bold text-slate-900 block mb-1">
              Référence{references.length > 1 ? 's' : ''}
            </span>
            <p className="text-slate-500 font-mono text-xs break-all">{references.join(', ')}</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-end pt-4 border-t border-slate-100">
        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total</span>
        <span className="text-2xl font-extrabold text-brand-600">
          {formatPrice(total, cart.currency)}
        </span>
      </div>

      <div className="text-center mt-6 pt-4 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
          <Lock size={12} /> Paiement 100% sécurisé
        </p>
      </div>
    </div>
  )
}
