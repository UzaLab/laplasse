'use client'

import { Building2, MapPin, Truck, Users } from 'lucide-react'
import { merchantApiFetch } from '@/lib/merchantApi'
import { notify } from '@/lib/notify'
import { useEffect, useState } from 'react'

import type { FulfilmentMode } from '@/lib/deliveryFulfilmentModes'
import { fulfilmentPricingExplanation } from '@/lib/deliveryFulfilmentModes'
import { FulfilmentPricingBanner } from '@/features/merchant/components/FulfilmentPricingBanner'

const MODES: Array<{
  value: FulfilmentMode
  label: string
  desc: string
  icon: typeof Truck
  tab?: string
}> = [
  {
    value: 'PLATFORM_RIDER',
    label: 'Réseau LaPlasse',
    desc: 'Livreurs indépendants de la plateforme reçoivent les courses automatiquement.',
    icon: Truck,
  },
  {
    value: 'MERCHANT_OWN',
    label: 'Ma flotte',
    desc: 'Vos livreurs (compte app) reçoivent les courses que vous leur assignez.',
    icon: Users,
    tab: 'team',
  },
  {
    value: 'LOGISTICS_PARTNER',
    label: 'Partenaire logistique',
    desc: 'Externalisez à une structure vérifiée avec score de performance.',
    icon: Building2,
    tab: 'partners',
  },
]

interface ShopDeliveryOverviewPanelProps {
  merchantId: string
  onNavigateTab: (tab: string) => void
}

export function ShopDeliveryOverviewPanel({ merchantId, onNavigateTab }: ShopDeliveryOverviewPanelProps) {
  const [mode, setMode] = useState<FulfilmentMode>('PLATFORM_RIDER')
  const [saving, setSaving] = useState(false)
  const [zoneCount, setZoneCount] = useState(0)

  useEffect(() => {
    if (!merchantId) return
    void (async () => {
      const [profileRes, zonesRes] = await Promise.all([
        merchantApiFetch('/merchants/me/profile', merchantId),
        merchantApiFetch('/merchants/me/delivery-zones', merchantId),
      ])
      if (profileRes.ok) {
        const profile = await profileRes.json() as { delivery_fulfilment_default?: FulfilmentMode }
        setMode(profile.delivery_fulfilment_default ?? 'PLATFORM_RIDER')
      }
      if (zonesRes.ok) {
        const zones = await zonesRes.json() as unknown[]
        setZoneCount(zones.length)
      }
    })()
  }, [merchantId])

  const saveMode = async (next: FulfilmentMode) => {
    if (!merchantId) return
    setSaving(true)
    const res = await merchantApiFetch('/merchants/me/delivery-settings', merchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delivery_fulfilment_default: next }),
    })
    setSaving(false)
    if (!res.ok) {
      notify.error('Erreur lors de la sauvegarde')
      return
    }
    setMode(next)
    notify.success('Mode par défaut enregistré')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Livraison</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-2xl">
          Configurez où vous livrez, comment vous expédiez les commandes, et qui transporte vos colis.
        </p>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: MapPin, label: 'Zones & tarifs', desc: `${zoneCount} zone${zoneCount !== 1 ? 's' : ''}`, tab: 'zones' },
          { icon: Users, label: 'Ma flotte', desc: 'Livreurs internes', tab: 'team' },
          { icon: Building2, label: 'Partenaires', desc: 'Structures logistiques', tab: 'partners' },
        ].map(item => (
          <button
            key={item.tab}
            type="button"
            onClick={() => onNavigateTab(item.tab)}
            className="text-left bg-white border border-slate-100 rounded-2xl p-4 hover:border-amber-200 hover:shadow-sm transition-all"
          >
            <item.icon size={20} className="text-amber-600 mb-2" />
            <p className="font-bold text-slate-900 text-sm">{item.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
          </button>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900">1. Mode d&apos;expédition par défaut</h3>
          <p className="text-xs text-slate-500 mt-1">
            Détermine qui livre et quelle source de tarif s&apos;applique au checkout.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {MODES.map(opt => (
            <button
              key={opt.value}
              type="button"
              disabled={saving}
              onClick={() => void saveMode(opt.value)}
              className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-colors ${
                mode === opt.value
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <opt.icon size={20} className={`shrink-0 mt-0.5 ${mode === opt.value ? 'text-amber-400' : 'text-slate-400'}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{opt.label}</span>
                <span className={`block text-xs mt-0.5 ${mode === opt.value ? 'text-slate-300' : 'text-slate-500'}`}>
                  {opt.desc}
                </span>
                {opt.tab && mode !== opt.value && (
                  <span
                    role="link"
                    tabIndex={0}
                    onClick={e => { e.stopPropagation(); onNavigateTab(opt.tab!) }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onNavigateTab(opt.tab!) } }}
                    className={`inline-block mt-2 text-xs font-bold underline ${mode === opt.value ? 'text-amber-300' : 'text-amber-600'}`}
                  >
                    Configurer →
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </section>

      <FulfilmentPricingBanner mode={mode} zoneCount={zoneCount} />

      <p className="text-xs text-slate-400 text-center">
        {fulfilmentPricingExplanation(mode).zonesHint}
      </p>
    </div>
  )
}
