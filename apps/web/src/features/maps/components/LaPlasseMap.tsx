'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { hasGoogleMapsWebKey } from '@/lib/googleMaps'
import type { LaPlasseMapProps } from '@/features/maps/types'

const GoogleMapCanvas = dynamic(
  () => import('./GoogleMapCanvas').then(m => m.GoogleMapCanvas),
  { ssr: false },
)

const OsmMapCanvas = dynamic(
  () => import('./OsmMapCanvas').then(m => m.OsmMapCanvas),
  { ssr: false },
)

/** Carte unifiée : Google Maps si clé présente, sinon OpenStreetMap. */
export function LaPlasseMap(props: LaPlasseMapProps) {
  const [googleFailed, setGoogleFailed] = useState(false)
  const useGoogle = hasGoogleMapsWebKey() && !googleFailed

  useEffect(() => {
    setGoogleFailed(false)
  }, [props.zones, props.lat, props.lng, props.routePolyline])

  if (useGoogle) {
    return <GoogleMapCanvas {...props} onFailed={() => setGoogleFailed(true)} />
  }

  return <OsmMapCanvas {...props} />
}

export type { MapZonePoint } from '@/features/maps/types'
