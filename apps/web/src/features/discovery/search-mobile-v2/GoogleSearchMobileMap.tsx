'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ApiMerchant } from '@/lib/api'
import { brandColors } from '@/lib/brandColors'
import { loadGoogleMaps } from '@/features/maps/googleMapsLoader'
import type { UserCoordinates } from './useSearchMobileNearby'

interface Props {
  merchants: ApiMerchant[]
  selectedId: string | null
  onSelect: (id: string) => void
  center: { lat: number; lng: number }
  userLocation?: UserCoordinates | null
  radiusKm?: number
  onFailed?: () => void
}

export function GoogleSearchMobileMap({
  merchants,
  selectedId,
  onSelect,
  center,
  userLocation,
  radiusKm = 2,
  onFailed,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const overlaysRef = useRef<Array<google.maps.Marker | google.maps.Circle>>([])
  const onSelectRef = useRef(onSelect)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  const mappable = useMemo(
    () => merchants.filter(m => m.location?.latitude != null && m.location?.longitude != null),
    [merchants],
  )

  const mapCenter = userLocation ?? center

  useEffect(() => {
    if (failed || !hostRef.current) return

    let cancelled = false

    void loadGoogleMaps()
      .then(google => {
        if (cancelled || !hostRef.current) return

        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(hostRef.current, {
            center: mapCenter,
            zoom: 13,
            disableDefaultUI: true,
            zoomControl: false,
            gestureHandling: 'greedy',
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          })
        }

        const map = mapRef.current
        overlaysRef.current.forEach(o => o.setMap(null))
        overlaysRef.current = []

        const bounds = new google.maps.LatLngBounds()
        bounds.extend(mapCenter)

        if (userLocation && radiusKm) {
          const circle = new google.maps.Circle({
            map,
            center: userLocation,
            radius: radiusKm * 1000,
            strokeColor: brandColors[500],
            strokeOpacity: 0.35,
            strokeWeight: 2,
            fillColor: brandColors[500],
            fillOpacity: 0.08,
          })
          overlaysRef.current.push(circle)
        }

        if (userLocation) {
          const userMarker = new google.maps.Marker({
            map,
            position: userLocation,
            title: 'Ma position',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: brandColors.slate900,
              fillOpacity: 1,
              strokeColor: brandColors.white,
              strokeWeight: 3,
            },
          })
          overlaysRef.current.push(userMarker)
          bounds.extend(userLocation)
        }

        for (const merchant of mappable) {
          const pos = {
            lat: merchant.location!.latitude!,
            lng: merchant.location!.longitude!,
          }
          bounds.extend(pos)
          const active = merchant.id === selectedId
          const marker = new google.maps.Marker({
            map,
            position: pos,
            title: merchant.business_name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: active ? 12 : 10,
              fillColor: active ? brandColors[500] : brandColors.white,
              fillOpacity: 1,
              strokeColor: active ? brandColors.white : brandColors[500],
              strokeWeight: active ? 3 : 2,
            },
          })
          marker.addListener('click', () => onSelectRef.current(merchant.id))
          overlaysRef.current.push(marker)
        }

        if (userLocation && radiusKm) {
          map.setCenter(userLocation)
          map.setZoom(radiusKm <= 3 ? 14 : radiusKm <= 6 ? 13 : 12)
        } else if (mappable.length > 1) {
          map.fitBounds(bounds, 48)
        } else if (mappable.length === 1) {
          map.setCenter({
            lat: mappable[0].location!.latitude!,
            lng: mappable[0].location!.longitude!,
          })
          map.setZoom(14)
        } else {
          map.setCenter(mapCenter)
          map.setZoom(13)
        }
      })
      .catch(() => {
        setFailed(true)
        onFailed?.()
      })

    return () => {
      cancelled = true
    }
  }, [center, failed, mapCenter, mappable, radiusKm, selectedId, userLocation, onFailed])

  if (failed) return null

  return (
    <div ref={hostRef} className="search-mobile-map-host h-full w-full" />
  )
}
