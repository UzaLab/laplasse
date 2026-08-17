'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { loadGoogleMaps } from '@/features/maps/googleMapsLoader'
import type { LaPlasseMapProps } from '@/features/maps/types'
import { boundsFromZones, defaultMapCenter } from '@/lib/googleMaps'

const DEFAULT_COMMUNE_RADIUS = 2800

type Props = LaPlasseMapProps & { onFailed?: () => void }

export function GoogleMapCanvas({
  lat,
  lng,
  radiusMeters = 4500,
  zones,
  routePolyline,
  className,
  onFailed,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const overlaysRef = useRef<Array<google.maps.Marker | google.maps.Circle | google.maps.Polyline>>([])
  const [failed, setFailed] = useState(false)

  const points = useMemo(() => {
    if (zones?.length) return zones
    if (lat != null && lng != null) return [{ lat, lng, radiusMeters }]
    return []
  }, [zones, lat, lng, radiusMeters])

  const center = useMemo(() => defaultMapCenter(points), [points])

  useEffect(() => {
    if (failed || !containerRef.current || points.length === 0) return

    let cancelled = false

    void loadGoogleMaps()
      .then(google => {
        if (cancelled || !containerRef.current) return

        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(containerRef.current, {
            center,
            zoom: 12,
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: 'cooperative',
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          })
        }

        const map = mapRef.current
        overlaysRef.current.forEach(o => {
          if ('setMap' in o) o.setMap(null)
        })
        overlaysRef.current = []

        if (routePolyline && routePolyline.length > 1) {
          const line = new google.maps.Polyline({
            path: routePolyline.map(([plat, plng]) => ({ lat: plat, lng: plng })),
            strokeColor: '#059669',
            strokeOpacity: 0.85,
            strokeWeight: 5,
            map,
          })
          overlaysRef.current.push(line)
        }

        for (const zone of points) {
          const marker = new google.maps.Marker({
            position: { lat: zone.lat, lng: zone.lng },
            map,
            title: zone.label,
          })
          overlaysRef.current.push(marker)

          const r = zone.radiusMeters ?? DEFAULT_COMMUNE_RADIUS
          if (r > 0) {
            const circle = new google.maps.Circle({
              map,
              center: { lat: zone.lat, lng: zone.lng },
              radius: r,
              strokeColor: '#059669',
              strokeWeight: 2,
              fillColor: '#10b981',
              fillOpacity: points.length > 1 ? 0.18 : 0.12,
            })
            overlaysRef.current.push(circle)
          }
        }

        const bounds = boundsFromZones(points)
        if (bounds) {
          map.fitBounds(bounds, 32)
        } else {
          map.setCenter(center)
        }
      })
      .catch(() => {
        setFailed(true)
        onFailed?.()
      })

    return () => {
      cancelled = true
    }
  }, [center, failed, points, routePolyline])

  if (failed || points.length === 0) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={className ?? 'h-56 w-full rounded-2xl overflow-hidden border border-slate-200'}
    />
  )
}
