'use client'

import { LaPlasseMap } from '@/features/maps/components/LaPlasseMap'
import { coordsFromGeoEntity } from '@/lib/cityCoords'

interface Props {
  latitude: number
  longitude: number
  label?: string
  className?: string
  heightClass?: string
}

export function StaticLocationMap({
  latitude,
  longitude,
  label,
  className,
  heightClass = 'h-56',
}: Props) {
  const center = coordsFromGeoEntity({ latitude, longitude })

  return (
    <div className={className ?? 'w-full rounded-2xl overflow-hidden border border-slate-200'}>
      <LaPlasseMap
        lat={center.lat}
        lng={center.lng}
        radiusMeters={0}
        className={`${heightClass} w-full`}
      />
      {label ? <p className="sr-only">{label}</p> : null}
    </div>
  )
}
