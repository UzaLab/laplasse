'use client'

import { MapPin, Navigation } from 'lucide-react'
import { StaticLocationMap } from '@/features/maps/components/StaticLocationMap'
import { openDirectionsTo, openDirectionsToAddress } from '@/lib/mapsUtils'

export interface PickupLocation {
  id: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
}

interface Props {
  locations: PickupLocation[]
  className?: string
  title?: string
}

export function PickupLocationPanel({
  locations,
  className,
  title = 'Lieu de retrait',
}: Props) {
  if (!locations.length) return null

  return (
    <div className={className ?? 'space-y-4'}>
      <p className="text-sm font-bold text-slate-900">{title}</p>
      {locations.map(loc => {
        const hasCoords = loc.latitude != null && loc.longitude != null
        const hasAddress = Boolean(loc.address?.trim())

        return (
          <div
            key={loc.id}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <MapPin size={18} className="text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">{loc.name}</p>
                {hasAddress ? (
                  <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{loc.address}</p>
                ) : (
                  <p className="text-sm text-slate-400 mt-0.5">
                    Adresse exacte non renseignée — contactez l&apos;établissement si besoin.
                  </p>
                )}
              </div>
            </div>

            {hasCoords && (
              <StaticLocationMap
                latitude={loc.latitude!}
                longitude={loc.longitude!}
                label={loc.name}
                heightClass="h-44"
              />
            )}

            {hasCoords ? (
              <button
                type="button"
                onClick={() => openDirectionsTo(loc.latitude!, loc.longitude!)}
                className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-800"
              >
                <Navigation size={16} />
                Itinéraire Google Maps
              </button>
            ) : hasAddress ? (
              <button
                type="button"
                onClick={() => openDirectionsToAddress(loc.address!)}
                className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-800"
              >
                <Navigation size={16} />
                Voir sur Google Maps
              </button>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
