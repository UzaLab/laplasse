'use client'

import { StaticLocationMap } from '@/features/maps/components/StaticLocationMap'
import { openDirectionsTo } from '@/lib/mapsUtils'

interface DeliveryMapPanelProps {
  latitude: number
  longitude: number
  status: string
}

export function DeliveryMapPanel({ latitude, longitude, status }: DeliveryMapPanelProps) {
  if (status === 'DELIVERED' || status === 'CANCELLED' || status === 'FAILED') {
    return null
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-900">Position du livreur</p>
        <button
          type="button"
          onClick={() => openDirectionsTo(latitude, longitude)}
          className="text-xs font-bold text-brand-600 hover:text-brand-700"
        >
          Ouvrir dans Maps
        </button>
      </div>
      <StaticLocationMap latitude={latitude} longitude={longitude} heightClass="h-52" />
      <p className="text-[11px] text-slate-400 px-4 py-2">
        Position approximative — mise à jour à chaque étape de livraison.
      </p>
    </div>
  )
}
