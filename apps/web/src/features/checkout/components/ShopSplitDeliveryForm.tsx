'use client'

import { Loader2 } from 'lucide-react'
import type { Cart } from '@/lib/marketplaceApi'
import { formatPrice } from '@/lib/marketplaceApi'
import type { DeliveryQuoteItem, GeoCity, GeoCommune } from '@/lib/geoApi'
import { getDeliveryVehicleLabel } from '@/lib/deliveryVehicles'
import { formatDeliveryEtaShort } from '@/lib/deliveryEta'

export interface ShopDeliveryState {
  deliveryType: 'PICKUP' | 'DELIVERY'
  deliveryCityId: string
  deliveryCommuneId: string
  deliveryDistrict: string
  deliveryAddressDetail: string
}

interface ShopSplitDeliveryFormProps {
  cart: Cart
  cities: GeoCity[]
  communesByShop: Record<string, GeoCommune[]>
  shopDeliveries: Record<string, ShopDeliveryState>
  deliveryQuotes: DeliveryQuoteItem[]
  quoteLoading: boolean
  onChange: (shopId: string, patch: Partial<ShopDeliveryState>) => void
  onCityChange: (shopId: string, cityId: string) => void
}

export function ShopSplitDeliveryForm({
  cart,
  cities,
  communesByShop,
  shopDeliveries,
  deliveryQuotes,
  quoteLoading,
  onChange,
  onCityChange,
}: ShopSplitDeliveryFormProps) {
  return (
    <div className="space-y-4">
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4">
        <p className="text-sm font-bold text-brand-900">Livraison par boutique</p>
        <p className="text-xs text-brand-700 mt-0.5">
          Choisissez retrait ou livraison pour chaque vendeur — adresses différentes possibles.
        </p>
      </div>

      {cart.merchants.map(merchant => {
        const cfg = shopDeliveries[merchant.id] ?? {
          deliveryType: 'PICKUP' as const,
          deliveryCityId: '',
          deliveryCommuneId: '',
          deliveryDistrict: '',
          deliveryAddressDetail: '',
        }
        const communes = communesByShop[merchant.id] ?? []
        const quote = deliveryQuotes.find(q => q.shop_id === merchant.id)

        return (
          <div
            key={merchant.id}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-extrabold text-slate-900">{merchant.business_name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {merchant.item_count} article{merchant.item_count > 1 ? 's' : ''} · {formatPrice(merchant.subtotal)}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {(['PICKUP', 'DELIVERY'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onChange(merchant.id, { deliveryType: mode })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    cfg.deliveryType === mode
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {mode === 'PICKUP' ? 'Retrait sur place' : 'Livraison'}
                </button>
              ))}
            </div>

            {cfg.deliveryType === 'DELIVERY' && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Ville</label>
                  <select
                    value={cfg.deliveryCityId}
                    onChange={e => onCityChange(merchant.id, e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
                  >
                    <option value="">Choisir une ville</option>
                    {cities.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Commune</label>
                  <select
                    value={cfg.deliveryCommuneId}
                    onChange={e => onChange(merchant.id, { deliveryCommuneId: e.target.value })}
                    disabled={!cfg.deliveryCityId}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400 disabled:opacity-50"
                  >
                    <option value="">Choisir une commune</option>
                    {communes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Quartier *</label>
                  <input
                    type="text"
                    value={cfg.deliveryDistrict}
                    onChange={e => onChange(merchant.id, { deliveryDistrict: e.target.value })}
                    placeholder="ex. près du marché…"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Complément (optionnel)</label>
                  <input
                    type="text"
                    value={cfg.deliveryAddressDetail}
                    onChange={e => onChange(merchant.id, { deliveryAddressDetail: e.target.value })}
                    placeholder="Immeuble, porte, repères…"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
                  />
                </div>

                {quoteLoading && cfg.deliveryCityId && cfg.deliveryCommuneId ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 size={14} className="animate-spin" /> Calcul des frais…
                  </div>
                ) : quote ? (
                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                    {quote.available ? (
                      <>
                        <p className="font-bold text-slate-900">
                          {formatPrice(quote.fee)}
                          {quote.zone_name && (
                            <span className="font-medium text-slate-500"> · {quote.zone_name}</span>
                          )}
                        </p>
                        {quote.eta_min != null && quote.eta_max != null && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {getDeliveryVehicleLabel(quote.vehicle ?? 'MOTO').toLowerCase()} · {formatDeliveryEtaShort(quote.eta_min, quote.eta_max, quote.eta_unit ?? 'MINUTES')}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-red-600 text-xs font-medium">{quote.message ?? 'Livraison indisponible'}</p>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
