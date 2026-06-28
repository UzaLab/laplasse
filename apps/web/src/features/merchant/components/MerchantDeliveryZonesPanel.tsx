'use client'

import { useEffect, useState } from 'react'
import { Building2, Loader2, MapPin, Truck, Users } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { parseApiError } from '@/lib/marketplaceApi'
import { merchantApiFetch } from '@/lib/merchantApi'
import { notify } from '@/lib/notify'
import type { FulfilmentMode } from '@/lib/deliveryFulfilmentModes'
import { FulfilmentPricingBanner } from '@/features/merchant/components/FulfilmentPricingBanner'
import { DeliveryZonesManager } from '@/features/merchant/components/DeliveryZonesManager'
import type { DeliveryZoneRow } from '@/lib/deliveryZoneUtils'
import { buildZoneApiBody } from '@/lib/deliveryZoneUtils'
import { getCountryCode } from '@/lib/country'

const MODES: Array<{ value: FulfilmentMode; label: string; desc: string; icon: typeof Truck }> = [
  {
    value: 'PLATFORM_RIDER',
    label: 'Réseau LaPlasse',
    desc: 'Livreurs indépendants de la plateforme reçoivent les courses automatiquement.',
    icon: Truck,
  },
  {
    value: 'MERCHANT_OWN',
    label: 'Ma flotte',
    desc: 'Vos livreurs internes assignés depuis votre backoffice.',
    icon: Users,
  },
  {
    value: 'LOGISTICS_PARTNER',
    label: 'Partenaire logistique',
    desc: 'Externalisez à une structure vérifiée. Signez un contrat depuis votre boutique.',
    icon: Building2,
  },
]

export function MerchantDeliveryZonesPanel() {
  const { activeMerchantId } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'overview' | 'zones'>('overview')
  const [mode, setMode] = useState<FulfilmentMode>('PLATFORM_RIDER')
  const [savingMode, setSavingMode] = useState(false)
  const [zones, setZones] = useState<DeliveryZoneRow[]>([])
  const [loading, setLoading] = useState(true)
  const [countryCode, setCountryCode] = useState(getCountryCode())

  const load = async () => {
    setLoading(true)
    const [profileRes, zonesRes] = await Promise.all([
      merchantApiFetch('/merchants/me/profile', activeMerchantId),
      merchantApiFetch('/merchants/me/delivery-zones', activeMerchantId),
    ])
    if (profileRes.ok) {
      const merchant = await profileRes.json() as {
        delivery_fulfilment_default?: FulfilmentMode
        location?: { country?: string }
      }
      setMode(merchant.delivery_fulfilment_default ?? 'PLATFORM_RIDER')
      if (merchant.location?.country) setCountryCode(merchant.location.country.toUpperCase())
    }
    if (zonesRes.ok) setZones(await zonesRes.json())
    setLoading(false)
  }

  useEffect(() => {
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMerchantId])

  const saveMode = async (next: FulfilmentMode) => {
    setSavingMode(true)
    const res = await merchantApiFetch('/merchants/me/delivery-settings', activeMerchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delivery_fulfilment_default: next }),
    })
    setSavingMode(false)
    if (res.ok) {
      setMode(next)
      notify.success('Mode d\'expédition enregistré')
    } else {
      notify.error(await parseApiError(res))
    }
  }

  const apiCall = async (path: string, method: string, body?: ReturnType<typeof buildZoneApiBody>) => {
    const res = await merchantApiFetch(path, activeMerchantId, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      notify.error(await parseApiError(res))
      return false
    }
    return true
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(['overview', 'zones'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === t
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t === 'overview' ? 'Vue d\'ensemble' : 'Zones & tarifs'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Livraison</h2>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              Choisissez d&apos;abord comment vos commandes sont expédiées, puis configurez vos zones si vous utilisez votre propre flotte.
            </p>
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('zones')}
              className="text-left bg-white border border-slate-100 rounded-2xl p-4 hover:border-amber-200 hover:shadow-sm transition-all"
            >
              <MapPin size={20} className="text-amber-600 mb-2" />
              <p className="font-bold text-slate-900 text-sm">Zones & tarifs</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {loading ? '…' : `${zones.length} zone${zones.length !== 1 ? 's' : ''}`}
              </p>
            </button>
            <div className="text-left bg-white border border-slate-100 rounded-2xl p-4">
              <Truck size={20} className="text-amber-600 mb-2" />
              <p className="font-bold text-slate-900 text-sm">Mode actif</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {MODES.find(m => m.value === mode)?.label ?? mode}
              </p>
            </div>
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
                  disabled={savingMode}
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
                  </span>
                </button>
              ))}
            </div>
          </section>

          <FulfilmentPricingBanner mode={mode} zoneCount={zones.length} />
        </div>
      )}

      {activeTab === 'zones' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin size={22} className="text-amber-600" /> Zones & tarifs
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Mode actuel : <strong>{MODES.find(m => m.value === mode)?.label}</strong>
            </p>
          </div>

          <FulfilmentPricingBanner mode={mode} zoneCount={zones.length} />

          <DeliveryZonesManager
            zones={zones}
            loading={loading}
            countryCode={countryCode}
            onRefresh={() => void load()}
            onCreate={body => apiCall('/merchants/me/delivery-zones', 'POST', body)}
            onUpdate={(id, body) => apiCall(`/merchants/me/delivery-zones/${id}`, 'PATCH', body)}
            onDelete={id => apiCall(`/merchants/me/delivery-zones/${id}`, 'DELETE')}
          />
        </div>
      )}
    </div>
  )
}
