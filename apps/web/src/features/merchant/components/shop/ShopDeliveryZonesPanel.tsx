'use client'

import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { merchantApiFetch } from '@/lib/merchantApi'
import { parseApiError } from '@/lib/marketplaceApi'
import { notify } from '@/lib/notify'
import type { FulfilmentMode } from '@/lib/deliveryFulfilmentModes'
import { FulfilmentPricingBanner } from '@/features/merchant/components/FulfilmentPricingBanner'
import { DeliveryZonesManager } from '@/features/merchant/components/DeliveryZonesManager'
import type { DeliveryZoneRow } from '@/lib/deliveryZoneUtils'
import { buildZoneApiBody } from '@/lib/deliveryZoneUtils'

export function ShopDeliveryZonesPanel({ merchantId }: { merchantId: string }) {
  const [zones, setZones] = useState<DeliveryZoneRow[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<FulfilmentMode>('PLATFORM_RIDER')
  const [countryCode, setCountryCode] = useState<string | undefined>()

  const load = async () => {
    if (!merchantId) return
    setLoading(true)
    const [profileRes, zonesRes] = await Promise.all([
      merchantApiFetch('/merchants/me/profile', merchantId),
      merchantApiFetch('/merchants/me/delivery-zones', merchantId),
    ])
    if (profileRes.ok) {
      const profile = await profileRes.json() as { delivery_fulfilment_default?: FulfilmentMode; country?: string }
      setMode(profile.delivery_fulfilment_default ?? 'PLATFORM_RIDER')
      if (profile.country) setCountryCode(profile.country.toUpperCase())
    }
    if (zonesRes.ok) setZones(await zonesRes.json())
    setLoading(false)
  }

  useEffect(() => {
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantId])

  const apiCall = async (path: string, method: string, body?: ReturnType<typeof buildZoneApiBody>) => {
    if (!merchantId) return false
    const res = await merchantApiFetch(path, merchantId, {
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
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <MapPin size={22} className="text-brand-500" /> Zones & tarifs
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Configurez vos zones pour le mode « Ma flotte ». Le tarif au checkout dépend du mode d&apos;expédition choisi dans l&apos;onglet Vue d&apos;ensemble.
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
  )
}
