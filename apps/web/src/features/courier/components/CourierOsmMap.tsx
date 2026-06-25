'use client'

import { useEffect, useMemo, Fragment } from 'react'
import { MapContainer, TileLayer, Circle, Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const pinIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

export interface MapZonePoint {
  lat: number
  lng: number
  label?: string
  radiusMeters?: number
}

interface CourierOsmMapProps {
  /** Point unique (legacy) */
  lat?: number
  lng?: number
  radiusMeters?: number
  /** Multi-sélection : un pin + cercle par zone */
  zones?: MapZonePoint[]
  className?: string
}

const DEFAULT_COMMUNE_RADIUS = 2800

function FitMapToZones({ zones }: { zones: MapZonePoint[] }) {
  const map = useMap()
  const key = useMemo(
    () => zones.map(z => `${z.lat.toFixed(5)},${z.lng.toFixed(5)},${z.radiusMeters ?? 0}`).join('|'),
    [zones],
  )

  useEffect(() => {
    if (zones.length === 0) return

    if (zones.length === 1) {
      const z = zones[0]
      const r = z.radiusMeters ?? DEFAULT_COMMUNE_RADIUS
      const delta = (r / 111_320) * 1.4
      map.fitBounds(
        L.latLngBounds(
          [z.lat - delta, z.lng - delta],
          [z.lat + delta, z.lng + delta],
        ),
        { padding: [24, 24], maxZoom: 14 },
      )
      return
    }

    const bounds = L.latLngBounds(zones.map(z => [z.lat, z.lng] as [number, number]))
    for (const z of zones) {
      const r = z.radiusMeters ?? DEFAULT_COMMUNE_RADIUS
      const dLat = r / 111_320
      const dLng = r / (111_320 * Math.cos((z.lat * Math.PI) / 180))
      bounds.extend([z.lat - dLat, z.lng - dLng])
      bounds.extend([z.lat + dLat, z.lng + dLng])
    }
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 13 })
  }, [map, key, zones])

  return null
}

export function CourierOsmMap({
  lat,
  lng,
  radiusMeters = 4500,
  zones,
  className,
}: CourierOsmMapProps) {
  const points: MapZonePoint[] = useMemo(() => {
    if (zones?.length) return zones
    if (lat != null && lng != null) {
      return [{ lat, lng, radiusMeters }]
    }
    return []
  }, [zones, lat, lng, radiusMeters])

  const center = useMemo(() => {
    if (points.length === 0) return { lat: 5.36, lng: -4.0083 }
    const sum = points.reduce(
      (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
      { lat: 0, lng: 0 },
    )
    return { lat: sum.lat / points.length, lng: sum.lng / points.length }
  }, [points])

  useEffect(() => {
    const t = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 200)
    return () => window.clearTimeout(t)
  }, [center.lat, center.lng, points.length])

  if (points.length === 0) {
    return (
      <div className={className ?? 'h-56 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50'} />
    )
  }

  return (
    <div className={`laplasse-leaflet-map ${className ?? 'h-56 w-full rounded-2xl overflow-hidden border border-slate-200'}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full"
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitMapToZones zones={points} />
        {points.map((zone, i) => {
          const r = zone.radiusMeters ?? DEFAULT_COMMUNE_RADIUS
          return (
            <Fragment key={`${zone.lat}-${zone.lng}-${zone.label ?? i}`}>
              <Marker position={[zone.lat, zone.lng]} icon={pinIcon}>
                {zone.label && (
                  <Tooltip direction="top" offset={[0, -36]} opacity={0.95}>
                    {zone.label}
                  </Tooltip>
                )}
              </Marker>
              {r > 0 && (
                <Circle
                  center={[zone.lat, zone.lng]}
                  radius={r}
                  pathOptions={{
                    color: '#059669',
                    fillColor: '#10b981',
                    fillOpacity: points.length > 1 ? 0.18 : 0.12,
                    weight: 2,
                  }}
                />
              )}
            </Fragment>
          )
        })}
      </MapContainer>
    </div>
  )
}
